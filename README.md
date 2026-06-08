# Ecommerce Agent

App para gestão de lojas Shopify via chat com IA. Feita para os pais do Santy.

**Stack:** Python (FastAPI) + TypeScript/React (Vite)

## Documentação para Agentes

| Ficheiro | Para quê |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Visão geral da arquitetura |
| [API.md](API.md) | Todos os endpoints e payloads |
| [CONFIG.md](CONFIG.md) | Variáveis de ambiente e configuração |
| [UI.md](UI.md) | Componentes frontend e fluxo de ecrãs |
| [CHAT.md](CHAT.md) | Como o chat funciona (provider direct vs gateway) |
| [INTEGRATIONS.md](INTEGRATIONS.md) | Conexões: Shopify, Meta Ads, Zoho |

## Quick Start

```bash
# 1. Instalar dependências
cd api && pip install -r requirements.txt
cd ../ui && npm install

# 2. Configurar .env em ~/.hermes/ecommerce-agent/.env
# (ou passar pelo onboarding)

# 3. Correr
./start.sh
# UI: http://localhost:5173
# API: http://localhost:7777
```

## Repositório

**Privado.** Contém credenciais reais de lojas Shopify. Não expor.
