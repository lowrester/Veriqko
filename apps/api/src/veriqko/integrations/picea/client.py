import httpx
from typing import Optional, Any, Dict
from veriqko.config import Settings

class PiceaClient:
    """Client for interacting with Picea Diagnostics API."""

    def __init__(self, settings: Settings):
        self.url = settings.picea_api_url
        self.api_key = settings.picea_api_key
        self.customer_id = settings.picea_customer_id
        self.client = httpx.AsyncClient(
            base_url=self.url,
            headers={"X-API-KEY": self.api_key} if self.api_key else {},
            timeout=30.0
        )

    async def get_test_results(self, serial_number: str, imei: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Fetch test results for a specific device.
        Usually queries by Serial Number or IMEI.
        """
        if not self.url or not self.api_key:
            return None

        # Placeholder for actual Picea endpoint structure
        # In many cases, it's something like /v1/reports?identifier=SERIAL
        identifier = imei or serial_number
        try:
            response = await self.client.get(
                "/reports",
                params={"identifier": identifier, "customerId": self.customer_id}
            )
            response.raise_for_status()
            data = response.json()
            
            # Assuming returns a list or direct object
            return data
        except httpx.HTTPStatusError as e:
            # Log error - we might want to use structlog here later
            print(f"Picea API Error: {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            print(f"Unexpected error calling Picea: {e}")
            return None

    async def close(self):
        await self.client.aclose()
