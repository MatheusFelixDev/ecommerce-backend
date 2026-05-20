# Variáveis de Ambiente — Produção

## Objetivo

Documentar as variáveis de ambiente necessárias para rodar o ecommerce-backend em produção no Azure Container Apps.

Este documento não deve conter secrets reais.

## Regras gerais

- Nunca commitar secrets reais.
- Nunca commitar DATABASE_URL real.
- Nunca commitar tokens reais.
- Usar Azure Container Apps secrets para runtime.
- Usar GitHub Actions secrets para CI/CD e migrations.
- Manter .env.production.example apenas com exemplos seguros.

## Variáveis core

### NODE_ENV

Ambiente da aplicação.

Valor em produção:

production

Exemplo:

NODE_ENV=production

### PORT

Porta usada pela API dentro do container.

Valor recomendado no Azure Container Apps:

3000

Exemplo:

PORT=3000

### DATABASE_URL

Connection string do Azure Database for PostgreSQL Flexible Server.

Exemplo fictício:

DATABASE_URL=postgresql://ecommerce_admin:SENHA_FORTE@pg-ecommerce-backend-mvp.postgres.database.azure.com:5432/ecommerce_db?sslmode=require

Observações:

- Deve exigir SSL.
- Deve ficar apenas em secrets.
- Não usar valor real neste arquivo.
- Não commitar em .env.

### JWT_SECRET

Secret usado para assinar tokens JWT.

Exemplo fictício:

JWT_SECRET=troque-por-um-secret-forte-com-mais-de-32-caracteres

Regras:

- Usar valor longo.
- Usar valor aleatório.
- Não reutilizar secret de desenvolvimento.
- Não commitar.

### JWT_EXPIRES_IN

Tempo de expiração do access token.

Exemplo:

JWT_EXPIRES_IN=1d

## CORS

### CORS_ORIGINS

Lista de origens permitidas.

MVP com frontend na Vercel:

CORS_ORIGINS=https://seu-frontend.vercel.app

Produção futura:

CORS_ORIGINS=https://seudominio.com,https://www.seudominio.com,https://admin.seudominio.com

Regras:

- Não usar wildcard em produção.
- Usar apenas HTTPS em produção.
- Incluir frontend e admin, se existir.
- Não incluir URL da API como origem, a menos que haja necessidade real.

## Melhor Envio

### MELHOR_ENVIO_ENABLED

Habilita ou desabilita integração com Melhor Envio.

MVP inicial recomendado:

MELHOR_ENVIO_ENABLED=false

Quando for testar integração real:

MELHOR_ENVIO_ENABLED=true

### MELHOR_ENVIO_BASE_URL

URL base da API do Melhor Envio.

Exemplo:

MELHOR_ENVIO_BASE_URL=https://www.melhorenvio.com.br

### MELHOR_ENVIO_ACCESS_TOKEN

Token de acesso do Melhor Envio.

Exemplo fictício:

MELHOR_ENVIO_ACCESS_TOKEN=me_token_real_aqui

Regras:

- Configurar apenas como secret.
- Não commitar.
- Não imprimir em logs.

### MELHOR_ENVIO_USER_AGENT

User-Agent exigido/recomendado para chamadas externas.

Exemplo:

MELHOR_ENVIO_USER_AGENT=ecommerce-backend (contato@seudominio.com)

### MELHOR_ENVIO_ORIGIN_ZIP_CODE

CEP de origem para cálculo de frete.

Exemplo fictício:

MELHOR_ENVIO_ORIGIN_ZIP_CODE=00000000

## Mercado Pago

### MERCADO_PAGO_ENABLED

Habilita ou desabilita integração com Mercado Pago.

Para sandbox:

MERCADO_PAGO_ENABLED=true

### MERCADO_PAGO_BASE_URL

URL base da API do Mercado Pago.

Exemplo:

MERCADO_PAGO_BASE_URL=https://api.mercadopago.com

### MERCADO_PAGO_ACCESS_TOKEN

Access token do Mercado Pago.

Exemplo fictício:

MERCADO_PAGO_ACCESS_TOKEN=TEST-xxxxxxxxxxxxxxxxxxxx

Regras:

- Usar token sandbox no MVP.
- Usar token produção apenas quando estiver pronto para venda real.
- Configurar como secret.
- Não commitar.
- Não imprimir em logs.

### MERCADO_PAGO_PUBLIC_KEY

Public key do Mercado Pago.

Exemplo fictício:

MERCADO_PAGO_PUBLIC_KEY=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

### MERCADO_PAGO_WEBHOOK_SECRET

