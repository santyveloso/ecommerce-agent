"""Main API — FastAPI server para o E-commerce Agent MVP."""

import asyncio
import hashlib
import json
import uuid
import re
from pathlib import Path
from typing import Optional, List

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil
import os

from .config import Config
from .approvals import ApprovalStore
from .shopify import ShopifyClient
from .gateway import GatewayBridge
from .meta_ads import MetaAdsClient
from . import setup as setup_mod
from .zoho import ZohoClient

# ── Models ───────────────────────────────────────────────────────────

class MessageHistory(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    context: Optional[dict] = None
    history: Optional[List[MessageHistory]] = None

class ChatResponse(BaseModel):
    reply: str
    approval_required: bool = False
    approval: Optional[dict] = None

class ApproveRequest(BaseModel):
    approval_id: str
    decision: str  # "go" or "stop"

class ActionResponse(BaseModel):
    status: str
    data: Optional[dict] = None
    error: Optional[str] = None

class SetModelRequest(BaseModel):
    model: str

# ── App ──────────────────────────────────────────────────────────────

config = Config.from_env()
approvals = ApprovalStore(config.data_dir)
shopify = ShopifyClient(config)
gateway = GatewayBridge(config)
meta = MetaAdsClient(config)

def get_zoho() -> ZohoClient:
    return ZohoClient(Config.from_env())

app = FastAPI(title="Ecommerce Agent MVP", version="0.1.0")

UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Startup / Shutdown ───────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    url = await gateway.discover()
    if url:
        print(f"🔗 Gateway encontrado em: {url}")
    else:
        print("⚠️ Gateway não encontrado. Chat usará modo offline.")

@app.on_event("shutdown")
async def shutdown():
    await gateway.close()


# ── Setup / Onboarding ──────────────────────────────────────────

@app.get("/setup/status")
async def setup_status():
    """Check if Shopify is configured."""
    return setup_mod.get_status().dict()


@app.post("/setup/save")
async def setup_save(req: setup_mod.SetupSave):
    """Save Shopify credentials and test connection."""
    result = setup_mod.save_credentials(req)
    if not result.configured:
        raise HTTPException(400, result.error or "Falha na configuracao")
    return result


# ── Endpoints ────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    """Health check — gateway + shopify + approvals."""
    gateway_url = await gateway.discover()
    shop_ok = False
    try:
        info = shopify.shop_info()
        shop_ok = True
    except Exception:
        pass

    return {
        "status": "ok",
        "gateway": gateway_url or "offline",
        "shopify": shop_ok,
        "pending_approvals": len(approvals.list_pending()),
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Processa mensagem do chat. Encaminha para gateway ou executa diretamente."""
    msg = req.message.lower().strip()

    # ── Comandos diretos (sem gateway) ───────────────────────────

    # Intent: listar produtos
    if any(p in msg for p in ["mostra produtos", "lista produtos", "produtos"]):
        try:
            products = shopify.get_products(20)
            if not products:
                return ChatResponse(reply="📦 Nenhum produto encontrado.")
            lines = ["📦 **Produtos:**"]
            for p in products:
                stock = f" (stock: {p['stock']})" if p["stock"] is not None else ""
                lines.append(f"- {p['title']}{stock} — {p['status']}")
            return ChatResponse(reply="\n".join(lines[:25]))
        except Exception as e:
            return ChatResponse(reply=f"❌ Erro ao buscar produtos: {e}")

    # Intent: low stock
    if any(p in msg for p in ["baixo stock", "stock baixo", "pouco stock"]):
        try:
            low = shopify.get_low_stock(5)
            if not low:
                return ChatResponse(reply="✅ Nenhum produto com stock baixo (≤5).")
            lines = ["⚠️ **Produtos com stock baixo:**"]
            for p in low:
                lines.append(f"- {p['title']} — stock: {p['stock']}")
            return ChatResponse(reply="\n".join(lines))
        except Exception as e:
            return ChatResponse(reply=f"❌ Erro: {e}")

    # Intent: últimas orders
    if any(p in msg for p in ["ultimas orders", "últimas orders", "lista orders", "orders", "encomendas"]):
        try:
            orders = shopify.get_orders(10)
            if not orders:
                return ChatResponse(reply="📋 Nenhuma order encontrada.")
            lines = ["📋 **Últimas orders:**"]
            for o in orders:
                lines.append(f"- {o['name']} — {o['total']}€ — {o['financial_status']}")
            return ChatResponse(reply="\n".join(lines))
        except Exception as e:
            return ChatResponse(reply=f"❌ Erro: {e}")

    # Intent: ver order específica
    if any(p in msg for p in ["order #", "estado da order", "encomenda #"]):
        import re
        match = re.search(r'#?(\w+\d+)', msg)
        if match:
            order_ref = match.group(1)
            try:
                o = shopify.get_order(order_ref)
                if not o:
                    return ChatResponse(reply=f"❌ Order {order_ref} não encontrada.")
                reply = (
                    f"📋 **{o['name']}**\n"
                    f"Cliente: {o['customer']}\n"
                    f"Total: {o['total']}€\n"
                    f"Estado: {o['status']} | Envio: {o['fulfillment']}\n"
                    f"Items: {', '.join(i['title'] for i in o['items'])}"
                )
                return ChatResponse(reply=reply)
            except Exception as e:
                return ChatResponse(reply=f"❌ Erro: {e}")

    # Intent: criar colecção (escrita → aprovação)
    if any(p in msg for p in ["cria colecção", "cria coleção", "nova colecção"]):
        # Extrair nome
        for prefix in ["cria colecção ", "cria coleção ", "nova colecção "]:
            if prefix in req.message.lower():
                title = req.message[len(prefix):].strip().title()
                break
        else:
            title = "Nova Colecção"
        approval = approvals.create(
            intent="collection_create",
            payload={"title": title},
            summary=f"Criar colecção \"{title}\"",
        )
        return ChatResponse(
            reply=f"🛑 **Aprovação necessária**\n\n{approval['summary']}\n\nUsa `/approve {approval['id']} go` para confirmar ou `/approve {approval['id']} stop` para cancelar.",
            approval_required=True,
            approval=approval,
        )

    # ── Via gateway ─────────────────────────────────────────────
    history_dicts = [m.model_dump() for m in req.history] if req.history else None
    reply = await gateway.chat(req.message, req.context, history_dicts)
    return ChatResponse(reply=reply)


@app.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    """Streaming chat endpoint — returns SSE text/event-stream."""

    async def event_generator():
        # For non-gateway commands, simulate streaming
        msg = req.message.lower().strip()

        # Check if it matches a direct command
        direct_reply = None

        if any(p in msg for p in ["mostra produtos", "lista produtos", "produtos"]):
            try:
                products = shopify.get_products(20)
                if not products:
                    direct_reply = "📦 Nenhum produto encontrado."
                else:
                    lines = ["📦 **Produtos:**"]
                    for p in products:
                        stock = f" (stock: {p['stock']})" if p["stock"] is not None else ""
                        lines.append(f"- {p['title']}{stock} — {p['status']}")
                    direct_reply = "\n".join(lines[:25])
            except Exception as e:
                direct_reply = f"❌ Erro ao buscar produtos: {e}"

        elif any(p in msg for p in ["baixo stock", "stock baixo", "pouco stock"]):
            try:
                low = shopify.get_low_stock(5)
                if not low:
                    direct_reply = "✅ Nenhum produto com stock baixo (≤5)."
                else:
                    lines = ["⚠️ **Produtos com stock baixo:**"]
                    for p in low:
                        lines.append(f"- {p['title']} — stock: {p['stock']}")
                    direct_reply = "\n".join(lines)
            except Exception as e:
                direct_reply = f"❌ Erro: {e}"

        elif any(p in msg for p in ["ultimas orders", "últimas orders", "lista orders", "orders", "encomendas"]):
            try:
                orders = shopify.get_orders(10)
                if not orders:
                    direct_reply = "📋 Nenhuma order encontrada."
                else:
                    lines = ["📋 **Últimas orders:**"]
                    for o in orders:
                        lines.append(f"- {o['name']} — {o['total']}€ — {o['financial_status']}")
                    direct_reply = "\n".join(lines)
            except Exception as e:
                direct_reply = f"❌ Erro: {e}"

        elif any(p in msg for p in ["order #", "estado da order", "encomenda #"]):
            match = re.search(r'#?(\w+\d+)', msg)
            if match:
                order_ref = match.group(1)
                try:
                    o = shopify.get_order(order_ref)
                    if not o:
                        direct_reply = f"❌ Order {order_ref} não encontrada."
                    else:
                        direct_reply = (
                            f"📋 **{o['name']}**\n"
                            f"Cliente: {o['customer']}\n"
                            f"Total: {o['total']}€\n"
                            f"Estado: {o['status']} | Envio: {o['fulfillment']}\n"
                            f"Items: {', '.join(i['title'] for i in o['items'])}"
                        )
                except Exception as e:
                    direct_reply = f"❌ Erro: {e}"

        elif any(p in msg for p in ["cria colecção", "cria coleção", "nova colecção"]):
            for prefix in ["cria colecção ", "cria coleção ", "nova colecção "]:
                if prefix in req.message.lower():
                    title = req.message[len(prefix):].strip().title()
                    break
            else:
                title = "Nova Colecção"
            approval = approvals.create(
                intent="collection_create",
                payload={"title": title},
                summary=f"Criar colecção \"{title}\"",
            )
            direct_reply = (
                f"🛑 **Aprovação necessária**\n\n{approval['summary']}\n\n"
                f"Usa `/approve {approval['id']} go` para confirmar ou `/approve {approval['id']} stop` para cancelar."
            )

        if direct_reply is not None:
            # Simulate streaming by yielding chunks
            chunk_size = 10
            for i in range(0, len(direct_reply), chunk_size):
                chunk = direct_reply[i:i + chunk_size]
                yield f"data: {json.dumps({'token': chunk})}\n\n"
                await asyncio.sleep(0.01)
            yield f"data: {json.dumps({'token': ''})}\n\n"
            yield "data: [DONE]\n\n"
            return

        # Gateway streaming
        history_dicts = [m.model_dump() for m in req.history] if req.history else None
        async for token in gateway.chat_stream(req.message, req.context, history_dicts):
            yield f"data: {json.dumps({'token': token})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/approve", response_model=ActionResponse)
async def approve(req: ApproveRequest):
    """Processa decisão go/stop."""
    if req.decision not in ("go", "stop"):
        raise HTTPException(400, "decision must be 'go' or 'stop'")

    if req.decision == "go":
        a = approvals.approve(req.approval_id)
        if a is None:
            raise HTTPException(404, "Approval not found")
        # Executa a ação
        try:
            if a["intent"] == "collection_create":
                result = shopify.create_collection(a["payload"]["title"])
                return ActionResponse(
                    status="approved",
                    data={
                        "action": "Colecção criada",
                        "title": result["title"],
                        "handle": result["handle"],
                    },
                )
            return ActionResponse(status="approved", data={"action": f"Intent {a['intent']} executada"})
        except Exception as e:
            return ActionResponse(status="approved", error=str(e))

    else:
        a = approvals.reject(req.approval_id)
        if a is None:
            raise HTTPException(404, "Approval not found")
        return ActionResponse(status="rejected", data={"action": "Cancelado pelo utilizador"})


@app.get("/approvals/pending")
async def list_pending():
    """Lista aprovações pendentes."""
    return {"approvals": approvals.list_pending()}


@app.get("/orders")
async def get_orders(limit: int = 50):
    """Lista orders recentes da Shopify."""
    try:
        orders = shopify.get_orders(limit)
        return {"orders": orders}
    except Exception as e:
        raise HTTPException(503, f"Shopify offline ou erro nas orders: {e}")


@app.get("/orders/{order_name}")
async def get_order_detail(order_name: str):
    """Obtém detalhes de uma order específica pelo nome (ex: #1001)."""
    try:
        ref = order_name
        if not ref.startswith("#") and ref.isdigit():
            ref = f"#{ref}"
        o = shopify.get_order(ref)
        if not o:
            raise HTTPException(404, f"Order {order_name} não encontrada")
        return {"order": o}
    except Exception as e:
        raise HTTPException(503, f"Shopify offline ou erro na order: {e}")


@app.get("/shop/info")
async def shop_info():
    """Info da loja."""
    try:
        info = shopify.shop_info()
        return {"data": info}
    except Exception as e:
        raise HTTPException(503, f"Shopify offline: {e}")


@app.get("/gateway/models")
async def get_gateway_models():
    """Retorna os modelos disponíveis e o modelo ativo no Hermes Gateway."""
    models = await gateway.get_models()
    return {"models": models, "active": gateway.selected_model}


@app.post("/gateway/model")
async def set_gateway_model(req: SetModelRequest):
    """Altera o modelo ativo no Hermes Gateway."""
    models = await gateway.get_models()
    if req.model not in models:
        raise HTTPException(400, f"Modelo {req.model} não está disponível no Gateway.")
    gateway.set_model(req.model)
    return {"status": "ok", "active": gateway.selected_model}


@app.get("/dashboard")
async def dashboard(period: str = "today"):
    """Dashboard agregado: shop info + métricas + orders recentes + approvals."""
    from datetime import datetime, timedelta
    now = datetime.utcnow()

    # Shop info
    store_name = "Lana Zagreb"
    currency = "EUR"
    try:
        info = shopify.shop_info()
        store_name = info.get("name", store_name)
        currency = info.get("currencyCode", currency)
    except Exception:
        pass

    # Recent orders
    recent_orders = []
    try:
        orders = shopify.get_orders(10)
        for o in orders:
            recent_orders.append({
                "name": o.get("name", ""),
                "customer": o.get("customer", ""),
                "total": f"{float(o.get('total', 0)):.2f}€",
                "status": (o.get("financial_status", "") or "").lower(),
                "date": o.get("created_at", ""),
            })
    except Exception:
        pass

    # Products & low stock
    products_count = 0
    low_stock_count = 0
    try:
        prods = shopify.get_products(250)
        products_count = len(prods)
        low_stock_count = len(shopify.get_low_stock(5))
    except Exception:
        pass

    # Pending approvals
    pending = len(approvals.list_pending())

    # Orders today
    orders_today = 0
    revenue_today = 0.0
    try:
        today_start = now.strftime("%Y-%m-%dT00:00:00Z")
        today_end = now.strftime("%Y-%m-%dT23:59:59Z")
        today_orders = shopify.get_orders_dated(today_start, today_end, max_pages=1)
        for o in today_orders:
            orders_today += 1
            revenue_today += float(o.get("total", 0))
    except Exception:
        pass

    return {
        "storeName": store_name,
        "currency": currency,
        "products": products_count,
        "lowStock": low_stock_count,
        "ordersToday": orders_today,
        "revenueToday": f"{revenue_today:.2f}€",
        "pendingApprovals": pending,
        "recentOrders": recent_orders,
    }


@app.get("/emails/send")
async def emails_send_placeholder():
    """Envio de email — placeholder."""
    return {"status": "not_implemented", "message": "Envio via UI Zoho em breve"}


DATE_PRESETS = {
    "today": "today",
    "yesterday": "yesterday",
    "last_7": "last_7d",
    "last_30": "last_30d",
    "this_month": "this_month",
    "last_month": "last_month",
}


@app.get("/dashboard/metrics")
async def dashboard_metrics(preset: str = "today", force_refresh: bool = False):
    """Métricas do dashboard: gasto ads, ROAS, revenue, orders (reais do Shopify)."""
    dp = DATE_PRESETS.get(preset, "today")
    from datetime import datetime, timedelta

    # Mapa de presets para datas reais
    now = datetime.utcnow()
    if preset == "today":
        start = now.strftime("%Y-%m-%d")
        end = now.strftime("%Y-%m-%d")
    elif preset == "last_7" or preset == "week":
        start = (now - timedelta(days=6)).strftime("%Y-%m-%d")
        end = now.strftime("%Y-%m-%d")
    elif preset == "this_month":
        start = now.replace(day=1).strftime("%Y-%m-%d")
        end = now.strftime("%Y-%m-%d")
    else:
        start = now.strftime("%Y-%m-%d")
        end = now.strftime("%Y-%m-%d")

    # Meta Ads insights (com cache)
    ads = await meta.get_insights(date_preset=dp, force_refresh=force_refresh)

    # Orders reais do Shopify no período
    real_orders = []
    try:
        real_orders = shopify.get_orders_dated(start, end)
    except Exception:
        pass

    return {
        "spend": ads["spend"],
        "roas": ads["roas"],
        "conversions_value": ads["conversions_value"],
        "orders": len(real_orders),
        "revenue": sum(o["total"] for o in real_orders),
        "preset": preset,
    }


@app.get("/dashboard/revenue-chart")
async def dashboard_revenue_chart(days: int = 30):
    """Revenue agrupado por dia — dados reais do Shopify.
    days: 7, 14, 30, 90
    """
    from datetime import datetime, timedelta

    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    start_str = start_date.strftime("%Y-%m-%d")
    end_str = end_date.strftime("%Y-%m-%d")

    try:
        orders = shopify.get_orders_dated(start_str, end_str)
    except Exception as e:
        raise HTTPException(500, f"Erro ao buscar orders do Shopify: {e}")

    # Agrupa por dia
    daily = {}
    currency = "EUR"
    for o in orders:
        day = o["created_at"][:10]  # YYYY-MM-DD
        daily[day] = daily.get(day, 0) + o["total"]
        currency = o.get("currency", currency)

    # Preenche dias sem vendas com 0
    chart_data = []
    current = start_date
    while current <= end_date:
        day_str = current.strftime("%Y-%m-%d")
        chart_data.append({
            "date": day_str,
            "revenue": round(daily.get(day_str, 0), 2)
        })
        current += timedelta(days=1)

    total_revenue = sum(d["revenue"] for d in chart_data)
    total_orders = len(orders)

    return {
        "days": days,
        "start_date": start_str,
        "end_date": end_str,
        "currency": currency,
        "total_revenue": round(total_revenue, 2),
        "total_orders": total_orders,
        "data": chart_data,
    }


# ── Zoho Mail Endpoints ───────────────────────────────────────────────

@app.get("/zoho/status")
async def zoho_status():
    """Retorna o estado da configuração Zoho e email conectado."""
    client = get_zoho()
    configured = not client.is_demo()
    try:
        email = await client.get_account_email()
        return {
            "configured": configured,
            "email": email,
            "is_demo": client.is_demo(),
            "error": None
        }
    except Exception as e:
        return {
            "configured": configured,
            "email": None,
            "is_demo": client.is_demo(),
            "error": str(e)
        }


@app.post("/zoho/save")
async def zoho_save(req: setup_mod.ZohoSetupSave):
    """Guarda credenciais do Zoho no .env e testa ligação."""
    try:
        setup_mod.save_zoho_credentials(req)
        client = get_zoho()
        # Test connection by fetching email (which will trigger token refresh/auth verify)
        email = await client.get_account_email()
        return {
            "configured": True,
            "email": email,
            "is_demo": client.is_demo()
        }
    except Exception as e:
        raise HTTPException(400, f"Falha na configuração do Zoho: {e}")


@app.get("/zoho/emails")
async def zoho_emails():
    """Lista emails não respondidos (unread) do Inbox do Zoho."""
    client = get_zoho()
    try:
        emails = await client.get_unread_emails()
        return {
            "emails": emails,
            "is_demo": client.is_demo()
        }
    except Exception as e:
        raise HTTPException(502, f"Erro ao obter emails do Zoho: {e}")


@app.post("/zoho/emails/{message_id}/read")
async def zoho_emails_read(message_id: str):
    """Marca um email como lido (ignorado) no Zoho."""
    client = get_zoho()
    try:
        success = await client.mark_as_read(message_id)
        return {
            "status": "ok",
            "success": success
        }
    except Exception as e:
        raise HTTPException(502, f"Erro ao marcar email como lido no Zoho: {e}")


@app.get("/zoho/emails/{message_id}")
async def zoho_email_detail(message_id: str):
    """Retorna o conteúdo completo de um email específico."""
    client = get_zoho()
    try:
        content = await client.get_message_content(message_id)
        return content
    except Exception as e:
        raise HTTPException(502, f"Erro ao obter conteúdo do email: {e}")


@app.get("/zoho/folders")
async def zoho_folders():
    """Lista as pastas disponíveis na conta Zoho Mail."""
    client = get_zoho()
    try:
        folders = await client.get_folders()
        return {"folders": folders}
    except Exception as e:
        raise HTTPException(502, f"Erro ao obter pastas Zoho: {e}")


@app.post("/zoho/emails/{message_id}/archive")
async def zoho_archive_email(message_id: str):
    """Arquiva um email movendo-o para o Trash."""
    client = get_zoho()
    try:
        # Find Trash folder
        folders = await client.get_folders()
        trash_id = None
        for f in folders:
            if f["folderName"].lower() in ("trash", "lixeira"):
                trash_id = f["folderId"]
                break
        if not trash_id:
            # Fallback: just mark as read
            await client.mark_as_read(message_id)
            return {"status": "ok", "note": "Arquivado como lido (pasta Trash não encontrada)"}

        await client.move_to_folder(message_id, trash_id)
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(502, f"Erro ao arquivar email: {e}")


@app.get("/zoho/emails/{message_id}/thread")
async def zoho_email_thread(message_id: str):
    """Retorna a thread completa de conversa para um email."""
    client = get_zoho()
    try:
        thread = await client.get_thread(message_id)
        return thread
    except Exception as e:
        raise HTTPException(502, f"Erro ao obter thread do email: {e}")


# ── Creative Studio Endpoints ─────────────────────────────────────────

MOCK_ASSETS = {
    "sneaker": {
        "video": "https://assets.mixkit.co/videos/preview/mixkit-holding-a-new-white-sneaker-34289-large.mp4",
        "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
        "prompt": "Premium athletic sneaker on a vibrant platform, product commercial styling"
    },
    "fashion": {
        "video": "https://assets.mixkit.co/videos/preview/mixkit-fashion-woman-with-silver-glitter-makeup-40157-large.mp4",
        "image": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800",
        "prompt": "Cinematic studio shot of high fashion garment, slow motion dynamic lighting"
    },
    "cyberpunk": {
        "video": "https://assets.mixkit.co/videos/preview/mixkit-retro-futuristic-sci-fi-grid-background-43093-large.mp4",
        "image": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800",
        "prompt": "Futuristic VR headset and glowing neon interface elements, cyberpunk style"
    },
    "fluid": {
        "video": "https://assets.mixkit.co/videos/preview/mixkit-flow-of-abstract-fluid-paint-42792-large.mp4",
        "image": "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800",
        "prompt": "Dynamic flow of fuchsia and fuchsia fluid paint, high contrast smooth transition"
    },
    "nature": {
        "video": "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-thick-forest-and-river-42358-large.mp4",
        "image": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800",
        "prompt": "Breathtaking mountain range and lush forest, 4k drone cinematic shot"
    }
}

def match_creative_theme(msg: str) -> str:
    msg_lower = msg.lower()
    if any(k in msg_lower for k in ["sapatilha", "tenis", "ténis", "shoe", "sneaker", "nike", "adidas", "calçado"]):
        return "sneaker"
    if any(k in msg_lower for k in ["moda", "roupa", "model", "fashion", "garment", "tshirt", "t-shirt", "vestuário", "casaco", "vestido"]):
        return "fashion"
    if any(k in msg_lower for k in ["cyberpunk", "cyber", "futurista", "neon", "sci-fi", "virtual", "tecnologia", "futuro"]):
        return "cyberpunk"
    if any(k in msg_lower for k in ["fluido", "fluid", "arte", "pintura", "abstrato", "abstract", "cores"]):
        return "fluid"
    if any(k in msg_lower for k in ["natureza", "nature", "floresta", "rio", "drone", "montanha", "paisagem", "exterior", "árvores"]):
        return "nature"
    # Choose fallback
    return "fashion"

@app.post("/studio/upload")
async def studio_upload(file: UploadFile = File(...)):
    """Faz o upload de uma imagem. Se ja existir (hash match), devolve 409."""
    try:
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        
        # Ler bytes para hashing antes de guardar
        contents = await file.read()
        if not contents:
            raise HTTPException(400, "Ficheiro vazio")
        
        file_hash = hashlib.sha256(contents).hexdigest()
        
        # Verificar duplicados por hash
        for existing in UPLOAD_DIR.iterdir():
            if existing.is_file() and not existing.name.startswith('.'):
                existing_hash = hashlib.sha256(existing.read_bytes()).hexdigest()
                if existing_hash == file_hash:
                    parts = existing.name.split('_', 1)
                    orig_name = parts[1] if len(parts) > 1 else existing.name
                    raise HTTPException(
                        409,
                        detail=(
                            f"A imagem que tentaste carregar ja existe nos teus assets "
                            f"como {orig_name}. Nao foi feita nenhuma duplicacao."
                        )
                    )
        
        # Guardar ficheiro (sem duplicado)
        safe_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', file.filename)
        unique_name = f"{uuid.uuid4().hex[:8]}_{safe_name}"
        file_path = UPLOAD_DIR / unique_name
        
        with open(file_path, "wb") as buffer:
            buffer.write(contents)
            
        file_size = file_path.stat().st_size
        return {
            "name": file.filename,
            "filename": unique_name,
            "url": f"/uploads/{unique_name}",
            "size": file_size
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Erro ao fazer upload da imagem: {e}")

@app.get("/studio/uploads")
async def studio_uploads():
    """Lista todas as imagens carregadas no estúdio."""
    try:
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        files = []
        for file_path in UPLOAD_DIR.iterdir():
            if file_path.is_file() and not file_path.name.startswith('.'):
                parts = file_path.name.split('_', 1)
                orig_name = parts[1] if len(parts) > 1 else file_path.name
                files.append({
                    "name": orig_name,
                    "filename": file_path.name,
                    "url": f"/uploads/{file_path.name}",
                    "size": file_path.stat().st_size
                })
        # Ordenar por data de modificação decrescente (mais recentes primeiro)
        files.sort(key=lambda x: os.path.getmtime(UPLOAD_DIR / x["filename"]), reverse=True)
        return {"uploads": files}
    except Exception as e:
        raise HTTPException(500, f"Erro ao listar ficheiros: {e}")



@app.delete("/studio/upload/{filename}")
async def studio_delete(filename: str):
    """Apaga uma imagem carregada no estúdio."""
    try:
        # Security: prevent path traversal
        safe_name = Path(filename).name
        file_path = UPLOAD_DIR / safe_name
        if not file_path.exists():
            raise HTTPException(404, "Ficheiro não encontrado")
        file_path.unlink()
        return {"status": "ok", "deleted": safe_name}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Erro ao apagar ficheiro: {e}")
@app.post("/studio/chat")
async def studio_chat(req: ChatRequest):
    """Processa mensagens do chat do estúdio criativo, simulando Hermes + Higgsfield."""
    msg = req.message.strip()
    msg_lower = msg.lower()
    
    # Detetar se é um pedido de geração (vídeo ou imagem)
    is_generation = any(k in msg_lower for k in [
        "gerar", "cria", "desenha", "cria imagem", "gerar video", "gerar imagem", 
        "anima", "make a video", "generate", "create", "higgsfield", "render"
    ])
    
    if is_generation:
        # Detetar se é um vídeo ou imagem
        is_video = any(k in msg_lower for k in ["video", "vídeo", "anima", "animar", "movie", "clip", "mp4", "motion"])
        theme = match_creative_theme(msg_lower)
        asset = MOCK_ASSETS[theme]
        
        # Procurar por tags de imagem (ex: @nome_do_ficheiro)
        tagged_images = re.findall(r'@([a-zA-Z0-9_.-]+)', msg)
        tag_context = ""
        if tagged_images:
            tag_context = f" utilizando a imagem de referência **@{tagged_images[0]}**"
            
        media_type = "video" if is_video else "image"
        media_url = asset["video"] if is_video else asset["image"]
        
        if is_video:
            reply = (
                f"🎬 **Higgsfield AI Video Generator**\n\n"
                f"Orquestrado pelo Hermes, o **Higgsfield** iniciou a geração de vídeo{tag_context}.\n"
                f"O algoritmo de difusão temporal processou a instrução:\n"
                f"*\"{msg}\"*\n\n"
                f"Aqui está o vídeo promocional gerado de 5 segundos em alta definição:"
            )
        else:
            reply = (
                f"🎨 **Higgsfield AI Image Generator**\n\n"
                f"O **Higgsfield** gerou uma nova imagem{tag_context} com base no teu prompt criativo.\n"
                f"Parâmetros optimizados para e-commerce (fidelidade de produto e iluminação de estúdio).\n\n"
                f"Aqui está a imagem gerada:"
            )
            
        return {
            "reply": reply,
            "media": {
                "url": media_url,
                "type": media_type,
                "prompt": asset["prompt"],
                "name": f"Higgsfield_{theme}_{media_type}"
            }
        }
    else:
        # Se não for uma instrução de geração, responder normalmente como Hermes explicativo
        reply = (
            f"Olá! Eu sou o **Hermes**, o teu assistente de e-commerce, e neste espaço "
            f"trabalho em conjunto com o **Higgsfield** (IA de geração visual) para criar conteúdo criativo.\n\n"
            f"Como posso ajudar-te? Experimenta:\n"
            f"1. Fazer upload de uma imagem do teu produto no painel lateral.\n"
            f"2. Escrever no chat algo como: *\"Cria uma imagem de estúdio futurista para esta @imagem\"* "
            f"(podes digitar `@` para abrir as sugestões de imagem).\n"
            f"3. Ou pede diretamente: *\"Gera um vídeo promocional cyberpunk para uma sapatilha\"*."
        )
        return {
            "reply": reply,
            "media": None
        }


# ── Automations (Cron Jobs) ───────────────────────────────────────

from . import cron_jobs as cron_mod

class AutomationCreateRequest(BaseModel):
    name: str
    schedule: str
    prompt: str
    deliver: str = "local"


@app.get("/automations")
async def list_automations():
    """Lista todos os cron jobs ativos."""
    try:
        jobs = cron_mod.list_jobs()
        return {"automations": jobs}
    except Exception as e:
        raise HTTPException(500, f"Erro ao listar automações: {e}")


@app.get("/automations/{job_id}")
async def get_automation(job_id: str):
    """Detalhe de uma automação."""
    try:
        job = cron_mod.get_job(job_id)
        if not job:
            raise HTTPException(404, "Automação não encontrada")
        return job
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Erro: {e}")


@app.post("/automations/{job_id}/pause")
async def pause_automation(job_id: str):
    """Pausa uma automação."""
    try:
        return cron_mod.pause_job(job_id)
    except Exception as e:
        raise HTTPException(500, f"Erro ao pausar: {e}")


@app.post("/automations/{job_id}/resume")
async def resume_automation(job_id: str):
    """Reativa uma automação."""
    try:
        return cron_mod.resume_job(job_id)
    except Exception as e:
        raise HTTPException(500, f"Erro ao reativar: {e}")


# ── Memory ────────────────────────────────────────────────────────

from . import memory_store as mem_mod


@app.get("/memory/files")
async def list_memory_files():
    """Lista ficheiros de memória."""
    return {"files": mem_mod.list_memory_files()}


@app.get("/memory/stats")
async def memory_stats():
    """Estatísticas das memórias."""
    return mem_mod.get_stats()


@app.get("/memory/read")
async def read_memory(path: str):
    """Lê conteúdo de um ficheiro de memória (path relativo a ~/ghost/)."""
    full_path = str(Path.home() / "ghost" / path)
    content = mem_mod.read_file_content(full_path)
    if not content:
        raise HTTPException(404, "Ficheiro não encontrado")
    return content


class MemorySaveRequest(BaseModel):
    path: str
    content: str


@app.post("/memory/save")
async def save_memory(req: MemorySaveRequest):
    """Guarda conteúdo num ficheiro de memória."""
    try:
        result = mem_mod.save_file_content(req.path, req.content)
        return result
    except PermissionError as e:
        raise HTTPException(403, str(e))
    except Exception as e:
        raise HTTPException(500, f"Erro ao guardar: {e}")


class MemoryAddRequest(BaseModel):
    content: str


@app.post("/memory/add")
async def add_memory(req: MemoryAddRequest):
    """Adiciona uma entrada rápida à MEMORY.md principal."""
    try:
        ghost_dir = Path.home() / "ghost"
        memory_path = ghost_dir / "MEMORY.md"
        memory_path.parent.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        entry = f"\n## {timestamp}\n{req.content}\n"
        with open(memory_path, "a", encoding="utf-8") as f:
            f.write(entry)
        return {"status": "ok", "path": str(memory_path)}
    except Exception as e:
        raise HTTPException(500, f"Erro ao adicionar memória: {e}")


