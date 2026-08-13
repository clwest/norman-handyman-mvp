#!/usr/bin/env python3
"""JobFlow (norman-handyman-mvp) doc-claim verifier.

Compares what authoritative docs claim against runtime reality.
Standalone Python script (no Django coupling) — runs in CI without
booting the backend or installing the full dependency stack.

Ported from u-d-b's Session 1099 verifier framework
(`core/services/doc_claim_verification.py`), simplified for a
single-repo CLI invocation.

## Concepts

- ``ClaimResult`` — structured verdict for a single claim
- ``register_claim`` — decorator that adds a claim to the registry
- ``run_all`` / ``summarize`` — runner + reporter

## Adding a claim

```python
@register_claim(doc='docs/PROJECT_WHAT_IT_IS.md',
                claim_id='thing_count',
                description="Doc claims N things; verifier counts them.")
def _thing_count():
    actual = ...   # query the code via ast / filesystem
    expected = 7   # what the doc asserts
    return ClaimResult.build(
        expected=expected, actual=actual,
        severity='ok' if expected == actual else 'medium',
        fix_suggestion=f"Update docs/...md to '{actual} things'"
                       if expected != actual else None,
    )
```

## CLI

    python scripts/verify_doc_claims.py                     # all claims
    python scripts/verify_doc_claims.py --doc docs/...md
    python scripts/verify_doc_claims.py --only-drift
    python scripts/verify_doc_claims.py --format json
    python scripts/verify_doc_claims.py --list
    python scripts/verify_doc_claims.py --fail-on-drift     # for CI
"""
from __future__ import annotations

import argparse
import ast
import json
import sys
import time
import traceback
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Callable, Optional


REPO_ROOT = Path(__file__).resolve().parent.parent
BACKEND_ROOT = REPO_ROOT / "backend"


# ============================================================================
# Framework
# ============================================================================

SEVERITIES = ('ok', 'low', 'medium', 'high', 'critical', 'error')


@dataclass
class ClaimResult:
    matched: bool
    expected: Any
    actual: Any
    severity: str = 'ok'
    note: Optional[str] = None
    fix_suggestion: Optional[str] = None
    doc: str = ''
    claim_id: str = ''
    description: str = ''
    runtime_ms: int = 0
    error: Optional[str] = None

    @classmethod
    def build(
        cls,
        expected: Any,
        actual: Any,
        severity: str = 'ok',
        note: Optional[str] = None,
        fix_suggestion: Optional[str] = None,
    ) -> 'ClaimResult':
        if severity not in SEVERITIES:
            raise ValueError(f"severity must be one of {SEVERITIES}, got {severity!r}")
        return cls(
            matched=(severity == 'ok'),
            expected=expected,
            actual=actual,
            severity=severity,
            note=note,
            fix_suggestion=fix_suggestion,
        )

    def to_dict(self) -> dict:
        d = asdict(self)
        for k, v in list(d.items()):
            if isinstance(v, (list, tuple, set)):
                d[k] = [x if isinstance(x, (str, int, float, bool, type(None))) else str(x) for x in v]
            elif not isinstance(v, (str, int, float, bool, type(None), dict, list)):
                d[k] = str(v)
        return d


@dataclass
class _RegisteredClaim:
    doc: str
    claim_id: str
    description: str
    verifier: Callable[[], ClaimResult]


_REGISTRY: list[_RegisteredClaim] = []


def register_claim(doc: str, claim_id: str, description: str = ''):
    def _deco(fn: Callable[[], ClaimResult]) -> Callable[[], ClaimResult]:
        _REGISTRY.append(_RegisteredClaim(
            doc=doc, claim_id=claim_id,
            description=description or (fn.__doc__ or '').strip(),
            verifier=fn,
        ))
        return fn
    return _deco


def list_registered() -> list[dict]:
    return [
        {'doc': c.doc, 'claim_id': c.claim_id,
         'description': (c.description or '').strip().splitlines()[0] if c.description else ''}
        for c in _REGISTRY
    ]


def run_one(claim: _RegisteredClaim) -> ClaimResult:
    t0 = time.monotonic()
    try:
        result = claim.verifier()
        if not isinstance(result, ClaimResult):
            raise TypeError(
                f"Claim {claim.doc}:{claim.claim_id} returned {type(result).__name__}, expected ClaimResult"
            )
    except Exception as e:  # noqa: BLE001
        result = ClaimResult(
            matched=False, expected=None, actual=None, severity='error',
            note=f"Verifier raised {type(e).__name__}: {e}",
            error=traceback.format_exc(limit=3),
        )
    result.doc = claim.doc
    result.claim_id = claim.claim_id
    result.description = claim.description
    result.runtime_ms = int((time.monotonic() - t0) * 1000)
    return result


