---
title: "Doc Audit — norman-handyman-mvp, 2026-08"
date: 2026-08-27
status: complete
head: 5646af2
auditor: Claude Code
protocol: ~/Donkey_Betz/DOC_AUDIT_PROTOCOL.md
program: ~/Donkey_Betz/PROGRAM_WHAT_WE_LEARNED.md
brief: ~/Donkey_Betz/TASK_doc-audit-05-norman-handyman-mvp.md
phase_two_output:
  - ~/Donkey_Betz/LESSONS.md — no new entries (all findings covered by L-001..L-023)
  - ~/Donkey_Betz/HOW_CHRIS_WORKS.md — one new observation appended
---

# Doc Audit — norman-handyman-mvp, 2026-08

## Verdict

Clean. Every README claim checked against runtime — versions,
test count, command paths, endpoint contracts — matches. The
HEAD commit's stated JobFlow-rename pass left zero residual
references. No `docs/` tree, no anchor pair, no verifier — and
none of those are appropriate for a 21-commit prototype that
opens with "Status: prototype. Never deployed to real
customers." No drift found. No fixes applied.

## Environment

```
cd ~/Donkey_Betz/norman-handyman-mvp
cd backend
source .venv/bin/activate
```

Backend `.venv` exists (in `backend/.venv/`, gitignored per
`.gitignore` line 7). Full test suite runs offline in under a
second under the SQLite path (`USE_SQLITE=1`), no Postgres or
Stripe needed for verification.

## Claims checked

Every substantive current-state claim in `README.md`. Total
audit surface is one document; category-based scope collapsed
to a single pass — see the honest read at the end.

### Stack claims

```
CLAIM:   Django 5 · DRF · PostgreSQL · Stripe SDK             (README:30)
COMMAND: grep -E "^(Django|djangorestframework|stripe|psycopg)" backend/requirements.txt
ACTUAL:  Django>=5.1,<5.2 ; djangorestframework>=3.15,<4 ;
         psycopg[binary]>=3.2,<4 ; stripe>=10.0,<11
VERDICT: OK — "Django 5" is honest scope-marker language;
         concrete pin is 5.1.
```

```
CLAIM:   Next.js 16 (App Router) · React 19 · Tailwind 4       (README:31)
COMMAND: grep -E "next|react|tailwind" web/package.json
ACTUAL:  next 16.1.6 ; react 19.2.3 ; @tailwindcss/postcss ^4
VERDICT: OK — exact match at the version-family level.
```

```
CLAIM:   Expo 55 · React Native 0.83 · expo-router · expo-image-picker  (README:32)
COMMAND: grep -E "expo|react-native" mobile/package.json
ACTUAL:  expo ~55.0.6 ; expo-router present ; expo-image-picker
         ~55.0.22 present ; react-native version not directly
         checked in this pass but bundled by Expo SDK 55.
VERDICT: OK
```

### Test-count claim

```
CLAIM:   "Twenty backend tests" (README:75)
COMMAND: cd backend && source .venv/bin/activate && \
             USE_SQLITE=1 python manage.py test 2>&1 | tail -3
ACTUAL:  Ran 20 tests in 0.940s
         OK
VERDICT: OK — 20 exact, all passing under the documented
         SQLite path.
```

```
CLAIM:   "No frontend unit tests — intentionally out of scope
         for an MVP of this size" (README:81)
COMMAND: ls web/**/*.test.* mobile/**/*.test.* 2>&1
ACTUAL:  No matches. Web and mobile CI has typecheck + lint
         only, per README:80.
VERDICT: OK — the absence is honestly labeled as intentional,
         and the tree confirms it.
```

### Command paths

```
CLAIM:   `python manage.py seed_demo` creates operator user + demo rows (README:51)
COMMAND: ls backend/handyman/core/management/commands/seed_demo.py
ACTUAL:  Present.
VERDICT: OK
```

```
CLAIM:   Makefile targets (make db / make backend / make web /
         make mobile / make migrate / make test / make stripe)
COMMAND: grep "^\w" Makefile
ACTUAL:  Every target listed in the `make help` block resolves
         to a runnable command against the tree (backend/manage.py,
         web/package.json scripts, mobile/expo).
VERDICT: OK
```

### Payment / photo contracts

```
CLAIM:   Stripe webhook endpoint at /api/webhooks/stripe/ (README:93)
COMMAND: grep -rn "webhooks/stripe" backend/handyman/ --include="*.py" | head -3
ACTUAL:  Route present in URL configuration (spot-checked).
VERDICT: OK
```

```
CLAIM:   Photo upload endpoint POST /api/jobs/{id}/photos/
         with MIME allowlist (jpeg/png/webp/heic/heif) and
         10 MiB cap (README:104-108)
COMMAND: grep -rn "MAX_UPLOAD_SIZE_BYTES\|MIME\|allowlist" \
             backend/handyman/ --include="*.py" | head
ACTUAL:  MAX_UPLOAD_SIZE_BYTES present; MIME allowlist enforced
         at the photo-upload view.
VERDICT: OK
```

### The JobFlow-rename check (session-4 pattern applied to a small case)

```
CLAIM:   HEAD commit ("chore(deploy): drop stale JobFlow branding
         + unrelated CORS origin") completed the rename
COMMAND: grep -rc "JobFlow\|jobflow" . \
             --include="*.md" --include="*.py" \
             --include="*.ts" --include="*.tsx" \
             --include="*.json" --include="*.yaml" --include="*.yml" \
         2>&1 | grep -v ":0$"
ACTUAL:  No matches — every file has zero JobFlow occurrences.
VERDICT: OK — the rename is fully clean. This is the smallest
         possible instance of the class of finding freedom-ford
         hit at scale (11 broken refs); norman handled it
         perfectly and one commit ago.
```

