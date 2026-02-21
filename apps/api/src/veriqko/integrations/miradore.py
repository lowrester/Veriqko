"""Miradore MDM Integration Client."""

import logging
from typing import Optional

import httpx

from veriqko.config import get_settings

logger = logging.getLogger(__name__)


class MiradoreClient:
    """Client for interacting with the Miradore MDM API."""

    def __init__(self):
        self.settings = get_settings()

    @property
    def is_configured(self) -> bool:
        """Check if Miradore credentials are provided in settings."""
        return bool(self.settings.miradore_api_key and self.settings.miradore_site_url)

    async def enroll_device(self, serial_number: str, user_email: Optional[str] = None) -> bool:
        """
        Trigger auto re-enrollment logic in Miradore.
        Depending on Miradore's specific API, this typically involves sending
        an enrollment request mapped to a user or just re-associating the device.
        """
        if not self.is_configured:
            logger.warning("Miradore is not configured. Skipping auto re-enrollment for %s.", serial_number)
            return False

        logger.info(f"Triggering Miradore MDM re-enrollment for {serial_number}")

        url = f"{self.settings.miradore_site_url}/api/v2/Enrollment"
        headers = {
            "Authorization": f"Basic {self.settings.miradore_api_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "DeviceIdentifier": serial_number,
        }
        if user_email:
            payload["UserEmail"] = user_email

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=headers, timeout=10.0)
                response.raise_for_status()

            logger.info("Successfully requested Miradore re-enrollment for %s", serial_number)
            return True
        except httpx.HTTPError as e:
            logger.error("Failed to enroll device in Miradore: %s", str(e))
            return False

miradore_client = MiradoreClient()