def run_all(doc_filter: Optional[str] = None, only_drift: bool = False) -> list[ClaimResult]:
    results: list[ClaimResult] = []
    for claim in _REGISTRY:
        if doc_filter and claim.doc != doc_filter:
            continue
        r = run_one(claim)
        if only_drift and r.severity == 'ok':
            continue
        results.append(r)
    return results


def summarize(results: list[ClaimResult]) -> dict:
    by_severity: dict[str, int] = {s: 0 for s in SEVERITIES}
    by_doc: dict[str, dict] = {}
    for r in results:
        by_severity[r.severity] = by_severity.get(r.severity, 0) + 1
        d = by_doc.setdefault(r.doc, {'total': 0, 'ok': 0, 'drift': 0, 'error': 0})
        d['total'] += 1
        if r.severity == 'ok':
            d['ok'] += 1
        elif r.severity == 'error':
            d['error'] += 1
        else:
            d['drift'] += 1
    return {'total': len(results), 'by_severity': by_severity, 'by_doc': by_doc}


# ============================================================================
# Claims — norman-handyman-mvp (JobFlow) seed
# ============================================================================
#
# Claims are AST-based so the verifier runs without booting Django or
# installing the full backend dependency stack. Anchored to
# docs/PROJECT_WHAT_IT_IS.md — the narrative source of truth. The doc
# carries `[adopt: please describe]` placeholders in several sections;
# baselines below pin code-side constants so the verifier surfaces real
# drift when code changes underneath the doc.


@register_claim(
    doc='docs/PROJECT_WHAT_IT_IS.md',
    claim_id='local_django_app_count',
    description="Baseline: N local Django apps; verifier ast-parses INSTALLED_APPS in backend/handyman/settings.py.",
)
def _local_django_app_count() -> ClaimResult:
    settings_path = BACKEND_ROOT / "handyman" / "settings.py"
    if not settings_path.is_file():
        return ClaimResult.build(
            expected=2, actual=None, severity='error',
            note=f"settings.py not found at {settings_path}",
        )
    tree = ast.parse(settings_path.read_text(encoding="utf-8"))
    local_apps: list[str] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id == 'INSTALLED_APPS':
                    if isinstance(node.value, (ast.List, ast.Tuple)):
                        for elt in node.value.elts:
                            if isinstance(elt, ast.Constant) and isinstance(elt.value, str):
                                # Local apps live under the handyman.* namespace
                                if elt.value.startswith('handyman.'):
                                    local_apps.append(elt.value)
    actual = len(local_apps)
    expected = 2  # backend/handyman/settings.py INSTALLED_APPS: handyman.core, handyman.api
    return ClaimResult.build(
        expected=expected, actual=actual,
        severity='ok' if expected == actual else 'medium',
        note=f"Local apps found: {sorted(local_apps)}" if expected != actual else None,
        fix_suggestion=(
            f"Local Django app count drifted: expected {expected}, found {actual}. "
            f"Update the baseline in scripts/verify_doc_claims.py or reconcile "
            f"backend/handyman/settings.py INSTALLED_APPS."
            if expected != actual else None
        ),
    )


@register_claim(
    doc='docs/PROJECT_WHAT_IT_IS.md',
    claim_id='core_model_count',
    description="Baseline: N models in handyman.core; verifier ast-counts class Foo(models.Model) declarations.",
)
def _core_model_count() -> ClaimResult:
    models_path = BACKEND_ROOT / "handyman" / "core" / "models.py"
    if not models_path.is_file():
        return ClaimResult.build(
            expected=8, actual=None, severity='error',
            note=f"models.py not found at {models_path}",
        )
    tree = ast.parse(models_path.read_text(encoding="utf-8"))
    model_names: list[str] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            # Only top-level (module-scope) classes whose first base is
            # ``models.Model`` count — nested status enums and helper
            # mixins are excluded.
            for base in node.bases:
                if (
                    isinstance(base, ast.Attribute)
                    and isinstance(base.value, ast.Name)
                    and base.value.id == 'models'
                    and base.attr == 'Model'
                ):
                    model_names.append(node.name)
                    break
    actual = len(model_names)
    expected = 8  # backend/handyman/core/models.py: Customer, BookingRequest, Job, JobPhoto, Estimate, Invoice, Expense, SupplyItem
    return ClaimResult.build(
        expected=expected, actual=actual,
        severity='ok' if expected == actual else 'medium',
        note=f"Models found: {model_names}" if expected != actual else None,
        fix_suggestion=(
            f"Core model count drifted: expected {expected}, found {actual}. "
            f"Update the baseline in scripts/verify_doc_claims.py or reconcile "
            f"backend/handyman/core/models.py."
            if expected != actual else None
        ),
    )


