"""Shopify GraphQL client — ligação direta à API Admin."""

from typing import Optional, List
import httpx
from .config import Config


class ShopifyClient:
    def __init__(self, config: Config):
        self.domain = config.shopify_store_domain
        self.token = config.shopify_access_token
        self.api_version = config.shopify_api_version
        self._endpoint = f"https://{self.domain}/admin/api/{self.api_version}/graphql.json"

    def _gql(self, query: str, variables: Optional[dict] = None) -> dict:
        """Executa GraphQL query contra a Shopify Admin API."""
        headers = {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": self.token,
        }
        body = {"query": query}
        if variables:
            body["variables"] = variables

        resp = httpx.post(
            self._endpoint,
            headers=headers,
            json=body,
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        if "errors" in data:
            raise Exception(f"Shopify API error: {data['errors']}")
        return data["data"]

    def get_products(self, limit: int = 20) -> List[dict]:
        """Lista produtos. Retorna id, title, status, totalInventory."""
        q = """
        query($n: Int!) {
            products(first: $n) {
                edges {
                    node {
                        id title handle status totalInventory
                        variants(first: 5) {
                            edges {
                                node { id sku price inventoryQuantity }
                            }
                        }
                    }
                }
            }
        }
        """
        data = self._gql(q, {"n": limit})
        return [
            {
                "id": e["node"]["id"],
                "title": e["node"]["title"],
                "handle": e["node"]["handle"],
                "status": e["node"]["status"],
                "stock": e["node"]["totalInventory"],
                "variants": [
                    {
                        "id": v["node"]["id"],
                        "sku": v["node"]["sku"],
                        "price": v["node"]["price"],
                        "qty": v["node"]["inventoryQuantity"],
                    }
                    for v in e["node"]["variants"]["edges"]
                ],
            }
            for e in data["products"]["edges"]
        ]

    def get_orders(self, limit: int = 10) -> List[dict]:
        """Lista orders recentes."""
        q = """
        query($n: Int!) {
            orders(first: $n, reverse: true, sortKey: CREATED_AT) {
                edges {
                    node {
                        id name createdAt displayFinancialStatus displayFulfillmentStatus
                        totalPriceSet { shopMoney { amount currencyCode } }
                        customer { id displayName email }
                        lineItems(first: 5) {
                            edges { node { title quantity sku } }
                        }
                    }
                }
            }
        }
        """
        data = self._gql(q, {"n": limit})
        return [
            {
                "id": e["node"]["id"],
                "name": e["node"]["name"],
                "created_at": e["node"]["createdAt"],
                "financial_status": e["node"]["displayFinancialStatus"],
                "fulfillment_status": e["node"]["displayFulfillmentStatus"],
                "total": e["node"]["totalPriceSet"]["shopMoney"]["amount"],
                "currency": e["node"]["totalPriceSet"]["shopMoney"]["currencyCode"],
                "customer": e["node"]["customer"]["displayName"] if e["node"].get("customer") else "N/A",
                "items": [
                    {
                        "title": i["node"]["title"],
                        "qty": i["node"]["quantity"],
                    }
                    for i in e["node"]["lineItems"]["edges"]
                ],
            }
            for e in data["orders"]["edges"]
        ]

    def get_order(self, order_name: str) -> Optional[dict]:
        """Procura order pelo nome (ex: #LANAZAGREB1085)."""
        q = """
        query($q: String!) {
            orders(first: 1, query: $q) {
                edges {
                    node {
                        id name createdAt displayFinancialStatus displayFulfillmentStatus
                        totalPriceSet { shopMoney { amount currencyCode } }
                        shippingAddress { name address1 city country }
                        customer { id displayName email }
                        lineItems(first: 10) {
                            edges { node { title quantity sku } }
                        }
                        transactions { id kind status amountSet { shopMoney { amount } } }
                    }
                }
            }
        }
        """
        query_str = f"name:{order_name}"
        if not order_name.startswith("#"):
            query_str = f"name:{order_name}"
        data = self._gql(q, {"q": query_str})
        edges = data["orders"]["edges"]
        if not edges:
            return None
        n = edges[0]["node"]
        return {
            "id": n["id"],
            "name": n["name"],
            "created_at": n["createdAt"],
            "status": n["displayFinancialStatus"],
            "fulfillment": n["displayFulfillmentStatus"],
            "total": n["totalPriceSet"]["shopMoney"]["amount"],
            "customer": n["customer"]["displayName"] if n.get("customer") else "N/A",
            "email": n["customer"]["email"] if n.get("customer") else "",
            "address": n["shippingAddress"]["name"] if n.get("shippingAddress") else "N/A",
            "items": [
                {"title": i["node"]["title"], "qty": i["node"]["quantity"]}
                for i in n["lineItems"]["edges"]
            ],
        }

    def get_low_stock(self, threshold: int = 5) -> List[dict]:
        """Produtos com stock abaixo do threshold."""
        products = self.get_products(limit=50)
        return [p for p in products if p["stock"] is not None and p["stock"] < threshold]

    def create_collection(self, title: str) -> dict:
        """Cria uma colecção (custom collection)."""
        q = """
        mutation($input: CollectionInput!) {
            collectionCreate(input: $input) {
                collection { id title handle }
                userErrors { field message }
            }
        }
        """
        data = self._gql(q, {"input": {"title": title}})
        if data["collectionCreate"]["userErrors"]:
            raise Exception(f"Erro ao criar colecção: {data['collectionCreate']['userErrors']}")
        return data["collectionCreate"]["collection"]

    def get_orders_dated(self, start_date: str, end_date: str, max_pages: int = 10) -> List[dict]:
        """Busca orders num intervalo de datas com paginação por cursor.
        start_date/end_date: formato ISO 'YYYY-MM-DD'.
        Retorna lista de {created_at, total, currency}.
        """
        q = """
        query($query: String!, $cursor: String) {
            orders(first: 250, query: $query, sortKey: CREATED_AT, after: $cursor) {
                edges {
                    cursor
                    node {
                        createdAt
                        totalPriceSet { shopMoney { amount currencyCode } }
                        displayFinancialStatus
                    }
                }
                pageInfo { hasNextPage }
            }
        }
        """
        query_filter = f"created_at:>={start_date} created_at:<={end_date}"
        all_orders = []
        cursor = None

        for _ in range(max_pages):
            data = self._gql(q, {"query": query_filter, "cursor": cursor})
            edges = data["orders"]["edges"]
            for e in edges:
                node = e["node"]
                # Só conta orders pagas (PAID, PARTIALLY_REFUNDED) ou AUTHORIZED
                status = node.get("displayFinancialStatus", "")
                if status in ("PAID", "PARTIALLY_REFUNDED", "AUTHORIZED", "PENDING"):
                    all_orders.append({
                        "created_at": node["createdAt"],
                        "total": float(node["totalPriceSet"]["shopMoney"]["amount"]),
                        "currency": node["totalPriceSet"]["shopMoney"]["currencyCode"],
                    })

            if not data["orders"]["pageInfo"].get("hasNextPage"):
                break
            cursor = edges[-1]["cursor"] if edges else None

        return all_orders

    def shop_info(self) -> dict:
        """Info básica da loja."""
        q = "{ shop { name myshopifyDomain currencyCode plan { displayName } } }"
        data = self._gql(q)
        return data["shop"]
