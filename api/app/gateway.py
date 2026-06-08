"""Gateway bridge — ligação ao Hermes Gateway.

Tenta descobrir o gateway em várias portas:
- 8888 (gateway local padrão)
- 32774 (container externo Hostinger)
- 8642 (fallback)
"""

from typing import Optional, List, AsyncGenerator
import json
import httpx
import asyncio
from .config import Config
from .logging import setup_logger

log = setup_logger("gateway")


GATEWAY_PORTS = [8888, 32774, 8642]


class GatewayBridge:
    def __init__(self, config: Config):
        self.token = config.gateway_token
        self._base_url = config.gateway_url
        self._client = httpx.AsyncClient(timeout=120)
        self._available = False
        self.selected_model = config.provider_default_model or "deepseek-v4-flash"
        
        # Provider API info (for model list discovery + direct routing)
        self._provider_base_url = config.provider_base_url
        self._provider_api_key = config.provider_api_key
        self._cached_models: List[str] = []

    @property
    def _use_provider_direct(self) -> bool:
        """If we have provider creds, bypass the gateway and hit opencode directly."""
        return bool(self._provider_base_url and self._provider_api_key)

    @property
    def _provider_chat_url(self) -> str:
        base = self._provider_base_url.rstrip('/')
        if not base.endswith('/chat/completions'):
            return base + '/chat/completions'
        return base

    def _build_messages(self, message: str, context: Optional[dict] = None, history: Optional[list] = None) -> list:
        system_prompt = (
            "Tu és um agente de ecommerce. Ajudas o utilizador a gerir a loja Shopify dele. "
            "Tens acesso a: listar produtos, ver orders, ver stock, criar colecções. "
            "Se o utilizador pedir uma ação de escrita (criar, alterar, apagar), "
            "responde com '[APPROVAL_REQUIRED]' antes da ação proposta para que o sistema peça aprovação."
        )
        messages = [{"role": "system", "content": system_prompt}]
        if context:
            messages.append({"role": "system", "content": str(context)})
        if history:
            messages.extend(history)
        messages.append({"role": "user", "content": message})
        return messages

    async def discover(self) -> Optional[str]:
        """Tenta encontrar o gateway.
        
        Se um GATEWAY_URL estiver configurado (ex: Hostinger VPS), usa esse.
        Senão, tenta auto-discovery nas portas locais.
        """
        # If a custom gateway URL is configured, try that first
        if self._base_url and "localhost" not in self._base_url:
            try:
                base = self._base_url.replace("/v1/chat/completions", "").replace("/chat/completions", "")
                resp = await self._client.get(f"{base}/health", timeout=5)
                if resp.status_code < 500:
                    self._available = True
                    return self._base_url
            except (httpx.ConnectError, httpx.TimeoutException, httpx.RemoteProtocolError):
                pass
        
        # Fallback: auto-discovery on local ports
        for port in GATEWAY_PORTS:
            url = f"http://localhost:{port}/v1/chat/completions"
            try:
                resp = await self._client.get(
                    f"http://localhost:{port}/health",
                    timeout=3,
                )
                if resp.status_code < 500:
                    self._base_url = url
                    self._available = True
                    return url
            except (httpx.ConnectError, httpx.TimeoutException, httpx.RemoteProtocolError):
                continue
        self._available = False
        return None

    async def chat(self, message: str, context: Optional[dict] = None, history: Optional[list] = None, model: Optional[str] = None) -> str:
        """Envia mensagem e retorna resposta — vai direto ao provider quando possível."""
        active_model = model or self.selected_model
        messages = self._build_messages(message, context, history)
        body = {"model": active_model, "messages": messages, "max_tokens": 1024}

        # Try provider direct first (bypasses Hermes gateway — model param guaranteed)
        if self._use_provider_direct:
            try:
                resp = await self._client.post(
                    self._provider_chat_url,
                    headers={"Content-Type": "application/json", "Authorization": f"Bearer {self._provider_api_key}"},
                    json=body,
                )
                resp.raise_for_status()
                data = resp.json()
                return data["choices"][0]["message"]["content"]
            except Exception as e:
                log.warning("Provider direct error, falling back to gateway: %s", e)

        # Fallback: gateway
        if not self._available:
            return "[Gateway offline] O Hermes Gateway não está acessível. Tenta outra vez quando ele estiver online."

        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"

        try:
            resp = await self._client.post(self._base_url, headers=headers, json=body)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]
        except Exception as e:
            return f"[Erro gateway: {e}]"

    async def chat_stream(
        self,
        message: str,
        context: Optional[dict] = None,
        history: Optional[list] = None,
        model: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """Envia mensagem com streaming — vai direto ao provider quando possível."""
        active_model = model or self.selected_model
        messages = self._build_messages(message, context, history)
        body = {"model": active_model, "messages": messages, "max_tokens": 1024, "stream": True}

        # Helper: parse SSE stream
        async def _stream_from(url: str, headers: dict) -> AsyncGenerator[str, None]:
            accumulated = ""
            current_event = ""
            try:
                async with self._client.stream("POST", url, headers=headers, json=body) as resp:
                    resp.raise_for_status()
                    async for chunk in resp.aiter_text():
                        for line in chunk.split("\n"):
                            raw = line  # keep original for fallback
                            line = line.strip()
                            if not line:
                                continue
                            # Track SSE event type
                            if line.startswith("event: "):
                                current_event = line[7:]
                                continue
                            # SSE data line
                            if line.startswith("data: "):
                                data_str = line[6:]
                                if data_str == "[DONE]":
                                    return
                                try:
                                    data = json.loads(data_str)
                                except json.JSONDecodeError:
                                    yield f"__RAW__:{raw}"
                                    accumulated += raw
                                    continue
                                # Tool progress event
                                if current_event == "hermes.tool.progress":
                                    tool = data.get("tool", "")
                                    status = data.get("status", "")
                                    emoji = data.get("emoji", "🔧")
                                    label = data.get("label", tool)
                                    yield f"__TOOL__:{json.dumps({'type':'tool_progress','tool':tool,'status':status,'emoji':emoji,'label':label})}"
                                    current_event = ""
                                    continue
                                # Normalize any event type
                                if current_event:
                                    # Unknown event type — yield as structured
                                    yield f"__EVENT__:{data_str}"
                                    accumulated += data_str
                                    current_event = ""
                                    continue
                                # OpenAI-style delta (standard /v1/chat/completions)
                                delta = data.get("choices", [{}])[0].get("delta", {})
                                token = delta.get("content", "")
                                if token:
                                    yield token
                                    accumulated += token
                                current_event = ""
                                continue
                            # Non-data, non-event line — might be JSON (compact SSE)
                            try:
                                data = json.loads(line)
                                if current_event == "hermes.tool.progress":
                                    tool = data.get("tool", "")
                                    status = data.get("status", "")
                                    emoji = data.get("emoji", "🔧")
                                    label = data.get("label", tool)
                                    yield f"__TOOL__:{json.dumps({'type':'tool_progress','tool':tool,'status':status,'emoji':emoji,'label':label})}"
                                    current_event = ""
                                    continue
                                delta = data.get("choices", [{}])[0].get("delta", {})
                                token = delta.get("content", "")
                                if token:
                                    yield token
                                    accumulated += token
                                current_event = ""
                            except json.JSONDecodeError:
                                yield f"__RAW__:{raw}"
                                accumulated += raw
                    if not accumulated:
                        full_resp = await self._client.post(url, headers=headers, json={**body, "stream": False})
                        full_resp.raise_for_status()
                        data = full_resp.json()
                        yield data["choices"][0]["message"]["content"]
            except httpx.HTTPStatusError as e:
                try:
                    fallback = await self._client.post(url, headers=headers, json={**body, "stream": False})
                    fallback.raise_for_status()
                    data = fallback.json()
                    yield data["choices"][0]["message"]["content"]
                except Exception:
                    raise  # re-raise so caller can fallback to gateway
            except Exception as e:
                raise  # re-raise so caller can fallback to gateway

        # Try provider direct first — just stream, no health check
        if self._use_provider_direct:
            provider_headers = {"Content-Type": "application/json", "Authorization": f"Bearer {self._provider_api_key}"}
            try:
                async for token in _stream_from(self._provider_chat_url, provider_headers):
                    yield token
                return
            except Exception:
                pass  # fall through to gateway

        # Fallback: gateway
        if not self._available:
            yield "[Gateway offline] "
            return

        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"

        async for token in _stream_from(self._base_url, headers):
            yield token

    async def get_models(self) -> List[str]:
        """Obtém a lista de modelos disponíveis.
        
        Primeiro tenta buscar da API do provider via Hermes config.
        Depois tenta do gateway local (v1/models).
        Fallback: lista padrão.
        """
        # Use cached models if available
        if self._cached_models:
            return self._cached_models

        models = []

        # 1) Try provider API directly (from Hermes config)
        if self._provider_base_url and self._provider_api_key:
            try:
                resp = await self._client.get(
                    f"{self._provider_base_url.rstrip('/')}/models",
                    headers={"Authorization": f"Bearer {self._provider_api_key}"},
                    timeout=5,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    models = [m["id"] for m in data.get("data", [])]
                    if models:
                        self._cached_models = models
                        return models
            except Exception as e:
                log.error("Erro ao buscar modelos do provider: %s", e)

        # 2) Try gateway local /v1/models
        if self._available:
            models_url = self._base_url.replace("/chat/completions", "/models")
            headers = {}
            if self.token:
                headers["Authorization"] = f"Bearer {self.token}"
            try:
                resp = await self._client.get(models_url, headers=headers, timeout=5)
                if resp.status_code == 200:
                    data = resp.json()
                    models = [m["id"] for m in data.get("data", [])]
                    if models:
                        self._cached_models = models
                        return models
            except Exception as e:
                log.error("Erro ao buscar modelos do gateway local: %s", e)

        # 3) Fallback: default model + known opencode models
        fallback = [self.selected_model, "kimi-k2.6", "claude-sonnet-4", "minimax-m3", "deepseek-v4-flash"]
        fallback = list(dict.fromkeys(fallback))  # deduplicate preserving order
        self._cached_models = fallback
        return fallback

    def set_model(self, model: str):
        """Define o modelo ativo para as conversas."""
        self.selected_model = model

    async def close(self):
        await self._client.aclose()
