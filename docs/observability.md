# Observabilidade da API

## Objetivo

Este documento define o padrão mínimo de observabilidade da API `ecommerce-backend` antes da exposição em produção.

A observabilidade cobre:

- logs estruturados;
- request ID / correlation ID;
- tratamento seguro de erros;
- health check;
- rastreabilidade de falhas em integrações externas;
- métricas recomendadas;
- monitoramento de uptime;
- checklist inicial de incidentes.

## Logs estruturados

A API utiliza Pino integrado ao Fastify.

Comportamento por ambiente:

| Ambiente      | Comportamento                           |
| ------------- | --------------------------------------- |
| `development` | logs legíveis com `pino-pretty`         |
| `test`        | logs desativados para não poluir testes |
| `production`  | logs JSON estruturados                  |

O nível de log pode ser configurado com:

```env
LOG_LEVEL=info

Valores aceitos:

trace
debug
info
warn
error
fatal
silent
Redaction de dados sensíveis

Os logs devem ocultar campos sensíveis automaticamente.

Campos que não devem aparecer em logs:

password
passwordHash
password_hash
authorization
accessToken
refreshToken
resetToken
emailChangeToken
JWT_SECRET
MERCADO_PAGO_ACCESS_TOKEN
MERCADO_PAGO_WEBHOOK_SECRET
MELHOR_ENVIO_ACCESS_TOKEN
DATABASE_URL

Quando algum desses campos for capturado em contexto de log, o valor deve ser substituído por:

[REDACTED]
Request ID / Correlation ID

Toda requisição deve ter um request ID.

Comportamento:

se o cliente enviar x-request-id válido, a API reutiliza esse valor;
se o cliente não enviar, a API gera um UUID;
se o cliente enviar valor inválido ou inseguro, a API ignora e gera um novo ID;
toda resposta devolve o header x-request-id;
logs internos usam o campo requestId.

Formato aceito para x-request-id:

[a-zA-Z0-9._:-]

Limite:

1 a 128 caracteres
Como rastrear erro por request ID

Quando um cliente reportar erro, peça o valor do header:

x-request-id

Depois, filtre os logs por:

requestId=<valor>

Em ambiente JSON, buscar por:

{
  "requestId": "valor-do-request-id"
}
Error handler

O error handler deve:

preservar o formato de AppError;
retornar erro genérico para falhas inesperadas;
não expor stack trace em produção;
logar internamente:
requestId;
método HTTP;
URL;
status code;
código interno do erro;
contexto seguro, quando existir.

Formato genérico para erro inesperado:

{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Internal server error."
  }
}
Health check

Endpoint atual:

GET /api/health

Resposta esperada:

{
  "success": true,
  "data": {
    "status": "ok",
    "service": "ecommerce-backend-api",
    "environment": "production",
    "version": "1.0.0",
    "uptimeInSeconds": 123,
    "timestamp": "2026-05-24T00:00:00.000Z"
  }
}

Esse endpoint deve permanecer leve e sem vazamento de secrets.

Ele pode ser usado por:

Docker HEALTHCHECK;
Azure App Service health check;
uptime monitor externo;
verificação manual de operação.
Integrações externas
Melhor Envio

Falhas de frete devem gerar contexto seguro com:

provider: MELHOR_ENVIO;
operation: calculate_shipping;
externalStatusCode, quando disponível.

Nunca logar:

access token;
authorization header;
payload completo com dados sensíveis.
Mercado Pago

Falhas de pagamento devem gerar contexto seguro com:

provider: MERCADO_PAGO;
operation;
orderId, quando aplicável;
providerPaymentId, quando aplicável;
externalStatusCode, quando disponível.

Nunca logar:

access token;
webhook secret;
authorization header;
assinatura completa do webhook;
payload completo sensível.
Métricas recomendadas para produção

Na primeira versão em produção, monitorar pelo menos:

quantidade total de requests;
taxa de erro 5xx;
taxa de erro 4xx;
latência média;
latência p95;
falhas em pagamento;
falhas em frete;
webhooks recebidos;
webhooks rejeitados;
pedidos criados;
pagamentos aprovados;
pagamentos rejeitados;
uso de CPU;
uso de memória;
conexões com banco;
reinicializações do container/app.
Alertas recomendados

Configurar alertas para:

/api/health indisponível;
aumento de erro 5xx;
latência p95 acima do limite aceitável;
falha recorrente no Mercado Pago;
falha recorrente no Melhor Envio;
webhook do Mercado Pago rejeitado repetidamente;
banco indisponível;
uso alto de CPU;
uso alto de memória;
reinicializações frequentes da aplicação.
Checklist de incidente: erro 500
Coletar x-request-id do cliente.
Buscar logs por requestId.
Identificar code interno.
Verificar método e URL.
Verificar se o erro veio de integração externa.
Verificar disponibilidade do banco.
Verificar variáveis de ambiente.
Reproduzir em ambiente seguro, se possível.
Corrigir causa raiz.
Registrar conclusão do incidente.
Checklist de incidente: pagamento
Buscar logs por requestId, orderId ou providerPaymentId.
Conferir provider = MERCADO_PAGO.
Conferir operation.
Conferir externalStatusCode.
Verificar status no painel do Mercado Pago.
Conferir se webhook foi recebido.
Conferir se webhook foi validado ou rejeitado.
Conferir se o pedido foi atualizado corretamente.
Reprocessar apenas se for seguro e idempotente.
Checklist de incidente: frete
Buscar logs por requestId.
Conferir provider = MELHOR_ENVIO.
Conferir operation = calculate_shipping.
Conferir externalStatusCode.
Verificar se Melhor Envio está disponível.
Conferir CEP de origem e destino.
Conferir dados físicos dos produtos.
Conferir se token e user agent estão configurados.
Repetir cotação em ambiente seguro.
Azure App Service / Docker

Recomendações:

manter logs em JSON em produção;
configurar LOG_LEVEL=info;
usar /api/health como health check;
armazenar secrets fora do repositório;
enviar logs para ferramenta centralizada;
configurar alertas de disponibilidade;
configurar alertas para erro 5xx;
manter Docker HEALTHCHECK simples;
não expor stack trace em resposta HTTP.
```
