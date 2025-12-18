import httpx
from typing import Optional, List, Dict, Any
from app.config import settings
from azure.identity import InteractiveBrowserCredential
from azure.keyvault.secrets import SecretClient


class InflowService:
    def __init__(self):
        self.base_url = settings.inflow_api_url
        self.company_id = settings.inflow_company_id
        self.api_key = self._get_api_key()
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json;version=2024-03-12"
        }

    def _get_api_key(self) -> str:
        """Get API key from Azure Key Vault or environment variable"""
        if settings.inflow_api_key:
            return settings.inflow_api_key

        if settings.azure_key_vault_url:
            try:
                credential = InteractiveBrowserCredential(additionally_allowed_tenants=["*"])
                kv_client = SecretClient(vault_url=settings.azure_key_vault_url, credential=credential)
                secret = kv_client.get_secret("inflow-API-key-new")
                return secret.value
            except Exception as e:
                raise ValueError(f"Failed to get API key from Key Vault: {e}")

        raise ValueError("INFLOW_API_KEY or AZURE_KEY_VAULT_URL must be set")

    async def fetch_orders(
        self,
        inventory_status: Optional[str] = None,
        is_active: bool = True,
        order_number: Optional[str] = None,
        count: int = 100,
        skip: int = 0,
        sort: str = "orderDate",
        sort_desc: bool = True
    ) -> List[Dict[str, Any]]:
        """Fetch orders from Inflow API"""
        url = f"{self.base_url}/{self.company_id}/sales-orders"

        params = {
            "include": "pickLines.product,shipLines,packLines.product,lines",
            "filter[isActive]": str(is_active).lower(),
            "count": str(count),
            "skip": str(skip),
            "sort": sort,
            "sortDesc": str(sort_desc).lower()
        }

        if inventory_status:
            params["filter[inventoryStatus][]"] = inventory_status

        if order_number:
            params["filter[orderNumber]"] = order_number

        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, headers=self.headers)
            response.raise_for_status()
            data = response.json()

            # Handle both dict with 'items' key and list response
            if isinstance(data, dict) and "items" in data:
                return data["items"]
            elif isinstance(data, list):
                return data
            else:
                return []

    async def get_order_by_number(self, order_number: str) -> Optional[Dict[str, Any]]:
        """Fetch a specific order by order number"""
        orders = await self.fetch_orders(order_number=order_number, count=1)
        if orders:
            return orders[0]
        return None

    async def sync_recent_started_orders(
        self,
        max_pages: int = 3,
        per_page: int = 100,
        target_matches: int = 100
    ) -> List[Dict[str, Any]]:
        """Sync recent unfulfilled orders, filtering for 'started' status"""
        matches = []

        for page in range(max_pages):
            orders = await self.fetch_orders(
                inventory_status="unfulfilled",
                count=per_page,
                skip=page * per_page
            )

            # Filter for 'started' status (matching picklist script logic)
            for order in orders:
                if str(order.get("inventoryStatus", "")).strip().lower() == "started":
                    matches.append(order)
                    if len(matches) >= target_matches:
                        return matches

            if len(orders) < per_page:
                break  # No more pages

        return matches

    def is_strict_started(self, order: Dict[str, Any]) -> bool:
        """Check if order has inventoryStatus='started' (case-insensitive)"""
        return str(order.get("inventoryStatus", "")).strip().lower() == "started"
