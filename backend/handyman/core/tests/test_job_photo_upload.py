"""Photo upload: authenticated, type-validated, size-limited."""

import io
import shutil
import tempfile

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

from handyman.core.models import Customer, Job, JobPhoto


def _tiny_png_bytes() -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (4, 4), (200, 100, 50)).save(buf, format="PNG")
    return buf.getvalue()


_TMP_MEDIA = tempfile.mkdtemp(prefix="norman-handyman-test-media-")


@override_settings(MEDIA_ROOT=_TMP_MEDIA)
class JobPhotoUploadTests(APITestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(_TMP_MEDIA, ignore_errors=True)

    def setUp(self):
        self.user = get_user_model().objects.create_user(username="op", password="x")
        self.customer = Customer.objects.create(name="Alice")
        self.job = Job.objects.create(customer=self.customer, title="Fix door")

    def _upload(self, name="hello.png", content=None, content_type="image/png", caption=""):
        payload = SimpleUploadedFile(
            name, content if content is not None else _tiny_png_bytes(), content_type=content_type
        )
        return self.client.post(
            f"/api/jobs/{self.job.pk}/photos/",
            {"image": payload, "caption": caption},
            format="multipart",
        )

    def test_unauthenticated_upload_rejected(self):
        response = self._upload()
        self.assertIn(response.status_code, {401, 403})
        self.assertEqual(JobPhoto.objects.count(), 0)

    def test_authenticated_upload_succeeds(self):
        self.client.force_authenticate(user=self.user)
        response = self._upload(caption="broken hinge")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.content)
        self.assertEqual(JobPhoto.objects.count(), 1)
        photo = JobPhoto.objects.get()
        self.assertEqual(photo.job_id, self.job.pk)
        self.assertEqual(photo.uploaded_by_id, self.user.pk)
        self.assertEqual(photo.caption, "broken hinge")
        # Stored path must be inside the per-job folder — no client filename leakage.
        self.assertTrue(photo.image.name.startswith(f"job_photos/{self.job.pk}/"))
        self.assertNotIn("hello.png", photo.image.name)

    def test_rejects_disallowed_content_type(self):
        self.client.force_authenticate(user=self.user)
        response = self._upload(name="evil.exe", content=b"MZ\x90...", content_type="application/octet-stream")
        self.assertEqual(response.status_code, status.HTTP_415_UNSUPPORTED_MEDIA_TYPE)
        self.assertEqual(JobPhoto.objects.count(), 0)

    def test_rejects_missing_image_field(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(f"/api/jobs/{self.job.pk}/photos/", {}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rejects_oversized_upload(self):
        self.client.force_authenticate(user=self.user)
        with override_settings(MAX_UPLOAD_SIZE_BYTES=10):
            # tiny_png_bytes() is well over 10 bytes.
            response = self._upload()
        self.assertEqual(response.status_code, status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)
        self.assertEqual(JobPhoto.objects.count(), 0)

    def test_list_photos_returns_absolute_urls(self):
        self.client.force_authenticate(user=self.user)
        self._upload()
        response = self.client.get(f"/api/jobs/{self.job.pk}/photos/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertEqual(len(body), 1)
        self.assertTrue(body[0]["image_url"].startswith("http"))

    def test_upload_to_nonexistent_job_404s(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/jobs/999999/photos/",
            {"image": SimpleUploadedFile("x.png", _tiny_png_bytes(), content_type="image/png")},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