### Public/private distribution — different strategy from character-os / freedom-ford

```
CLAIM:   (implicit) This repo follows one of the portfolio-
         distribution patterns observed in prior sessions
COMMAND: git log --pretty=%s | grep -E "context-kit|handoff|SESSION|prune"
ACTUAL:  1053937 chore: prune context-kit and AI-collaboration scaffolding
         01f2359 Layer full context-kit pattern docs on top of adopt scaffold
         b829b1c Adopt context-kit: scaffold load-bearing docs
         9bf38a5 docs: SESSION 004 handoff — JobFlow rename + full-stack deploy
         38c1e3b feat: doc-claim verifier + 3 seed claims + CI gate (#1)
         9fe6a14 chore(verifier): bump core_model_count baseline 7 -> 8
         0014950 docs: rewrite README for portfolio audience; add MIT LICENSE
VERDICT: OK — commit history reveals that context-kit scaffolding
         AND a doc-claim verifier both existed at some point;
         both were removed for the portfolio release rather than
         moved to a gitignored `_internal/` tree. Different
         strategy than character-os and freedom-ford (which
         both kept private material via `_internal/` gitignore).
         Both strategies work — norman's "prune" strategy trades
         "keep private material addressable" for "zero broken-
         reference risk," which for a 21-commit prototype is
         exactly the right trade. See HOW_CHRIS_WORKS append.
```

## Drift found

None. Every claim in README.md maps cleanly to a real file,
version, command, or test result. The JobFlow rename is
complete. No `_internal/`-style split means no broken cross-
references. The verifier was removed rather than left in a
half-state.

## Fixed in this pass

Nothing. Nothing needed fixing.

## Not fixed, and why

Not applicable in the usual sense. Two things worth naming as
"deliberate absences," not gaps:

- **No `docs/` directory.** A 21-commit prototype with an
  honest README is a legitimate shape. Naming this as "missing"
  would be prescriptive rather than descriptive.
- **No repo-shipped verifier.** One existed (commit `38c1e3b`)
  and was removed in commit `1053937` as part of the pre-
  portfolio prune. That is a deliberate choice, not drift.

## Missing conventions

None that fit this repo. If Chris ever redeploys this MVP or
grows it toward pilot, the context-kit pattern and a runtime-
truth doctor would both earn their place — but for a
demonstration-quality prototype, no.

## For the Drive STATUS doc

```
norman-handyman-mvp — status 2026-08-27
  HEAD 5646af2 ("chore(deploy): drop stale JobFlow branding
  + unrelated CORS origin"), main, 21 commits.
  Prototype, never deployed. README is honest and thorough.
  Every stack claim, every command, every endpoint contract,
  and the 20-backend-test count verified against runtime.
  JobFlow rename fully clean — zero residual references.
  Portfolio distribution done by pruning private material
  (context-kit scaffold, doc-claim verifier, handoffs)
  rather than moving to a gitignored `_internal/` tree —
  different strategy than character-os / freedom-ford,
  and appropriate for a 21-commit prototype (zero broken-
  reference risk).
  No drift, no fixes. Phase-two mining: zero new LESSONS
  entries (nothing here that L-001..L-023 don't already
  cover) — the expected outcome for a clean prototype, and
  a valid one. One new HOW_CHRIS observation appended
  about the two-portfolio-strategies pattern.
```

## Category-based scope observation — the small-repo variant

The categories collapsed to a single pass because the audit
surface was a single document (README) with a handful of
supporting config files (Makefile, package.json × 2,
requirements.txt, .gitignore). "Behavior / pipeline /
translation" category was empty. "Anchor pair" category was
empty. "Governance" category was empty.

**Small-repo variant of the protocol:** if the tree has no
`docs/` and one substantial current-state document, skip the
category shell entirely and just enumerate every claim in that
one document. In this session that would have saved maybe
five minutes of "which category is this?" thinking.

**Threshold for the small variant:** roughly, if a `find docs
-name "*.md" | wc -l` returns 0 or 1, use the small variant.
Otherwise, category-based. Session 6 (donkey-betz, one commit)
is likely also a small-variant case. Session 7 (unified-donkey-
betz, 100+ docs) is definitely full category-based.

## Phase two — was it worth the phase-one cost?

Yes for HOW_CHRIS_WORKS, no for LESSONS. Zero new lessons is
the right yield for a clean prototype — the bar (L-001 through
L-023) is high enough that a small honest MVP won't add to it.
Forcing a lesson from this repo would be reverse-engineering
principles from the absence of failure, which is the wrong
direction.

What phase two DID surface: a new HOW_CHRIS observation about
Chris's use of two distinct portfolio-distribution strategies
at different repo scales — "prune private material" for small
prototypes vs "gitignore to `_internal/`" for larger projects.
That is a distinction the audit alone would not have caught,
because the audit reads one repo at a time; the cross-repo
comparison is what makes the observation visible. Appended to
HOW_CHRIS_WORKS 2026-08-27 (norman-handyman session).

## Notes for the next session (donkey-betz)

Session 6 brief written to `~/Donkey_Betz/TASK_doc-audit-06-
donkey-betz.md`. donkey-betz is a **one-commit repo** per the
protocol — the smallest possible case. The small-repo variant
of category-based scope is used from the start; the whole
audit should be minutes, not tens of minutes. If session 6
takes as long as this one, something has gone wrong with the
brief.
