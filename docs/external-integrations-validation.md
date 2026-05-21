# Validação de Integrações Externas — Melhor Envio e Mercado Pago

Este documento descreve o processo seguro para validar as integrações externas do backend ecommerce em ambiente sandbox e, futuramente, em produção.

Escopo deste guia:

- Melhor Envio
- Mercado Pago
- Validação manual sandbox
- Checklist de produção
- Regras de segurança para secrets
- Erros comuns
- Critérios de aceite

Este documento não executa deploy real e não deve conter tokens reais.

---

## 1. Regras gerais de segurança

Nunca commitar:

- `.env`
- tokens reais
- access tokens
- public keys reais
- webhook secrets reais
- credenciais de produção
- prints de terminal contendo secrets

Sempre usar:

- `.env.example` para documentação de variáveis
- `.env.test.example` para valores fake de teste
- `.env.production.example` apenas com placeholders
- provedor de secrets no ambiente real
- logs sem tokens
- testes automatizados com mock/fake/stub

---

## 2. Variáveis de ambiente envolvidas

### Melhor Envio

Quando `MELHOR_ENVIO_ENABLED=true`, validar:

```env
MELHOR_ENVIO_ENABLED=true
MELHOR_ENVIO_BASE_URL=https://sandbox.melhorenvio.com.br
MELHOR_ENVIO_ACCESS_TOKEN=<sandbox_access_token>
MELHOR_ENVIO_USER_AGENT=ecommerce-backend (email-tecnico@example.com)
MELHOR_ENVIO_ORIGIN_ZIP_CODE=32073000

Regras:

MELHOR_ENVIO_ACCESS_TOKEN deve vir do painel sandbox.
MELHOR_ENVIO_USER_AGENT deve identificar a aplicação e conter contato técnico.
MELHOR_ENVIO_ORIGIN_ZIP_CODE deve conter apenas 8 dígitos.
Nunca usar token real no repositório.
Nunca expor token em logs.
Mercado Pago

Quando MERCADO_PAGO_ENABLED=true, validar:

MERCADO_PAGO_ENABLED=true
MERCADO_PAGO_BASE_URL=https://api.mercadopago.com
MERCADO_PAGO_ACCESS_TOKEN=<sandbox_access_token>
MERCADO_PAGO_PUBLIC_KEY=<sandbox_public_key>
MERCADO_PAGO_WEBHOOK_SECRET=<webhook_secret>
MERCADO_PAGO_SUCCESS_URL=https://frontend-sandbox.example.com/payment/success
MERCADO_PAGO_FAILURE_URL=https://frontend-sandbox.example.com/payment/failure
MERCADO_PAGO_PENDING_URL=https://frontend-sandbox.example.com/payment/pending
MERCADO_PAGO_NOTIFICATION_URL=https://api-sandbox.example.com/api/payments/webhooks/mercado-pago

Regras:

MERCADO_PAGO_ACCESS_TOKEN deve ser sandbox/test.
MERCADO_PAGO_PUBLIC_KEY deve ser sandbox/test.
MERCADO_PAGO_WEBHOOK_SECRET deve ser gerado/configurado no painel do Mercado Pago.
URLs SUCCESS, FAILURE e PENDING devem apontar para o frontend.
NOTIFICATION_URL deve apontar para a API.
Webhook deve usar HTTPS público quando validado manualmente.
Nunca expor tokens ou webhook secret.
3. Melhor Envio — validação sandbox
3.1 Objetivo

Validar se o backend consegue:

montar payload de cotação corretamente;
normalizar CEP de origem e destino;
enviar peso e dimensões dos produtos;
tratar erro externo;
tratar provider desabilitado;
não vazar token em logs.
3.2 Pré-requisitos
Conta/app sandbox no Melhor Envio.
Access token sandbox.
Produtos cadastrados com:
peso em gramas;
largura em cm;
altura em cm;
comprimento em cm;
preço;
estoque.
Endereço de cliente com CEP válido.
Carrinho com produto disponível.
3.3 Checklist de configuração

Verificar no .env local de sandbox:

MELHOR_ENVIO_ENABLED=true
MELHOR_ENVIO_BASE_URL=https://sandbox.melhorenvio.com.br
MELHOR_ENVIO_ACCESS_TOKEN=<sandbox_access_token>
MELHOR_ENVIO_USER_AGENT=ecommerce-backend (email-tecnico@example.com)
MELHOR_ENVIO_ORIGIN_ZIP_CODE=32073000

Confirmar:

[ ] token não está commitado;
[ ] user agent identifica aplicação e contato técnico;
[ ] CEP de origem possui 8 dígitos;
[ ] base URL aponta para sandbox;
[ ] logs não imprimem token;
[ ] provider desabilitado retorna erro controlado.
3.4 Endpoint de cotação

Endpoint interno esperado:

POST /api/checkout/shipping

Exemplo:

curl -X POST "$BASE_URL/checkout/shipping" \
  -H "Authorization: Bearer $TOKEN_CUSTOMER" \
  -H "Content-Type: application/json" \
  -d '{
    "addressId": "ADDRESS_ID"
  }'

Resposta esperada:

{
  "success": true,
  "data": [
    {
      "provider": "MELHOR_ENVIO",
      "serviceCode": "1",
      "serviceName": "PAC",
      "priceInCents": 2050,
      "deadlineDays": 5
    }
  ]
}
3.5 Endpoint de revisão do checkout

Endpoint interno esperado:

POST /api/checkout/review

Exemplo:

curl -X POST "$BASE_URL/checkout/review" \
  -H "Authorization: Bearer $TOKEN_CUSTOMER" \
  -H "Content-Type: application/json" \
  -d '{
    "addressId": "ADDRESS_ID",
    "shippingServiceCode": "1",
    "paymentMethod": "PIX"
  }'

Validar:

[ ] subtotal correto;
[ ] frete escolhido encontrado;
[ ] total = subtotal + frete - desconto;
[ ] serviço inexistente retorna erro controlado;
[ ] carrinho vazio retorna erro controlado;
[ ] produto sem peso/dimensão retorna erro controlado.
3.6 Erros comuns — Melhor Envio
ErroCausa provávelAção
SHIPPING_PROVIDER_DISABLEDMELHOR_ENVIO_ENABLED=falseAtivar apenas em sandbox quando for validar
SHIPPING_PROVIDER_NOT_CONFIGUREDVariável obrigatória ausenteConferir .env
PRODUCT_SHIPPING_DATA_REQUIREDProduto sem peso/dimensãoCorrigir cadastro do produto
PRODUCT_SHIPPING_DATA_INVALIDPeso/dimensão/preço/quantidade menor ou igual a zeroCorrigir cadastro ou payload
SHIPPING_PROVIDER_TIMEOUTAPI externa demorou além do limiteTentar novamente e verificar status externo
Erro 401/403Token inválido ou ambiente erradoConferir token sandbox/produção
Erro 422Payload inválidoConferir CEPs, produtos e dimensões
4. Mercado Pago — validação sandbox
4.1 Objetivo

Validar se o backend consegue:

criar preferência de pagamento;
enviar external_reference com orderId;
enviar metadata segura;
gerar notification_url;
processar webhook assinado;
rejeitar webhook inválido;
impedir pagamento duplicado;
não reprocessar pedido já pago indevidamente;
não vazar access token ou webhook secret em logs.
4.2 Pré-requisitos
Aplicação criada no painel Mercado Pago.
Credenciais sandbox/test.
Conta de teste vendedor.
Conta de teste comprador.
Pedido criado no backend.
URL HTTPS pública para receber webhook quando a validação manual exigir callback real.
4.3 Checklist de configuração

Verificar no .env local/sandbox:

MERCADO_PAGO_ENABLED=true
MERCADO_PAGO_BASE_URL=https://api.mercadopago.com
MERCADO_PAGO_ACCESS_TOKEN=<sandbox_access_token>
MERCADO_PAGO_PUBLIC_KEY=<sandbox_public_key>
MERCADO_PAGO_WEBHOOK_SECRET=<webhook_secret>
MERCADO_PAGO_SUCCESS_URL=https://frontend-sandbox.example.com/payment/success
MERCADO_PAGO_FAILURE_URL=https://frontend-sandbox.example.com/payment/failure
MERCADO_PAGO_PENDING_URL=https://frontend-sandbox.example.com/payment/pending
MERCADO_PAGO_NOTIFICATION_URL=https://api-sandbox.example.com/api/payments/webhooks/mercado-pago

Confirmar:

[ ] access token é sandbox/test;
[ ] public key é sandbox/test;
[ ] webhook secret está configurado;
[ ] notification URL usa HTTPS público em validação real;
[ ] URLs success/failure/pending apontam para frontend;
[ ] token e secret não aparecem em logs;
[ ] provider desabilitado retorna erro controlado.
4.4 Criar preferência de pagamento

Endpoint interno esperado:

POST /api/payments/orders/:orderId

Exemplo:

curl -X POST "$BASE_URL/payments/orders/$ORDER_ID" \
  -H "Authorization: Bearer $TOKEN_CUSTOMER" \
  -H "Content-Type: application/json"

Resposta esperada:

{
  "success": true,
  "data": {
    "id": "PAYMENT_ID",
    "orderId": "ORDER_ID",
    "provider": "MERCADO_PAGO",
    "status": "PENDING",
    "paymentUrl": "https://..."
  }
}

Validar:

[ ] preferência criada;
[ ] external_reference aponta para orderId;
[ ] metadata.order_id contém orderId;
[ ] metadata.payment_method contém método escolhido;
[ ] metadata.amount_in_cents contém valor em centavos;
[ ] metadata não contém token, senha, JWT ou dados sensíveis;
[ ] pedido de outro usuário é bloqueado;
[ ] pedido já pago não gera nova preferência;
[ ] pedido cancelado não gera pagamento;
[ ] pagamento duplicado é bloqueado.
4.5 Webhook Mercado Pago

Endpoint interno esperado:

POST /api/payments/webhooks/mercado-pago

Headers esperados:

x-signature: ts=<timestamp>,v1=<signature>
x-request-id: <request-id>

Query/body esperado:

data.id=<payment_id>
type=payment

Validar:

[ ] webhook sem assinatura é rejeitado;
[ ] webhook com assinatura inválida é rejeitado;
[ ] webhook válido é aceito;
[ ] webhook sem id de pagamento retorna erro controlado;
[ ] tipo de evento não suportado não quebra a API;
[ ] pagamento aprovado atualiza pagamento/pedido;
[ ] pagamento pendente não marca pedido como pago;
[ ] pagamento rejeitado/cancelado/refundado não marca pedido como pago;
[ ] webhook duplicado não reprocessa indevidamente;
[ ] webhook atrasado de pedido cancelado não quebra estado.
4.6 Status esperados

Mapeamento esperado:

Status Mercado PagoResultado interno esperado
approvedpagamento aprovado / pedido pago
paidpagamento aprovado / pedido pago
pendingpagamento pendente
in_processpagamento pendente
rejectedpagamento rejeitado
cancelledpagamento cancelado
refundedpagamento estornado
desconhecidonão aprovar pedido automaticamente
4.7 Erros comuns — Mercado Pago
ErroCausa provávelAção
PAYMENT_PROVIDER_DISABLEDMERCADO_PAGO_ENABLED=falseAtivar apenas em sandbox quando for validar
PAYMENT_PROVIDER_NOT_CONFIGUREDVariável obrigatória ausenteConferir .env
PAYMENT_PROVIDER_TIMEOUTAPI externa demorou além do limiteTentar novamente e verificar status externo
assinatura inválidaWEBHOOK_SECRET, x-signature, x-request-id ou data.id divergenteConferir configuração do webhook
401/403token inválido ou ambiente erradoConferir credenciais sandbox/produção
pagamento duplicadopedido já possui pagamento ativoNão recriar preferência
5. Testes automatizados

Os testes automatizados não devem chamar APIs reais.

Cobertura esperada:

Melhor Envio

Arquivo:

tests/checkout/melhor-envio-provider.test.ts

Cenários:

provider desabilitado;
payload correto com CEPs normalizados;
produto com peso/dimensão inválidos;
timeout controlado;
sem token real;
sem chamada externa real.
Mercado Pago

Arquivo:

tests/payments/mercado-pago-provider.test.ts

Cenários:

provider desabilitado;
criação de preferência com payload seguro;
external_reference;
metadata sem secrets;
assinatura inválida rejeitada;
assinatura válida aceita;
timeout controlado;
sem token real;
sem chamada externa real.
Rotas de pagamento

Arquivo:

tests/payments/payments.test.ts

Cenários mínimos:

processar pagamento de pedido do usuário autenticado;
bloquear pagamento sem token;
bloquear pedido inexistente;
bloquear pedido de outro usuário;
bloquear pedido não pagável;
bloquear pagamento duplicado;
rejeitar webhook sem assinatura;
processar webhook aprovado válido.
6. Checklist de produção — Melhor Envio

Antes de ativar produção:

[ ] deploy da API concluído em ambiente planejado;
[ ] domínio HTTPS final definido;
[ ] MELHOR_ENVIO_ENABLED=true;
[ ] base URL de produção confirmada na documentação/painel;
[ ] token real salvo apenas no provedor de secrets;
[ ] user agent real com contato técnico;
[ ] CEP de origem real;
[ ] produtos com peso/dimensões reais;
[ ] política de frete definida;
[ ] fallback para indisponibilidade externa definido;
[ ] logs monitorados;
[ ] nenhum token aparece nos logs;
[ ] teste real controlado aprovado.
7. Checklist de produção — Mercado Pago

Antes de ativar produção:

[ ] deploy da API concluído em ambiente planejado;
[ ] domínio HTTPS final definido;
[ ] frontend final definido;
[ ] MERCADO_PAGO_ENABLED=true;
[ ] access token real salvo apenas no provedor de secrets;
[ ] public key real salva no provedor de secrets/configuração segura;
[ ] webhook secret real salvo apenas no provedor de secrets;
[ ] MERCADO_PAGO_NOTIFICATION_URL aponta para /api/payments/webhooks/mercado-pago;
[ ] URLs success/failure/pending apontam para frontend final;
[ ] webhook configurado no painel do Mercado Pago;
[ ] assinatura de webhook validada;
[ ] teste real controlado aprovado;
[ ] teste de pagamento rejeitado validado;
[ ] teste de cancelamento/estorno planejado;
[ ] logs monitorados;
[ ] alerta para falha de webhook planejado;
[ ] nenhum token aparece nos logs.
8. Critérios de aceite deste tópico

Este tópico é considerado aprovado quando:

[ ] Melhor Envio auditado;
[ ] Mercado Pago auditado;
[ ] providers protegidos contra provider desabilitado;
[ ] providers protegidos contra configuração ausente;
[ ] timeout externo tratado;
[ ] payload de frete validado;
[ ] payload de pagamento validado;
[ ] webhook Mercado Pago validado;
[ ] testes sem chamadas externas reais;
[ ] checklist sandbox documentado;
[ ] checklist produção documentado;
[ ] npm run lint passa;
[ ] npm run build passa;
[ ] npm test passa;
[ ] docker build -t ecommerce-backend:prod . passa;
[ ] git status fica limpo após commit.
9. Comandos finais de validação

Executar antes do commit:

npm run lint
npm run build
npm test
docker build -t ecommerce-backend:prod .
git status --short

Commit sugerido quando houver código, testes e documentação:

git add .
git commit -m "chore: validate external integrations readiness"
git push origin develop

Se houver apenas documentação:

git add docs/external-integrations-validation.md
git commit -m "docs: add external integrations validation guide"
git push origin develop

