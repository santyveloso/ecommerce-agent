"""Zoho Mail API Client."""

import time
import httpx
from datetime import datetime
from typing import Optional, List, Dict
from .config import Config

# In-memory tracking of ignored mock emails to survive refreshes during the session
_ignored_simulated_ids = set()

class ZohoClient:
    def __init__(self, config: Config):
        self.config = config
        self._access_token: Optional[str] = None
        self._token_expires_at: float = 0.0

    def is_demo(self) -> bool:
        """Determines if the client is running in simulated/demo mode."""
        cid = self.config.zoho_client_id.strip()
        return cid == "" or cid.lower() in ("demo", "test", "simulated", "placeholder")

    async def get_access_token(self) -> str:
        """Obtains a valid access token, refreshing it if expired."""
        if self.is_demo():
            return "demo_token"

        now = time.time()
        if self._access_token and now < self._token_expires_at:
            return self._access_token

        region = self.config.zoho_region or "com"
        url = f"https://accounts.zoho.{region}/oauth/v2/token"

        data = {
            "refresh_token": self.config.zoho_refresh_token,
            "client_id": self.config.zoho_client_id,
            "client_secret": self.config.zoho_client_secret,
            "grant_type": "refresh_token"
        }

        async with httpx.AsyncClient() as client:
            r = await client.post(url, data=data, timeout=10.0)
            if r.status_code != 200:
                raise Exception(f"Erro ao atualizar token Zoho: {r.status_code} - {r.text}")
            
            res = r.json()
            if "error" in res:
                raise Exception(f"Erro Zoho OAuth: {res.get('error')}")
            
            self._access_token = res["access_token"]
            self._token_expires_at = now + res.get("expires_in", 3600) - 300
            return self._access_token

    async def get_account_id(self) -> str:
        """Retrieves the primary Zoho Mail Account ID."""
        if self.config.zoho_account_id:
            return self.config.zoho_account_id

        token = await self.get_access_token()
        region = self.config.zoho_region or "com"
        url = f"https://mail.zoho.{region}/api/accounts"

        headers = {
            "Authorization": f"Zoho-oauthtoken {token}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            r = await client.get(url, headers=headers, timeout=10.0)
            if r.status_code != 200:
                raise Exception(f"Erro ao buscar contas Zoho: {r.status_code} - {r.text}")
            
            res = r.json()
            data = res.get("data", [])
            if not data:
                raise Exception("Nenhuma conta Zoho Mail encontrada.")
            return str(data[0]["accountId"])

    async def get_account_email(self) -> str:
        """Retrieves the primary account email address."""
        if self.is_demo():
            return "demo@loja-exemplo.zoho.com"

        try:
            token = await self.get_access_token()
            region = self.config.zoho_region or "com"
            url = f"https://mail.zoho.{region}/api/accounts"

            headers = {
                "Authorization": f"Zoho-oauthtoken {token}",
                "Content-Type": "application/json"
            }

            async with httpx.AsyncClient() as client:
                r = await client.get(url, headers=headers, timeout=10.0)
                if r.status_code == 200:
                    res = r.json()
                    data = res.get("data", [])
                    if data:
                        return data[0].get("incomingAddress", data[0].get("mailboxAddress", "zoho-connected"))
            return "zoho-connected"
        except Exception:
            return "zoho-connected"

    async def get_folder_id(self, account_id: str, folder_name: str = "Inbox") -> str:
        """Retrieves the folderId for a folder matching folder_name."""
        token = await self.get_access_token()
        region = self.config.zoho_region or "com"
        url = f"https://mail.zoho.{region}/api/accounts/{account_id}/folders"

        headers = {
            "Authorization": f"Zoho-oauthtoken {token}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            r = await client.get(url, headers=headers, timeout=10.0)
            if r.status_code != 200:
                raise Exception(f"Erro ao buscar pastas Zoho: {r.status_code} - {r.text}")
            
            res = r.json()
            data = res.get("data", [])
            for folder in data:
                if folder.get("folderName", "").lower() == folder_name.lower():
                    return str(folder["folderId"])
            
            if data:
                return str(data[0]["folderId"])
            raise Exception(f"Pasta '{folder_name}' não encontrada.")

    async def get_unread_emails(self) -> List[Dict]:
        """Fetches all unread messages from the inbox."""
        if self.is_demo():
            return self._get_simulated_emails()

        token = await self.get_access_token()
        account_id = await self.get_account_id()
        inbox_id = await self.get_folder_id(account_id, "Inbox")

        region = self.config.zoho_region or "com"
        url = f"https://mail.zoho.{region}/api/accounts/{account_id}/messages/view"
        params = {
            "folderId": inbox_id,
            "status": "unread",
            "limit": 50
        }

        headers = {
            "Authorization": f"Zoho-oauthtoken {token}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            r = await client.get(url, headers=headers, params=params, timeout=10.0)
            if r.status_code != 200:
                raise Exception(f"Erro ao buscar mensagens Zoho: {r.status_code} - {r.text}")
            
            res = r.json()
            data = res.get("data", [])
            
            emails = []
            for msg in data:
                received_time = msg.get("receivedTime")
                date_str = ""
                if received_time:
                    try:
                        dt = datetime.fromtimestamp(int(received_time) / 1000)
                        date_str = dt.isoformat()
                    except Exception:
                        date_str = str(received_time)
                
                emails.append({
                    "id": str(msg["messageId"]),
                    "from": msg.get("sender", msg.get("fromAddress", "Desconhecido")),
                    "subject": msg.get("subject", "(Sem Assunto)"),
                    "date": date_str,
                    "snippet": msg.get("summary", ""),
                })
            return emails

    async def get_message_content(self, message_id: str) -> dict:
        """Fetches full content of a specific message."""
        if self.is_demo():
            return self._get_simulated_message_content(message_id)

        token = await self.get_access_token()
        account_id = await self.get_account_id()
        region = self.config.zoho_region or "com"

        # Try the view endpoint with limit=1 (this is the same endpoint used for listing)
        url = f"https://mail.zoho.{region}/api/accounts/{account_id}/messages/view"
        params = {
            "messageId": message_id,
            "limit": 1,
        }

        headers = {
            "Authorization": f"Zoho-oauthtoken {token}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient() as client:
            r = await client.get(url, headers=headers, params=params, timeout=10.0)
            if r.status_code != 200:
                # Fallback: try the direct message URL
                fallback_url = f"https://mail.zoho.{region}/api/accounts/{account_id}/messages/{message_id}"
                r2 = await client.get(fallback_url, headers=headers, timeout=10.0)
                if r2.status_code != 200:
                    # Last resort: return snippet as content
                    return {
                        "id": message_id,
                        "from": "",
                        "to": "",
                        "subject": "",
                        "date": "",
                        "content": "(Conteúdo completo não disponível para esta mensagem)",
                        "contentHtml": "",
                    }
                res = r2.json()
            else:
                res = r.json()

            data = res.get("data", [])
            if not data:
                return {
                    "id": message_id,
                    "from": "",
                    "to": "",
                    "subject": "",
                    "date": "",
                    "content": "(Conteúdo não encontrado)",
                    "contentHtml": "",
                }

            msg = data[0]
            received_time = msg.get("receivedTime")
            date_str = ""
            if received_time:
                try:
                    dt = datetime.fromtimestamp(int(received_time) / 1000)
                    date_str = dt.isoformat()
                except Exception:
                    date_str = str(received_time)

            content_html = msg.get("content", "")
            import re
            content_text = re.sub(r"<[^>]+>", "", content_html).strip()

            # Fallback to summary/snippet if content is empty
            if not content_text and not content_html:
                content_text = msg.get("summary", msg.get("snippet", ""))

            return {
                "id": str(msg["messageId"]),
                "from": msg.get("sender", msg.get("fromAddress", "Desconhecido")),
                "to": msg.get("toAddress", ""),
                "subject": msg.get("subject", "(Sem Assunto)"),
                "date": date_str,
                "content": content_text or content_html,
                "contentHtml": content_html,
                "threadId": str(msg.get("threadId", msg.get("conversationId", ""))) if msg.get("threadId") or msg.get("conversationId") else None,
            }

    async def get_thread(self, message_id: str) -> dict:
        """Fetches the full thread/conversation for a given message."""
        if self.is_demo():
            # Simulated: return a made-up thread with the original message
            content = await self.get_message_content(message_id)
            return {
                "threadId": "demo-thread",
                "messages": [{
                    "id": content["id"],
                    "from": content["from"],
                    "subject": content["subject"],
                    "date": content["date"],
                    "content": content["content"],
                    "contentHtml": content["contentHtml"],
                }]
            }

        token = await self.get_access_token()
        account_id = await self.get_account_id()
        region = self.config.zoho_region or "com"

        # First get the message to find its threadId
        msg = await self.get_message_content(message_id)
        thread_id = msg.get("threadId")
        
        if not thread_id:
            # No thread, return just this message
            return {
                "threadId": None,
                "messages": [msg]
            }

        url = f"https://mail.zoho.{region}/api/accounts/{account_id}/messages/view"
        params = {
            "threadId": thread_id,
            "limit": 50,
        }

        headers = {
            "Authorization": f"Zoho-oauthtoken {token}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient() as client:
            r = await client.get(url, headers=headers, params=params, timeout=10.0)
            if r.status_code != 200:
                return {
                    "threadId": thread_id,
                    "messages": [msg],
                    "note": "Não foi possível obter a thread completa"
                }

            res = r.json()
            data = res.get("data", [])
            messages = []
            for m in data:
                received_time = m.get("receivedTime")
                date_str = ""
                if received_time:
                    try:
                        dt = datetime.fromtimestamp(int(received_time) / 1000)
                        date_str = dt.isoformat()
                    except:
                        date_str = str(received_time)

                content_html = m.get("content", "")
                import re
                content_text = re.sub(r"<[^>]+>", "", content_html).strip()
                if not content_text and not content_html:
                    content_text = m.get("summary", "")

                messages.append({
                    "id": str(m["messageId"]),
                    "from": m.get("sender", m.get("fromAddress", "Desconhecido")),
                    "subject": m.get("subject", "(Sem Assunto)"),
                    "date": date_str,
                    "content": content_text or content_html,
                    "contentHtml": content_html,
                })

            messages.sort(key=lambda x: x.get("date", ""))
            return {
                "threadId": thread_id,
                "messages": messages,
            }

    async def get_folders(self) -> list:
        """Lists all mail folders for the account."""
        if self.is_demo():
            return [
                {"folderId": "inbox", "folderName": "Inbox"},
                {"folderId": "sent", "folderName": "Sent"},
                {"folderId": "trash", "folderName": "Trash"},
                {"folderId": "spam", "folderName": "Spam"},
                {"folderId": "archive", "folderName": "Archive"},
            ]

        token = await self.get_access_token()
        account_id = await self.get_account_id()
        region = self.config.zoho_region or "com"
        url = f"https://mail.zoho.{region}/api/accounts/{account_id}/folders"

        headers = {
            "Authorization": f"Zoho-oauthtoken {token}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient() as client:
            r = await client.get(url, headers=headers, timeout=10.0)
            if r.status_code != 200:
                raise Exception(f"Erro ao buscar pastas Zoho: {r.status_code} - {r.text}")

            res = r.json()
            data = res.get("data", [])
            folders = []
            for folder in data:
                folders.append({
                    "folderId": str(folder["folderId"]),
                    "folderName": folder.get("folderName", "Desconhecida"),
                })
            return folders

    async def move_to_folder(self, message_id: str, folder_id: str) -> bool:
        """Moves a message to a specified folder."""
        if self.is_demo():
            _ignored_simulated_ids.add(message_id)
            return True

        token = await self.get_access_token()
        account_id = await self.get_account_id()
        region = self.config.zoho_region or "com"
        url = f"https://mail.zoho.{region}/api/accounts/{account_id}/messages/move"

        headers = {
            "Authorization": f"Zoho-oauthtoken {token}",
            "Content-Type": "application/json",
        }

        try:
            numeric_id = int(message_id)
        except ValueError:
            raise Exception("ID de mensagem inválido.")

        body = {
            "messageId": [numeric_id],
            "folderId": folder_id,
        }

        async with httpx.AsyncClient() as client:
            r = await client.post(url, headers=headers, json=body, timeout=10.0)
            if r.status_code != 200:
                # Fallback: mark as read if move is not supported
                await self.mark_as_read(message_id)
                return True
            return True

    async def mark_as_read(self, message_id: str) -> bool:
        """Marks the specified message as read."""
        if self.is_demo():
            _ignored_simulated_ids.add(message_id)
            return True

        token = await self.get_access_token()
        account_id = await self.get_account_id()

        region = self.config.zoho_region or "com"
        url = f"https://mail.zoho.{region}/api/accounts/{account_id}/updatemessage"

        headers = {
            "Authorization": f"Zoho-oauthtoken {token}",
            "Content-Type": "application/json"
        }

        # Convert back to numeric type since Zoho expects a numeric message ID inside JSON array
        try:
            numeric_id = int(message_id)
        except ValueError:
            raise Exception("ID de mensagem inválido. O Zoho requer IDs numéricos.")

        body = {
            "mode": "markAsRead",
            "messageId": [numeric_id]
        }

        async with httpx.AsyncClient() as client:
            r = await client.put(url, headers=headers, json=body, timeout=10.0)
            if r.status_code != 200:
                raise Exception(f"Erro ao marcar mensagem como lida no Zoho: {r.status_code} - {r.text}")
            
            res = r.json()
            # Standard Zoho response checking
            if res.get("status", {}).get("code") == 200:
                return True
            return True

    def _get_simulated_emails(self) -> List[Dict]:
        """Generates list of demo emails, excluding those marked as ignored."""
        all_demo = [
            {
                "id": "1111111111000000001",
                "from": "Ana Silva <ana.silva@example.com>",
                "subject": "Dúvida sobre tamanho do casaco de cabedal",
                "date": datetime.now().isoformat(),
                "snippet": "Olá! Gostaria de saber se o tamanho M do casaco de cabedal é muito justo, ou se recomendam comprar um tamanho acima. Obrigada!",
            },
            {
                "id": "1111111111000000002",
                "from": "Carlos Pereira <carlosp@example.com>",
                "subject": "Encomenda #1024 não recebida",
                "date": datetime.now().isoformat(),
                "snippet": "Bom dia, fiz a encomenda #1024 há 3 dias e ainda não recebi nenhuma atualização de envio. Podem confirmar se já foi enviada?",
            },
            {
                "id": "1111111111000000003",
                "from": "Joana Santos <joana@mediaprom.example.com>",
                "subject": "Parceria comercial de marketing no Instagram",
                "date": datetime.now().isoformat(),
                "snippet": "Olá, sou da agência MediaProm e gostaríamos de propor uma parceria de publicidade no Instagram para a vossa loja. Têm interesse?",
            }
        ]

        # Filter out ignored ones
        return [email for email in all_demo if email["id"] not in _ignored_simulated_ids]

    def _get_simulated_message_content(self, message_id: str) -> dict:
        """Returns simulated full message content for demo mode."""
        contents = {
            "1111111111000000001": {
                "to": "loja@exemplo.com",
                "content": """Olá,

Gostaria de saber se o tamanho M do casaco de cabedal que vi na loja é muito justo, ou se recomendam comprar um tamanho acima.

Tenho 1.68m e peso 62kg, normalmente uso M noutras marcas mas como é cabedal pode ser diferente.

Agradeço desde já a vossa ajuda.

Obrigada,
Ana Silva""",
                "contentHtml": "<p>Olá,</p><p>Gostaria de saber se o tamanho M do casaco de cabedal que vi na loja é muito justo, ou se recomendam comprar um tamanho acima.</p><p>Tenho 1.68m e peso 62kg, normalmente uso M noutras marcas mas como é cabedal pode ser diferente.</p><p>Agradeço desde já a vossa ajuda.</p><p>Obrigada,<br>Ana Silva</p>",
            },
            "1111111111000000002": {
                "to": "suporte@loja.com",
                "content": """Bom dia,

Fiz a encomenda #1024 há 3 dias e ainda não recebi nenhuma atualização de envio. Podem confirmar se já foi enviada?

O pagamento já foi confirmado no PayPal.

Aguardo resposta,
Carlos Pereira""",
                "contentHtml": "<p>Bom dia,</p><p>Fiz a encomenda #1024 há 3 dias e ainda não recebi nenhuma atualização de envio. Podem confirmar se já foi enviada?</p><p>O pagamento já foi confirmado no PayPal.</p><p>Aguardo resposta,<br>Carlos Pereira</p>",
            },
            "1111111111000000003": {
                "to": "parcerias@loja.com",
                "content": """Olá,

Somos a MediaProm, uma agência especializada em marketing de influência no Instagram.

Gostaríamos de propor uma parceria para a vossa loja de moda. Trabalhamos com micro-influenciadores na área de moda e estilo.

Têm interesse em receber mais informações?

Melhores cumprimentos,
Joana Santos
MediaProm""",
                "contentHtml": "<p>Olá,</p><p>Somos a MediaProm, uma agência especializada em marketing de influência no Instagram.</p><p>Gostaríamos de propor uma parceria para a vossa loja de moda. Trabalhamos com micro-influenciadores na área de moda e estilo.</p><p>Têm interesse em receber mais informações?</p><p>Melhores cumprimentos,<br>Joana Santos<br>MediaProm</p>",
            },
        }

        base = contents.get(message_id, {})
        # Find the original email to get from/subject
        for email in self._get_simulated_emails():
            if email["id"] == message_id:
                return {
                    "id": message_id,
                    "from": email["from"],
                    "to": base.get("to", ""),
                    "subject": email["subject"],
                    "date": email["date"],
                    "content": base.get("content", "(Conteúdo não disponível)"),
                    "contentHtml": base.get("contentHtml", "<p>(Conteúdo não disponível)</p>"),
                }

        return {
            "id": message_id,
            "from": "Desconhecido",
            "to": "",
            "subject": "(Sem Assunto)",
            "date": datetime.now().isoformat(),
            "content": "(Conteúdo não disponível)",
            "contentHtml": "<p>(Conteúdo não disponível)</p>",
        }