Secret usado para validar assinatura do webhook.

Exemplo fictício:

MERCADO_PAGO_WEBHOOK_SECRET=secret_sandbox_do_webhook

Regras:

- Configurar como secret.
- Não commitar.
- Validar assinatura em produção.

### MERCADO_PAGO_SUCCESS_URL

URL de retorno para pagamento aprovado.

Durante MVP, exemplo:

MERCADO_PAGO_SUCCESS_URL=https://SUA_URL_AZURE/payments/success

Produção futura:

MERCADO_PAGO_SUCCESS_URL=https://seudominio.com/payments/success

### MERCADO_PAGO_FAILURE_URL

URL de retorno para pagamento recusado/falho.

Durante MVP:

MERCADO_PAGO_FAILURE_URL=https://SUA_URL_AZURE/payments/failure

Produção futura:

MERCADO_PAGO_FAILURE_URL=https://seudominio.com/payments/failure

### MERCADO_PAGO_PENDING_URL

URL de retorno para pagamento pendente.

Durante MVP:

MERCADO_PAGO_PENDING_URL=https://SUA_URL_AZURE/payments/pending

Produção futura:

MERCADO_PAGO_PENDING_URL=https://seudominio.com/payments/pending

### MERCADO_PAGO_NOTIFICATION_URL

URL pública do webhook.

Durante MVP:

MERCADO_PAGO_NOTIFICATION_URL=https://SUA_URL_AZURE/api/payments/webhooks/mercado-pago

Produção futura:

MERCADO_PAGO_NOTIFICATION_URL=https://api.seudominio.com/api/payments/webhooks/mercado-pago

## Variáveis para GitHub Actions

Estas variáveis não são necessariamente usadas pela aplicação em runtime. Elas são usadas para deploy e migrations.

### AZURE_CREDENTIALS

Credencial de autenticação do GitHub Actions com Azure.

Deve ficar em:

GitHub Repository Settings > Secrets and variables > Actions

### AZURE_SUBSCRIPTION_ID

ID da subscription Azure.

### AZURE_RESOURCE_GROUP

Nome do resource group.

Exemplo:

AZURE_RESOURCE_GROUP=rg-ecommerce-backend-mvp

### AZURE_CONTAINER_APP_NAME

Nome do Azure Container App.

Exemplo:

AZURE_CONTAINER_APP_NAME=ca-ecommerce-backend

### GHCR_USERNAME

Usuário ou organização do GitHub Container Registry.

Exemplo:

GHCR_USERNAME=MatheusFelixDev

### GHCR_TOKEN

Token usado para publicar imagem no GitHub Container Registry, se necessário.

## Exemplo consolidado sem secrets reais

NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://usuario:senha@host:5432/ecommerce_db?sslmode=require

JWT_SECRET=troque-por-um-secret-forte
JWT_EXPIRES_IN=1d

CORS_ORIGINS=https://seu-frontend.vercel.app

MELHOR_ENVIO_ENABLED=false
MELHOR_ENVIO_BASE_URL=https://www.melhorenvio.com.br
MELHOR_ENVIO_ACCESS_TOKEN=
MELHOR_ENVIO_USER_AGENT=ecommerce-backend (contato@seudominio.com)
MELHOR_ENVIO_ORIGIN_ZIP_CODE=00000000

MERCADO_PAGO_ENABLED=true
MERCADO_PAGO_BASE_URL=https://api.mercadopago.com
MERCADO_PAGO_ACCESS_TOKEN=TEST-token-sandbox
MERCADO_PAGO_PUBLIC_KEY=TEST-public-key
MERCADO_PAGO_WEBHOOK_SECRET=secret-sandbox
MERCADO_PAGO_SUCCESS_URL=https://SUA_URL_AZURE/payments/success
MERCADO_PAGO_FAILURE_URL=https://SUA_URL_AZURE/payments/failure
MERCADO_PAGO_PENDING_URL=https://SUA_URL_AZURE/payments/pending
MERCADO_PAGO_NOTIFICATION_URL=https://SUA_URL_AZURE/api/payments/webhooks/mercado-pago

## Checklist final

- [ ] Todas as variáveis obrigatórias foram configuradas no Azure Container Apps.
- [ ] Secrets reais não foram commitados.
- [ ] DATABASE_URL exige SSL.
- [ ] CORS_ORIGINS aponta apenas para domínios confiáveis.
- [ ] Mercado Pago está em sandbox durante MVP.
- [ ] Melhor Envio está desabilitado até validação real.
- [ ] GitHub Actions possui secrets separados para deploy/migration.
