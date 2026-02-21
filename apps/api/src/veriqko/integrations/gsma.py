"""GSMA Device Check Integration Client."""

import logging
from typing import Optional

import httpx

from veriqko.config import get_settings

logger = logging.getLogger(__name__)


class GSMAClient:
    """Client for interacting with the GSMA Device Check API."""

    def __init__(self):
        self.settings = get_settings()
        # For demonstration, we allow configuring an API key, but if none exists we mock
        self.api_key = getattr(self.settings, "gsma_api_key", None)
        self.api_url = getattr(self.settings, "gsma_api_url", "https://devicecheck.gsma.com/api/v1")

    async def check_imei_blacklist(self, imei: str) -> bool:
        """
        Check if an IMEI is blacklisted globally.
        Returns True if blacklisted, False if clean.
        """
        if not imei:
            return False

        if not self.api_key:
            # Mock behavior: Any IMEI ending in "666" or exactly "123456789012345" is blacklisted
            is_blacklisted = imei.endswith("666") or imei == "123456789012345"
            logger.info(f"[GSMA MOCK] Checked IMEI {imei}. Blacklisted: {is_blacklisted}")
            return is_blacklisted

        logger.info(f"Checking GSMA Blacklist for IMEI {imei}")
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.api_url}/devices/{imei}/status", headers=headers, timeout=5.0)
                response.raise_for_status()
                data = response.json()
                
                # Assume the API returns { "status": "blacklisted" } or something similar
                is_blacklisted = data.get("status") == "blacklisted"
                return is_blacklisted
        except httpx.HTTPError as e:
            logger.error("Failed to check GSMA device status: %s", str(e))
            # Default to fail-open (False) or fail-closed (True) depending on risk profile. Defaulting to False.
            return False

gsma_client = GSMAClient()
