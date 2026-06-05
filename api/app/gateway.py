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


GATEWAY_PORTS = [8888, 32774, 8642]


class GatewayBridge:
    def __init__(self, config: Config):
        self.token = config.gateway_token
        self._base_url = config.gateway_url
        self._client = httpx.AsyncClient(timeout=60)
        self._available = False
        self.selected_model = "deepseek-v4-flash"

    async def discover(self) -> Optional[str]:
        """Tenta encontrar o gateway em várias portas."""
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

    async def chat(self, message: str, context: Optional[dict] = None, history: Optional[list] = None) -> str:
        """Envia mensagem para o gateway e retorna resposta."""
        if not self._available:
            return "[Gateway offline] O Hermes Gateway não está acessível. Tenta outra vez quando ele estiver online."

        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"

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

        body = {
            "model": self.selected_model,
            "messages": messages,
            "max_tokens": 1024,
        }

        try:
            resp = await self._client.post(
                self._base_url,
                headers=headers,
                json=body,
            )
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
    ) -> AsyncGenerator[str, None]:
        """Envia mensagem para o gateway com streaming, yield tokens."""
        if not self._available:
            yield "[Gateway offline] "
            return

        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"

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

        body = {
            "model": self.selected_model,
            "messages": messages,
            "max_tokens": 1024,
            "stream": True,
        }

        try:
            async with self._client.stream(
                "POST",
                self._base_url,
                headers=headers,
                json=body,
            ) as resp:
                resp.raise_for_status()
                accumulated = ""
                async for chunk in resp.aiter_text():
                    # SSE format: "data: {...}\n\n" or raw text chunks
                    for line in chunk.split("\n"):
                        line = line.strip()
                        if not line:
                            continue
                        if line.startswith("data: "):
                            data_str = line[6:]
                            if data_str == "[DONE]":
                                return
                            try:
                                data = json.loads(data_str)
                                delta = data.get("choices", [{}])[0].get("delta", {})
                                token = delta.get("content", "")
                                if token:
                                    yield token
                                    accumulated += token
                            except (json.JSONDecodeError, KeyError, IndexError):
                                # If it's not valid SSE JSON, yield raw line
                                yield line
                                accumulated += line
                        else:
                            # Non-SSE line — try to parse as JSON
                            try:
                                data = json.loads(line)
                                delta = data.get("choices", [{}])[0].get("delta", {})
                                token = delta.get("content", "")
                                if token:
                                    yield token
                                    accumulated += token
                            except (json.JSONDecodeError, KeyError, IndexError):
                                yield line
                                accumulated += line

                # If no streaming tokens were received, fallback to full response
                if not accumulated:
                    full_resp = await self._client.post(
                        self._base_url,
                        headers=headers,
                        json={**body, "stream": False},
                    )
                    full_resp.raise_for_status()
                    data = full_resp.json()
                    content = data["choices"][0]["message"]["content"]
                    yield content
        except httpx.HTTPStatusError as e:
            # Fallback: try non-streaming request
            try:
                fallback_body = {**body, "stream": False}
                resp = await self._client.post(
                    self._base_url,
                    headers=headers,
                    json=fallback_body,
                )
                resp.raise_for_status()
                data = resp.json()
                yield data["choices"][0]["message"]["content"]
            except Exception:
                yield f"[Erro gateway: {e}]"
        except Exception as e:
            yield f"[Erro gateway: {e}]"

    async def get_models(self) -> List[str]:
        """Obtém a lista de modelos conectados/disponíveis no gateway Hermes."""
        if not self._available:
            return ["deepseek-v4-flash"]

        models_url = self._base_url.replace("/chat/completions", "/models")
        headers = {}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"

        try:
            resp = await self._client.get(models_url, headers=headers, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                return [m["id"] for m in data.get("data", [])]
        except Exception as e:
            print(f"Erro ao buscar modelos do gateway: {e}")

        return ["deepseek-v4-flash"]

    def set_model(self, model: str):
        """Define o modelo ativo para as conversas."""
        self.selected_model = model

    async def close(self):
        await self._client.aclose()