@register_claim(
    doc='docs/PROJECT_WHAT_IT_IS.md',
    claim_id='job_status_count',
    description="Baseline: N Job.Status values; verifier ast-counts TextChoices entries in Job's Status enum.",
)
def _job_status_count() -> ClaimResult:
    models_path = BACKEND_ROOT / "handyman" / "core" / "models.py"
    if not models_path.is_file():
        return ClaimResult.build(
            expected=4, actual=None, severity='error',
            note=f"models.py not found at {models_path}",
        )
    tree = ast.parse(models_path.read_text(encoding="utf-8"))
    # Find class Job(models.Model), then its nested class Status(models.TextChoices)
    actual: Optional[int] = None
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef) and node.name == 'Job':
            for inner in node.body:
                if isinstance(inner, ast.ClassDef) and inner.name == 'Status':
                    actual = sum(
                        1 for child in inner.body
                        if isinstance(child, ast.Assign) and len(child.targets) == 1
                        and isinstance(child.targets[0], ast.Name)
                    )
                    break
            break
    if actual is None:
        return ClaimResult.build(
            expected=4, actual=None, severity='error',
            note="Could not locate Job.Status enum in backend/handyman/core/models.py",
        )
    expected = 4  # Job.Status: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELED
    return ClaimResult.build(
        expected=expected, actual=actual,
        severity='ok' if expected == actual else 'medium',
        fix_suggestion=(
            f"Job.Status enum count drifted: expected {expected}, found {actual}. "
            f"Reconcile docs/PROJECT_WHAT_IT_IS.md against backend/handyman/core/models.py "
            f"or update the verifier baseline."
            if expected != actual else None
        ),
    )


# ============================================================================
# CLI
# ============================================================================

SEVERITY_ICONS = {
    'ok': '\u2713', 'low': '\u00b7', 'medium': '\u25cf',
    'high': '\u25b2', 'critical': '\u25a0', 'error': '?',
}


def _render_list(entries: list[dict]) -> None:
    by_doc: dict[str, list[dict]] = {}
    for e in entries:
        by_doc.setdefault(e['doc'], []).append(e)
    print(f"Registered claims: {len(entries)} across {len(by_doc)} docs\n")
    for doc, items in sorted(by_doc.items()):
        print(f"\n  {doc}")
        for it in items:
            desc = (it.get('description') or '').strip()
            print(f"    \u00b7 {it['claim_id']:40} \u2014 {desc[:80]}")


def _render_text(results: list[ClaimResult], summary: dict) -> None:
    if not results:
        print("No matching claims to run.")
        return
    by_doc: dict[str, list[ClaimResult]] = {}
    for r in results:
        by_doc.setdefault(r.doc, []).append(r)
    for doc, items in sorted(by_doc.items()):
        print('')
        print(f"\u2500\u2500 {doc} \u2500\u2500")
        for r in items:
            icon = SEVERITY_ICONS.get(r.severity, '\u00b7')
            print(f"  {icon} [{r.severity:>8}] {r.claim_id}")
            if r.description:
                print(f"      claim: {r.description.strip().splitlines()[0][:100]}")
            if r.severity != 'ok':
                print(f"      expected: {r.expected}")
                print(f"      actual:   {r.actual}")
            if r.note:
                print(f"      note:     {r.note}")
            if r.fix_suggestion:
                print(f"      fix:      {r.fix_suggestion}")
            if r.error:
                print(f"      error:    {r.error.strip().splitlines()[-1][:200]}")
    print('')
    print("\u2500\u2500 Summary \u2500\u2500")
    print(f"  total: {summary['total']}")
    for sev in ('ok', 'low', 'medium', 'high', 'critical', 'error'):
        n = summary['by_severity'].get(sev, 0)
        if n > 0:
            print(f"  {sev:>8}: {n}")
    print('')
    print("  by doc:")
    for doc, d in sorted(summary['by_doc'].items()):
        print(
            f"    {doc:45} ok={d['ok']:>2}  drift={d['drift']:>2}  error={d['error']:>2}"
        )


def main(argv: Optional[list[str]] = None) -> int:
    p = argparse.ArgumentParser(description='Verify claims in authoritative docs against runtime reality.')
    p.add_argument('--doc', help='Filter to a single doc path')
    p.add_argument('--only-drift', action='store_true', help='Hide matches — show only drift')
    p.add_argument('--format', choices=('text', 'json'), default='text')
    p.add_argument('--list', action='store_true', help='List registered claims without running them')
    p.add_argument('--fail-on-drift', action='store_true', help='Exit non-zero when any non-ok result is found')
    args = p.parse_args(argv)

    if args.list:
        entries = list_registered()
        if args.format == 'json':
            print(json.dumps(entries, indent=2))
        else:
            _render_list(entries)
        return 0

    results = run_all(doc_filter=args.doc, only_drift=args.only_drift)
    summary = summarize(results)

    if args.format == 'json':
        print(json.dumps(
            {'summary': summary, 'results': [r.to_dict() for r in results]},
            indent=2, default=str,
        ))
    else:
        _render_text(results, summary)

    if args.fail_on_drift:
        ok = summary['by_severity'].get('ok', 0)
        total = summary['total']
        if total > 0 and ok < total:
            return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
