# Security Review — 1.8F

## Objetivo

Revisar e endurecer pontos de segurança antes de expor a API publicamente.

Esta etapa não executa deploy real e não altera estratégia de infraestrutura. O objetivo é reduzir riscos básicos de exposição, abuso de endpoints sensíveis e payloads inesperados.

## Escopo revisado

- Autenticação
- Refresh tokens
- Recuperação de senha
- Rate limit de rotas sensíveis
- Webhook de pagamento
- Validação de payloads com Zod
- CORS
- Helmet
- Variáveis de ambiente
- Docker/.env
- Testes automatizados de regressão

## Alterações realizadas

### 1. Remoção de exposição de reset token

O endpoint abaixo não retorna mais o `resetToken` no corpo da resposta:

```http
POST /api/auth/forgot-password
```

Antes, o token era gerado corretamente com valor aleatório e salvo como hash, porém o token puro era retornado na resposta HTTP. Isso é inseguro para uma API exposta publicamente.

Agora a resposta mantém apenas a mensagem genérica:

```json
{
  "success": true,
  "data": {
    "message": "If the e-mail is registered, password reset instructions will be sent."
  }
}
```

Também foi adicionado teste automatizado garantindo que `resetToken` não seja exposto.

### 2. Rate limit específico para autenticação

Além do rate limit global da aplicação, foram adicionados limites específicos para rotas sensíveis de autenticação.

Rotas com limite mais restritivo:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

Rotas com limite intermediário:

- `POST /api/auth/refresh`
- `POST /api/auth/logout`

Objetivo:

- reduzir brute force em login;
- reduzir abuso de registro;
- reduzir abuso de recuperação de senha;
- reduzir abuso de refresh/logout.

### 3. Rate limit específico para pagamentos

Foram adicionados limites específicos para:

- `POST /api/payments/orders/:orderId/process`
- `POST /api/payments/webhooks/mercado-pago`

O webhook mantém limite mais alto que rotas comuns porque provedores externos podem reenviar notificações.

### 4. Payloads sensíveis com Zod `.strict()`

Todos os DTOs/schemas internos com `z.object()` passaram a usar `.strict()`, exceto o DTO do webhook do Mercado Pago, que mantém `.passthrough()` intencionalmente.

Motivo da exceção:

- webhooks externos podem enviar campos extras legítimos;
- rejeitar payloads por campos adicionais poderia quebrar compatibilidade com o provedor.

Módulos endurecidos:

- addresses
- admin
- auth
- cart
- categories
- checkout
- orders
- payments
- products
- users

Benefícios:

- bloqueia campos extras inesperados;
- reduz risco de mass assignment;
- impede payloads maliciosos como `role`, `isActive`, `passwordHash` em registro;
- torna contratos de entrada mais previsíveis.

### 5. Testes contra campos extras em auth

Foram adicionados testes para garantir que:

- `POST /api/auth/register` rejeita campos extras como `role`, `isActive` e `passwordHash`;
- `POST /api/auth/refresh` rejeita campos extras como `accessToken` e `userId`.

## Pontos já existentes e mantidos

### CORS

A aplicação já usa CORS com allowlist por origem configurada.

Em produção:

- `CORS_ORIGINS` é obrigatório;
- origens HTTP são bloqueadas;
- localhost, loopback e ngrok são bloqueados;
- apenas origens HTTPS válidas são aceitas.

### Helmet

A aplicação já registra `@fastify/helmet`.

### JWT secret

Em produção:

- `JWT_SECRET` é obrigatório;
- precisa ter pelo menos 32 caracteres;
- valores fracos/de exemplo são bloqueados.

### Refresh tokens

O fluxo atual mantém boas práticas:

- refresh token opaco;
- geração com `randomBytes`;
- armazenamento apenas como hash;
- expiração;
- rotação no refresh;
- revogação no logout;
- revogação de token expirado.

### Webhook Mercado Pago

O webhook valida assinatura usando:

- `x-signature`;
- `x-request-id`;
- `MERCADO_PAGO_WEBHOOK_SECRET`;
- HMAC SHA-256;
- comparação com `timingSafeEqual`.

### Arquivos sensíveis

`.gitignore` e `.dockerignore` impedem versionamento/cópia de arquivos `.env` reais.

## Validações executadas

Comandos executados com sucesso:

```bash
npm run lint
npm run build
npm test
```

Resultado final da suíte completa:

- 14 arquivos de teste passaram;
- 158 testes passaram;
- 0 testes falharam.

## Status da etapa

A etapa 1.8F foi concluída com sucesso.

A API ficou mais segura para exposição futura, mas o deploy real e a preparação final de infraestrutura continuam fora deste tópico e devem permanecer para a etapa 11, quando a API estiver pronta.
