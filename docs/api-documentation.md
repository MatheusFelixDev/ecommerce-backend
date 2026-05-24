# Ecommerce Backend API Documentation

Documentação formal da API do projeto `ecommerce-backend`.

Esta documentação tem como objetivo orientar o consumo da API pelo frontend, painel administrativo, testes manuais e futuras integrações externas.

## 1. Visão geral

- Nome da API: `ecommerce-backend-api`
- Base URL local: `http://localhost:3000/api`
- Base URL futura de produção: `https://sua-api-em-producao.com/api`
- Formato: REST/JSON
- Autenticação: Bearer Token via JWT
- Roles disponíveis:
  - `CUSTOMER`
  - `ADMIN`

A aplicação registra os módulos principais sob o prefixo global `/api`.

Módulos documentados:

- Health
- Auth
- Users/Profile
- Addresses
- Categories
- Products
- Cart
- Checkout
- Orders
- Payments
- Admin

## 2. Padrão de respostas

### Resposta de sucesso

A maioria dos endpoints retorna:

```json
{
  "success": true,
  "data": {}
}

Alguns endpoints paginados retornam também meta:

{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "perPage": 10,
    "total": 0,
    "totalPages": 0
  }
}
Resposta de erro

Erros de regra de negócio retornam:

{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message."
  }
}

Erros de validação retornam:

{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data.",
    "issues": []
  }
}
3. Autenticação

Endpoints protegidos exigem o header:

Authorization: Bearer <TOKEN>

Exemplo:

curl -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN_CUSTOMER"

Quando o token não é enviado ou é inválido, a API retorna:

{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "Authentication required."
  }
}

Quando o usuário autenticado não possui a role necessária, a API retorna:

{
  "success": false,
  "error": {
    "code": "FORBIDDEN_ACCESS",
    "message": "Forbidden access."
  }
}
4. Variáveis base para exemplos curl

Use estas variáveis nos testes manuais:

BASE_URL=http://localhost:3000/api

TOKEN_CUSTOMER=cole_o_token_customer_aqui
TOKEN_ADMIN=cole_o_token_admin_aqui



## 5. Health

### GET /api/health

Verifica se a API está ativa.

- Autenticação: não
- Role: pública

#### Response 200

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "ecommerce-backend-api",
    "timestamp": "2026-05-20T00:00:00.000Z"
  }
}
```

#### Exemplo curl

```bash
curl -X GET "$BASE_URL/health"
```

---

## 6. Auth

O módulo de autenticação gerencia cadastro, login, refresh token, logout, recuperação de senha e consulta do usuário autenticado.

Rotas confirmadas:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`
- `GET /api/auth/admin-check`

### POST /api/auth/register

Cria um novo usuário com role padrão `CUSTOMER`.

- Autenticação: não
- Role: pública
- Rate limit: rota sensível de autenticação

#### Body

```json
{
  "name": "Matheus Felix",
  "email": "matheus@example.com",
  "password": "12345678"
}
```

#### Regras de validação

- `name`: string, mínimo 2 caracteres, máximo 120
- `email`: e-mail válido, máximo 255, convertido para lowercase
- `password`: mínimo 8 caracteres, máximo 72

#### Response 201

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Matheus Felix",
      "email": "matheus@example.com",
      "phone": null,
      "role": "CUSTOMER",
      "isActive": true,
      "createdAt": "2026-05-20T00:00:00.000Z",
      "updatedAt": "2026-05-20T00:00:00.000Z"
    }
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `VALIDATION_ERROR` | 400 | Body inválido |
| `EMAIL_ALREADY_IN_USE` | 409 | E-mail já cadastrado |

#### Exemplo curl

```bash
curl -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Matheus Felix",
    "email": "matheus@example.com",
    "password": "12345678"
  }'
```

---

### POST /api/auth/login

Autentica o usuário e retorna access token e refresh token.

- Autenticação: não
- Role: pública
- Rate limit: rota sensível de autenticação

#### Body

```json
{
  "email": "matheus@example.com",
  "password": "12345678"
}
```

#### Regras de validação

- `email`: e-mail válido, máximo 255, convertido para lowercase
- `password`: obrigatório, máximo 72 caracteres

#### Response 200

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Matheus Felix",
      "email": "matheus@example.com",
      "phone": null,
      "role": "CUSTOMER",
      "isActive": true
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "opaque_refresh_token"
    }
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `VALIDATION_ERROR` | 400 | Body inválido |
| `INVALID_CREDENTIALS` | 401 | E-mail ou senha inválidos |
| `USER_INACTIVE` | 403 | Usuário inativo |

#### Exemplo curl

```bash
curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "matheus@example.com",
    "password": "12345678"
  }'
```

---

### POST /api/auth/refresh

Gera um novo access token e rotaciona o refresh token.

- Autenticação: não
- Role: pública
- Rate limit: rota de token

#### Body

```json
{
  "refreshToken": "opaque_refresh_token"
}
```

#### Response 200

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Matheus Felix",
      "email": "matheus@example.com",
      "phone": null,
      "role": "CUSTOMER",
      "isActive": true
    },
    "tokens": {
      "accessToken": "new_jwt_access_token",
      "refreshToken": "new_opaque_refresh_token"
    }
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `VALIDATION_ERROR` | 400 | Body inválido |
| `INVALID_REFRESH_TOKEN` | 401 | Refresh token inválido, expirado, revogado ou não encontrado |

#### Exemplo curl

```bash
curl -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "opaque_refresh_token"
  }'
```

---

### POST /api/auth/logout

Revoga o refresh token informado.

- Autenticação: não
- Role: pública
- Rate limit: rota de token

#### Body

```json
{
  "refreshToken": "opaque_refresh_token"
}
```

#### Response 200

```json
{
  "success": true,
  "data": {
    "message": "Logout completed successfully."
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `VALIDATION_ERROR` | 400 | Body inválido |
| `INVALID_REFRESH_TOKEN` | 401 | Refresh token inválido ou não encontrado |

#### Exemplo curl

```bash
curl -X POST "$BASE_URL/auth/logout" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "opaque_refresh_token"
  }'
```

---

### POST /api/auth/forgot-password

Solicita recuperação de senha.

- Autenticação: não
- Role: pública
- Rate limit: rota sensível de autenticação

#### Body

```json
{
  "email": "matheus@example.com"
}
```

#### Response 200

```json
{
  "success": true,
  "data": {
    "message": "If the e-mail is registered, password reset instructions will be sent."
  }
}
```

#### Observação

Por segurança, a resposta é genérica mesmo se o e-mail não existir.

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `VALIDATION_ERROR` | 400 | Body inválido |

#### Exemplo curl

```bash
curl -X POST "$BASE_URL/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "matheus@example.com"
  }'
```

---

### POST /api/auth/reset-password

Redefine a senha usando token de recuperação.

- Autenticação: não
- Role: pública
- Rate limit: rota sensível de autenticação

#### Body

```json
{
  "token": "reset_token_com_minimo_32_caracteres",
  "newPassword": "novaSenha123"
}
```

#### Regras de validação

- `token`: mínimo 32 caracteres
- `newPassword`: mínimo 8 caracteres

#### Response 204

Sem corpo de resposta.

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `VALIDATION_ERROR` | 400 | Body inválido |
| `INVALID_PASSWORD_RESET_TOKEN` | 400 | Token inválido, expirado ou já usado |

#### Exemplo curl

```bash
curl -X POST "$BASE_URL/auth/reset-password" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset_token_com_minimo_32_caracteres",
    "newPassword": "novaSenha123"
  }'
```

---

### GET /api/auth/me

Retorna os dados do usuário autenticado.

- Autenticação: sim
- Role: `CUSTOMER` ou `ADMIN`

#### Response 200

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Matheus Felix",
      "email": "matheus@example.com",
      "phone": null,
      "role": "CUSTOMER",
      "isActive": true
    }
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `USER_NOT_FOUND` | 404 | Usuário do token não existe |

#### Exemplo curl

```bash
curl -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN_CUSTOMER"
```

---

### GET /api/auth/admin-check

Valida se o usuário autenticado possui acesso administrativo.

- Autenticação: sim
- Role: `ADMIN`

#### Response 200

```json
{
  "success": true,
  "data": {
    "message": "Admin access granted."
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `FORBIDDEN_ACCESS` | 403 | Usuário autenticado não é `ADMIN` |

#### Exemplo curl

```bash
curl -X GET "$BASE_URL/auth/admin-check" \
  -H "Authorization: Bearer $TOKEN_ADMIN"
```

---

## 7. Users/Profile

O módulo de perfil permite ao usuário autenticado consultar e atualizar seus próprios dados, alterar senha e solicitar/confirmar troca de e-mail.

Todas as rotas deste módulo exigem autenticação via Bearer Token.

Rotas confirmadas:

- `GET /api/users/profile`
- `PATCH /api/users/profile`
- `PATCH /api/users/profile/password`
- `POST /api/users/profile/email/request`
- `POST /api/users/profile/email/confirm`

### GET /api/users/profile

Retorna o perfil do usuário autenticado.

- Autenticação: sim
- Role: `CUSTOMER` ou `ADMIN`

#### Response 200

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Matheus Felix",
      "email": "matheus@example.com",
      "phone": null,
      "role": "CUSTOMER",
      "isActive": true,
      "createdAt": "2026-05-20T00:00:00.000Z",
      "updatedAt": "2026-05-20T00:00:00.000Z"
    }
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `USER_NOT_FOUND` | 404 | Usuário autenticado não existe |

#### Exemplo curl

```bash
curl -X GET "$BASE_URL/users/profile" \
  -H "Authorization: Bearer $TOKEN_CUSTOMER"
```

---

### PATCH /api/users/profile

Atualiza dados básicos do perfil do usuário autenticado.

- Autenticação: sim
- Role: `CUSTOMER` ou `ADMIN`

#### Body

```json
{
  "name": "Matheus Felix",
  "phone": "31999999999"
}
```

#### Regras de validação

- `name`: opcional, string, mínimo 2 caracteres, máximo 100
- `phone`: opcional, string ou `null`, mínimo 8 caracteres, máximo 20

#### Response 200

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Matheus Felix",
      "email": "matheus@example.com",
      "phone": "31999999999",
      "role": "CUSTOMER",
      "isActive": true,
      "createdAt": "2026-05-20T00:00:00.000Z",
      "updatedAt": "2026-05-20T00:00:00.000Z"
    }
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `VALIDATION_ERROR` | 400 | Body inválido |
| `USER_NOT_FOUND` | 404 | Usuário autenticado não existe |

#### Exemplo curl

```bash
curl -X PATCH "$BASE_URL/users/profile" \
  -H "Authorization: Bearer $TOKEN_CUSTOMER" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Matheus Felix",
    "phone": "31999999999"
  }'
```

---

### PATCH /api/users/profile/password

Altera a senha do usuário autenticado.

- Autenticação: sim
- Role: `CUSTOMER` ou `ADMIN`

#### Body

```json
{
  "currentPassword": "12345678",
  "newPassword": "novaSenha123"
}
```

#### Regras de validação

- `currentPassword`: mínimo 8 caracteres
- `newPassword`: mínimo 8 caracteres

#### Response 204

Sem corpo de resposta.

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `VALIDATION_ERROR` | 400 | Body inválido |
| `INVALID_CURRENT_PASSWORD` | 400 | Senha atual incorreta |
| `USER_NOT_FOUND` | 404 | Usuário autenticado não existe |

#### Exemplo curl

```bash
curl -X PATCH "$BASE_URL/users/profile/password" \
  -H "Authorization: Bearer $TOKEN_CUSTOMER" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "12345678",
    "newPassword": "novaSenha123"
  }'
```

---

### POST /api/users/profile/email/request

Solicita troca de e-mail do usuário autenticado.

- Autenticação: sim
- Role: `CUSTOMER` ou `ADMIN`

#### Body

```json
{
  "newEmail": "novo.email@example.com",
  "currentPassword": "12345678"
}
```

#### Regras de validação

- `newEmail`: e-mail válido, convertido para lowercase
- `currentPassword`: mínimo 8 caracteres

#### Response 200

```json
{
  "success": true,
  "data": {
    "message": "E-mail change confirmation instructions will be sent.",
    "emailChangeToken": "token_de_confirmacao"
  }
}
```

#### Observação

No comportamento atual da API, o token de troca de e-mail é retornado na resposta. Em produção, esse fluxo pode futuramente ser adaptado para envio por e-mail e remoção do token do response público.

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `VALIDATION_ERROR` | 400 | Body inválido |
| `INVALID_CURRENT_PASSWORD` | 400 | Senha atual incorreta |
| `EMAIL_ALREADY_IN_USE` | 409 | Novo e-mail já cadastrado |

#### Exemplo curl

```bash
curl -X POST "$BASE_URL/users/profile/email/request" \
  -H "Authorization: Bearer $TOKEN_CUSTOMER" \
  -H "Content-Type: application/json" \
  -d '{
    "newEmail": "novo.email@example.com",
    "currentPassword": "12345678"
  }'
```

---

### POST /api/users/profile/email/confirm

Confirma a troca de e-mail usando token.

- Autenticação: sim
- Role: `CUSTOMER` ou `ADMIN`

#### Body

```json
{
  "token": "token_de_confirmacao_com_minimo_32_caracteres"
}
```

#### Regras de validação

- `token`: mínimo 32 caracteres

#### Response 200

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Matheus Felix",
      "email": "novo.email@example.com",
      "phone": "31999999999",
      "role": "CUSTOMER",
      "isActive": true,
      "createdAt": "2026-05-20T00:00:00.000Z",
      "updatedAt": "2026-05-20T00:00:00.000Z"
    }
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `VALIDATION_ERROR` | 400 | Body inválido |
| `INVALID_EMAIL_CHANGE_TOKEN` | 400 | Token inválido, expirado ou já usado |
| `EMAIL_ALREADY_IN_USE` | 409 | Novo e-mail já cadastrado por outro usuário |

#### Exemplo curl

```bash
curl -X POST "$BASE_URL/users/profile/email/confirm" \
  -H "Authorization: Bearer $TOKEN_CUSTOMER" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "token_de_confirmacao_com_minimo_32_caracteres"
  }'
```

---

## 8. Addresses

O módulo de endereços permite ao usuário autenticado criar, listar, atualizar, remover e definir endereço principal.

Todas as rotas exigem autenticação. O usuário só acessa seus próprios endereços.

Rotas confirmadas:

- `POST /api/addresses`
- `GET /api/addresses`
- `PATCH /api/addresses/:id`
- `DELETE /api/addresses/:id`
- `PATCH /api/addresses/:id/main`

### POST /api/addresses

Cria um endereço para o usuário autenticado.

- Autenticação: sim
- Role: `CUSTOMER` ou `ADMIN`

#### Body

```json
{
  "label": "Casa",
  "recipientName": "Matheus Felix",
  "phone": "31999999999",
  "zipCode": "32073000",
  "street": "Rua Exemplo",
  "number": "123",
  "complement": "Apto 101",
  "neighborhood": "Industrial São Luiz",
  "city": "Contagem",
  "state": "MG",
  "country": "Brazil",
  "isMain": true
}
```

#### Regras de validação

- `label`: opcional, máximo 50 caracteres
- `recipientName`: opcional, mínimo 2, máximo 100
- `phone`: opcional, mínimo 8, máximo 20
- `zipCode`: obrigatório, mínimo 8, máximo 20
- `street`: obrigatório, mínimo 2, máximo 150
- `number`: obrigatório, mínimo 1, máximo 20
- `complement`: opcional, máximo 100
- `neighborhood`: obrigatório, mínimo 2, máximo 100
- `city`: obrigatório, mínimo 2, máximo 100
- `state`: obrigatório, mínimo 2, máximo 50
- `country`: opcional, mínimo 2, máximo 80
- `isMain`: opcional, boolean

#### Response 201

```json
{
  "success": true,
  "data": {
    "address": {
      "id": "uuid",
      "userId": "uuid",
      "label": "Casa",
      "recipientName": "Matheus Felix",
      "phone": "31999999999",
      "zipCode": "32073000",
      "street": "Rua Exemplo",
      "number": "123",
      "complement": "Apto 101",
      "neighborhood": "Industrial São Luiz",
      "city": "Contagem",
      "state": "MG",
      "country": "Brazil",
      "isMain": true,
      "isActive": true,
      "createdAt": "2026-05-20T00:00:00.000Z",
      "updatedAt": "2026-05-20T00:00:00.000Z"
    }
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `VALIDATION_ERROR` | 400 | Body inválido |

#### Exemplo curl

```bash
curl -X POST "$BASE_URL/addresses" \
  -H "Authorization: Bearer $TOKEN_CUSTOMER" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Casa",
    "recipientName": "Matheus Felix",
    "phone": "31999999999",
    "zipCode": "32073000",
    "street": "Rua Exemplo",
    "number": "123",
    "complement": "Apto 101",
    "neighborhood": "Industrial São Luiz",
    "city": "Contagem",
    "state": "MG",
    "country": "Brazil",
    "isMain": true
  }'
```

---

### GET /api/addresses

Lista os endereços ativos do usuário autenticado.

- Autenticação: sim
- Role: `CUSTOMER` ou `ADMIN`

#### Response 200

```json
{
  "success": true,
  "data": {
    "addresses": [
      {
        "id": "uuid",
        "label": "Casa",
        "recipientName": "Matheus Felix",
        "phone": "31999999999",
        "zipCode": "32073000",
        "street": "Rua Exemplo",
        "number": "123",
        "complement": "Apto 101",
        "neighborhood": "Industrial São Luiz",
        "city": "Contagem",
        "state": "MG",
        "country": "Brazil",
        "isMain": true,
        "isActive": true,
        "createdAt": "2026-05-20T00:00:00.000Z",
        "updatedAt": "2026-05-20T00:00:00.000Z"
      }
    ]
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |

#### Exemplo curl

```bash
curl -X GET "$BASE_URL/addresses" \
  -H "Authorization: Bearer $TOKEN_CUSTOMER"
```

---

### PATCH /api/addresses/:id

Atualiza um endereço do usuário autenticado.

- Autenticação: sim
- Role: `CUSTOMER` ou `ADMIN`
- Restrição: o endereço precisa pertencer ao usuário autenticado

#### Body

Todos os campos são opcionais.

```json
{
  "label": "Trabalho",
  "recipientName": "Matheus Felix",
  "phone": "31999999999",
  "zipCode": "32073000",
  "street": "Rua Atualizada",
  "number": "456",
  "complement": null,
  "neighborhood": "Industrial São Luiz",
  "city": "Contagem",
  "state": "MG",
  "country": "Brazil"
}
```

#### Response 200

```json
{
  "success": true,
  "data": {
    "address": {
      "id": "uuid",
      "label": "Trabalho",
      "recipientName": "Matheus Felix",
      "phone": "31999999999",
      "zipCode": "32073000",
      "street": "Rua Atualizada",
      "number": "456",
      "complement": null,
      "neighborhood": "Industrial São Luiz",
      "city": "Contagem",
      "state": "MG",
      "country": "Brazil",
      "isMain": true,
      "isActive": true
    }
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `VALIDATION_ERROR` | 400 | Params/body inválido |
| `ADDRESS_NOT_FOUND` | 404 | Endereço não existe ou não pertence ao usuário |

#### Exemplo curl

```bash
curl -X PATCH "$BASE_URL/addresses/ADDRESS_ID" \
  -H "Authorization: Bearer $TOKEN_CUSTOMER" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Trabalho",
    "street": "Rua Atualizada",
    "number": "456",
    "complement": null
  }'
```

---

### DELETE /api/addresses/:id

Remove logicamente ou desativa um endereço do usuário autenticado, conforme implementação atual do serviço.

- Autenticação: sim
- Role: `CUSTOMER` ou `ADMIN`
- Restrição: o endereço precisa pertencer ao usuário autenticado

#### Response 204

Sem corpo de resposta.

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `VALIDATION_ERROR` | 400 | Param `id` inválido |
| `ADDRESS_NOT_FOUND` | 404 | Endereço não existe ou não pertence ao usuário |

#### Exemplo curl

```bash
curl -X DELETE "$BASE_URL/addresses/ADDRESS_ID" \
  -H "Authorization: Bearer $TOKEN_CUSTOMER"
```

---

### PATCH /api/addresses/:id/main

Define um endereço como principal para o usuário autenticado.

- Autenticação: sim
- Role: `CUSTOMER` ou `ADMIN`
- Restrição: o endereço precisa pertencer ao usuário autenticado

#### Response 200

```json
{
  "success": true,
  "data": {
    "address": {
      "id": "uuid",
      "label": "Casa",
      "recipientName": "Matheus Felix",
      "phone": "31999999999",
      "zipCode": "32073000",
      "street": "Rua Exemplo",
      "number": "123",
      "complement": "Apto 101",
      "neighborhood": "Industrial São Luiz",
      "city": "Contagem",
      "state": "MG",
      "country": "Brazil",
      "isMain": true,
      "isActive": true
    }
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `VALIDATION_ERROR` | 400 | Param `id` inválido |
| `ADDRESS_NOT_FOUND` | 404 | Endereço não existe ou não pertence ao usuário |

#### Exemplo curl

```bash
curl -X PATCH "$BASE_URL/addresses/ADDRESS_ID/main" \
  -H "Authorization: Bearer $TOKEN_CUSTOMER"
```

---

## 9. Categories

O módulo de categorias permite listar e detalhar categorias publicamente. Operações de escrita são restritas a usuários `ADMIN`.

Rotas confirmadas:

- `GET /api/categories`
- `GET /api/categories/:slug`
- `POST /api/categories`
- `PATCH /api/categories/:id`
- `PATCH /api/categories/:id/restore`
- `DELETE /api/categories/:id`

### GET /api/categories

Lista categorias ativas.

- Autenticação: não
- Role: pública

#### Response 200

```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "uuid",
        "name": "Eletrônicos",
        "slug": "eletronicos",
        "description": "Produtos eletrônicos",
        "isActive": true,
        "createdAt": "2026-05-20T00:00:00.000Z",
        "updatedAt": "2026-05-20T00:00:00.000Z"
      }
    ]
  }
}
```

#### Exemplo curl

```bash
curl -X GET "$BASE_URL/categories"
```

---

### GET /api/categories/:slug

Busca categoria ativa pelo `slug`.

- Autenticação: não
- Role: pública

#### Response 200

```json
{
  "success": true,
  "data": {
    "category": {
      "id": "uuid",
      "name": "Eletrônicos",
      "slug": "eletronicos",
      "description": "Produtos eletrônicos",
      "isActive": true,
      "createdAt": "2026-05-20T00:00:00.000Z",
      "updatedAt": "2026-05-20T00:00:00.000Z"
    }
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `VALIDATION_ERROR` | 400 | Param `slug` inválido |
| `CATEGORY_NOT_FOUND` | 404 | Categoria não encontrada ou inativa |

#### Exemplo curl

```bash
curl -X GET "$BASE_URL/categories/eletronicos"
```

---

### POST /api/categories

Cria uma categoria.

- Autenticação: sim
- Role: `ADMIN`

#### Body

```json
{
  "name": "Eletrônicos",
  "description": "Produtos eletrônicos"
}
```

#### Regras de validação

- `name`: obrigatório, mínimo 2, máximo 100 caracteres
- `description`: opcional, máximo 500 caracteres

#### Response 201

```json
{
  "success": true,
  "data": {
    "category": {
      "id": "uuid",
      "name": "Eletrônicos",
      "slug": "eletronicos",
      "description": "Produtos eletrônicos",
      "isActive": true,
      "createdAt": "2026-05-20T00:00:00.000Z",
      "updatedAt": "2026-05-20T00:00:00.000Z"
    }
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `FORBIDDEN_ACCESS` | 403 | Usuário não é `ADMIN` |
| `VALIDATION_ERROR` | 400 | Body inválido |
| `CATEGORY_ALREADY_EXISTS` | 409 | Já existe categoria com o slug gerado |

#### Exemplo curl

```bash
curl -X POST "$BASE_URL/categories" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Eletrônicos",
    "description": "Produtos eletrônicos"
  }'
```

---

### PATCH /api/categories/:id

Atualiza uma categoria.

- Autenticação: sim
- Role: `ADMIN`

#### Body

Todos os campos são opcionais.

```json
{
  "name": "Eletrônicos e Tecnologia",
  "description": "Produtos eletrônicos e acessórios"
}
```

#### Regras de validação

- `name`: opcional, mínimo 2, máximo 100 caracteres
- `description`: opcional, string ou `null`, máximo 500 caracteres

#### Response 200

```json
{
  "success": true,
  "data": {
    "category": {
      "id": "uuid",
      "name": "Eletrônicos e Tecnologia",
      "slug": "eletronicos-e-tecnologia",
      "description": "Produtos eletrônicos e acessórios",
      "isActive": true,
      "createdAt": "2026-05-20T00:00:00.000Z",
      "updatedAt": "2026-05-20T00:00:00.000Z"
    }
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `FORBIDDEN_ACCESS` | 403 | Usuário não é `ADMIN` |
| `VALIDATION_ERROR` | 400 | Param/body inválido |
| `CATEGORY_NOT_FOUND` | 404 | Categoria não encontrada |
| `CATEGORY_ALREADY_EXISTS` | 409 | Já existe outra categoria com o slug gerado |

#### Exemplo curl

```bash
curl -X PATCH "$BASE_URL/categories/CATEGORY_ID" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Eletrônicos e Tecnologia",
    "description": "Produtos eletrônicos e acessórios"
  }'
```

---

### DELETE /api/categories/:id

Desativa uma categoria via soft delete.

- Autenticação: sim
- Role: `ADMIN`

#### Response 204

Sem corpo de resposta.

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `FORBIDDEN_ACCESS` | 403 | Usuário não é `ADMIN` |
| `VALIDATION_ERROR` | 400 | Param `id` inválido |
| `CATEGORY_NOT_FOUND` | 404 | Categoria não encontrada |

#### Exemplo curl

```bash
curl -X DELETE "$BASE_URL/categories/CATEGORY_ID" \
  -H "Authorization: Bearer $TOKEN_ADMIN"
```

---

### PATCH /api/categories/:id/restore

Restaura uma categoria desativada.

- Autenticação: sim
- Role: `ADMIN`

#### Response 200

```json
{
  "success": true,
  "data": {
    "category": {
      "id": "uuid",
      "name": "Eletrônicos",
      "slug": "eletronicos",
      "description": "Produtos eletrônicos",
      "isActive": true,
      "createdAt": "2026-05-20T00:00:00.000Z",
      "updatedAt": "2026-05-20T00:00:00.000Z"
    }
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `FORBIDDEN_ACCESS` | 403 | Usuário não é `ADMIN` |
| `VALIDATION_ERROR` | 400 | Param `id` inválido |
| `CATEGORY_NOT_FOUND` | 404 | Categoria não encontrada |

#### Exemplo curl

```bash
curl -X PATCH "$BASE_URL/categories/CATEGORY_ID/restore" \
  -H "Authorization: Bearer $TOKEN_ADMIN"
```

---

## 10. Products

O módulo de produtos permite listagem pública com filtros, busca por slug e operações administrativas de criação, atualização, soft delete e restore.

Rotas confirmadas:

- `GET /api/products`
- `GET /api/products/:slug`
- `POST /api/products`
- `PATCH /api/products/:id`
- `PATCH /api/products/:id/restore`
- `DELETE /api/products/:id`

### Observações sobre valores monetários

Todos os valores monetários são representados em centavos.

Exemplo:

- `priceInCents: 12990` significa R$ 129,90
- `discountInCents: 1000` significa R$ 10,00

### GET /api/products

Lista produtos públicos com paginação, filtros e ordenação.

- Autenticação: não
- Role: pública

#### Query params

| Campo | Tipo | Default | Descrição |
|---|---|---:|---|
| `page` | number | `1` | Página atual |
| `perPage` | number | `10` | Itens por página, máximo 100 |
| `search` | string | - | Busca textual |
| `categoryId` | uuid | - | Filtra por categoria |
| `categorySlug` | string | - | Filtra por slug da categoria |
| `minPriceInCents` | number | - | Preço mínimo em centavos |
| `maxPriceInCents` | number | - | Preço máximo em centavos |
| `inStock` | `true` ou `false` | - | Filtra disponibilidade |
| `sortBy` | `recent`, `price`, `best_selling` | `recent` | Campo de ordenação |
| `sortOrder` | `asc` ou `desc` | `desc` | Direção da ordenação |

#### Response 200

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "categoryId": "uuid",
      "name": "Produto Exemplo",
      "slug": "produto-exemplo",
      "description": "Descrição do produto",
      "sku": "SKU-001",
      "priceInCents": 12990,
      "discountInCents": 1000,
      "stock": 10,
      "salesCount": 0,
      "status": "ACTIVE",
      "isActive": true,
      "category": {
        "id": "uuid",
        "name": "Eletrônicos",
        "slug": "eletronicos"
      },
      "images": [
        {
          "id": "uuid",
          "url": "https://example.com/image.jpg",
          "altText": "Imagem do produto",
          "position": 0,
          "isMain": true
        }
      ],
      "createdAt": "2026-05-20T00:00:00.000Z",
      "updatedAt": "2026-05-20T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "perPage": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `VALIDATION_ERROR` | 400 | Query params inválidos |

#### Exemplo curl

```bash
curl -X GET "$BASE_URL/products?page=1&perPage=10&sortBy=recent&sortOrder=desc"
```

Exemplo com filtros:

```bash
curl -X GET "$BASE_URL/products?search=fone&categorySlug=eletronicos&minPriceInCents=1000&maxPriceInCents=50000&inStock=true&sortBy=price&sortOrder=asc"
```

---

### GET /api/products/:slug

Busca produto público pelo `slug` e retorna produtos relacionados.

- Autenticação: não
- Role: pública

#### Response 200

```json
{
  "success": true,
  "data": {
    "product": {
      "id": "uuid",
      "categoryId": "uuid",
      "name": "Produto Exemplo",
      "slug": "produto-exemplo",
      "description": "Descrição do produto",
      "sku": "SKU-001",
      "priceInCents": 12990,
      "discountInCents": 1000,
      "stock": 10,
      "salesCount": 0,
      "status": "ACTIVE",
      "isActive": true,
      "category": {
        "id": "uuid",
        "name": "Eletrônicos",
        "slug": "eletronicos"
      },
      "images": []
    },
    "relatedProducts": []
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `VALIDATION_ERROR` | 400 | Param `slug` inválido |
| `PRODUCT_NOT_FOUND` | 404 | Produto não encontrado, inativo ou não público |

#### Exemplo curl

```bash
curl -X GET "$BASE_URL/products/produto-exemplo"
```

---

### POST /api/products

Cria um produto.

- Autenticação: sim
- Role: `ADMIN`

#### Body

```json
{
  "categoryId": "uuid",
  "name": "Produto Exemplo",
  "description": "Descrição do produto",
  "sku": "SKU-001",
  "priceInCents": 12990,
  "discountInCents": 1000,
  "stock": 10,
  "status": "ACTIVE",
  "images": [
    {
      "url": "https://example.com/image.jpg",
      "altText": "Imagem do produto",
      "position": 0,
      "isMain": true
    }
  ]
}
```

#### Regras de validação

- `categoryId`: UUID obrigatório
- `name`: obrigatório, mínimo 2, máximo 150 caracteres
- `description`: opcional, máximo 2000 caracteres
- `sku`: obrigatório, mínimo 2, máximo 80 caracteres
- `priceInCents`: inteiro positivo
- `discountInCents`: opcional, inteiro mínimo 0, default 0
- `stock`: opcional, inteiro mínimo 0, default 0
- `status`: opcional, `DRAFT`, `ACTIVE` ou `INACTIVE`, default `ACTIVE`
- `images`: opcional, array com no máximo 10 imagens
- `images[].url`: URL válida
- `images[].altText`: opcional, máximo 150 caracteres
- `images[].position`: opcional, inteiro mínimo 0
- `images[].isMain`: opcional, boolean

#### Observação sobre frete

O schema Prisma possui campos físicos de produto para frete:

- `weightInGrams`
- `widthCm`
- `heightCm`
- `lengthCm`

Porém, no DTO atual de criação/atualização de produto, esses campos ainda não são aceitos no payload administrativo. Portanto, não devem ser enviados neste endpoint até que a API exponha esses campos oficialmente.

#### Response 201

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "categoryId": "uuid",
    "name": "Produto Exemplo",
    "slug": "produto-exemplo",
    "description": "Descrição do produto",
    "sku": "SKU-001",
    "priceInCents": 12990,
    "discountInCents": 1000,
    "stock": 10,
    "salesCount": 0,
    "status": "ACTIVE",
    "isActive": true,
    "images": [
      {
        "id": "uuid",
        "url": "https://example.com/image.jpg",
        "altText": "Imagem do produto",
        "position": 0,
        "isMain": true
      }
    ],
    "createdAt": "2026-05-20T00:00:00.000Z",
    "updatedAt": "2026-05-20T00:00:00.000Z"
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `FORBIDDEN_ACCESS` | 403 | Usuário não é `ADMIN` |
| `VALIDATION_ERROR` | 400 | Body inválido |
| `CATEGORY_NOT_FOUND` | 404 | Categoria não encontrada ou inativa |
| `INVALID_PRODUCT_DISCOUNT` | 400 | Desconto maior ou igual ao preço |
| `PRODUCT_ALREADY_EXISTS` | 409 | Já existe produto com o slug gerado |
| `PRODUCT_SKU_ALREADY_EXISTS` | 409 | Já existe produto com o SKU informado |

#### Exemplo curl

```bash
curl -X POST "$BASE_URL/products" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": "CATEGORY_ID",
    "name": "Produto Exemplo",
    "description": "Descrição do produto",
    "sku": "SKU-001",
    "priceInCents": 12990,
    "discountInCents": 1000,
    "stock": 10,
    "status": "ACTIVE",
    "images": [
      {
        "url": "https://example.com/image.jpg",
        "altText": "Imagem do produto",
        "position": 0,
        "isMain": true
      }
    ]
  }'
```

---

### PATCH /api/products/:id

Atualiza um produto.

- Autenticação: sim
- Role: `ADMIN`

#### Body

Todos os campos são opcionais.

```json
{
  "categoryId": "uuid",
  "name": "Produto Atualizado",
  "description": "Descrição atualizada",
  "sku": "SKU-002",
  "priceInCents": 14990,
  "discountInCents": 500,
  "stock": 20,
  "status": "ACTIVE",
  "images": [
    {
      "url": "https://example.com/new-image.jpg",
      "altText": "Nova imagem do produto",
      "position": 0,
      "isMain": true
    }
  ]
}
```

#### Response 200

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "categoryId": "uuid",
    "name": "Produto Atualizado",
    "slug": "produto-atualizado",
    "description": "Descrição atualizada",
    "sku": "SKU-002",
    "priceInCents": 14990,
    "discountInCents": 500,
    "stock": 20,
    "status": "ACTIVE",
    "isActive": true,
    "images": []
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `FORBIDDEN_ACCESS` | 403 | Usuário não é `ADMIN` |
| `VALIDATION_ERROR` | 400 | Param/body inválido |
| `PRODUCT_NOT_FOUND` | 404 | Produto não encontrado |
| `CATEGORY_NOT_FOUND` | 404 | Categoria informada não encontrada ou inativa |
| `INVALID_PRODUCT_DISCOUNT` | 400 | Desconto maior ou igual ao preço |
| `PRODUCT_ALREADY_EXISTS` | 409 | Já existe outro produto com o slug gerado |
| `PRODUCT_SKU_ALREADY_EXISTS` | 409 | Já existe outro produto com o SKU informado |

#### Exemplo curl

```bash
curl -X PATCH "$BASE_URL/products/PRODUCT_ID" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Produto Atualizado",
    "priceInCents": 14990,
    "discountInCents": 500,
    "stock": 20,
    "status": "ACTIVE"
  }'
```

---

### DELETE /api/products/:id

Desativa um produto via soft delete.

- Autenticação: sim
- Role: `ADMIN`

#### Response 200

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Produto Exemplo",
    "slug": "produto-exemplo",
    "isActive": false
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `FORBIDDEN_ACCESS` | 403 | Usuário não é `ADMIN` |
| `VALIDATION_ERROR` | 400 | Param `id` inválido |
| `PRODUCT_NOT_FOUND` | 404 | Produto não encontrado |

#### Exemplo curl

```bash
curl -X DELETE "$BASE_URL/products/PRODUCT_ID" \
  -H "Authorization: Bearer $TOKEN_ADMIN"
```

---

### PATCH /api/products/:id/restore

Restaura um produto desativado.

- Autenticação: sim
- Role: `ADMIN`

#### Response 200

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Produto Exemplo",
    "slug": "produto-exemplo",
    "isActive": true
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `FORBIDDEN_ACCESS` | 403 | Usuário não é `ADMIN` |
| `VALIDATION_ERROR` | 400 | Param `id` inválido |
| `PRODUCT_NOT_FOUND` | 404 | Produto não encontrado |

#### Exemplo curl

```bash
curl -X PATCH "$BASE_URL/products/PRODUCT_ID/restore" \
  -H "Authorization: Bearer $TOKEN_ADMIN"
```
---

## 11. Cart

O módulo de carrinho permite ao usuário autenticado listar, adicionar, atualizar, remover e limpar itens do carrinho.

Todas as rotas exigem autenticação via Bearer Token.

Rotas confirmadas:

- `GET /api/cart`
- `POST /api/cart`
- `PATCH /api/cart/:id`
- `DELETE /api/cart/:id`
- `DELETE /api/cart`

### Observações de regra de negócio

- O carrinho pertence ao usuário autenticado.
- A API valida se o produto existe.
- A API valida se o produto está ativo, público e com categoria ativa.
- A API valida estoque antes de adicionar ou atualizar quantidade.
- Valores monetários são retornados em centavos.
- Após adicionar, atualizar, remover ou limpar, a API retorna o carrinho recalculado.

### Estrutura base do carrinho

```json
{
  "items": [
    {
      "id": "uuid",
      "productId": "uuid",
      "quantity": 2,
      "unitPriceInCents": 12990,
      "unitDiscountInCents": 1000,
      "subtotalInCents": 25980,
      "discountInCents": 2000,
      "totalInCents": 23980,
      "product": {
        "id": "uuid",
        "name": "Produto Exemplo",
        "slug": "produto-exemplo",
        "sku": "SKU-001",
        "priceInCents": 12990,
        "discountInCents": 1000,
        "stock": 10,
        "status": "ACTIVE",
        "isActive": true
      }
    }
  ],
  "summary": {
    "itemsCount": 1,
    "totalQuantity": 2,
    "subtotalInCents": 25980,
    "discountInCents": 2000,
    "totalInCents": 23980
  }
}
```

---

### GET /api/cart

Lista o carrinho do usuário autenticado.

- Autenticação: sim
- Role: `CUSTOMER` ou `ADMIN`

#### Response 200

```json
{
  "success": true,
  "data": {
    "items": [],
    "summary": {
      "itemsCount": 0,
      "totalQuantity": 0,
      "subtotalInCents": 0,
      "discountInCents": 0,
      "totalInCents": 0
    }
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |

#### Exemplo curl

```bash
curl -X GET "$BASE_URL/cart" \
  -H "Authorization: Bearer $TOKEN_CUSTOMER"
```

---

### POST /api/cart

Adiciona um produto ao carrinho.

Se o produto já estiver no carrinho, a quantidade enviada é somada à quantidade existente.

- Autenticação: sim
- Role: `CUSTOMER` ou `ADMIN`

#### Body

```json
{
  "productId": "uuid",
  "quantity": 2
}
```

#### Regras de validação

- `productId`: UUID obrigatório
- `quantity`: inteiro positivo

#### Response 201

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "quantity": 2,
        "unitPriceInCents": 12990,
        "unitDiscountInCents": 1000,
        "subtotalInCents": 25980,
        "discountInCents": 2000,
        "totalInCents": 23980,
        "product": {
          "id": "uuid",
          "name": "Produto Exemplo",
          "slug": "produto-exemplo",
          "sku": "SKU-001",
          "priceInCents": 12990,
          "discountInCents": 1000,
          "stock": 10,
          "status": "ACTIVE",
          "isActive": true
        }
      }
    ],
    "summary": {
      "itemsCount": 1,
      "totalQuantity": 2,
      "subtotalInCents": 25980,
      "discountInCents": 2000,
      "totalInCents": 23980
    }
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `VALIDATION_ERROR` | 400 | Body inválido |
| `INVALID_CART_QUANTITY` | 400 | Quantidade menor ou igual a zero |
| `PRODUCT_NOT_FOUND` | 404 | Produto não encontrado |
| `PRODUCT_UNAVAILABLE` | 400 | Produto inativo, indisponível ou categoria inativa |
| `INSUFFICIENT_STOCK` | 400 | Quantidade solicitada maior que o estoque |

#### Exemplo curl

```bash
curl -X POST "$BASE_URL/cart" \
  -H "Authorization: Bearer $TOKEN_CUSTOMER" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PRODUCT_ID",
    "quantity": 2
  }'
```

---

### PATCH /api/cart/:id

Atualiza a quantidade de um item do carrinho.

- Autenticação: sim
- Role: `CUSTOMER` ou `ADMIN`
- Restrição: o item precisa pertencer ao usuário autenticado

#### Body

```json
{
  "quantity": 3
}
```

#### Regras de validação

- `id`: UUID no path
- `quantity`: inteiro positivo

#### Response 200

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "quantity": 3,
        "unitPriceInCents": 12990,
        "unitDiscountInCents": 1000,
        "subtotalInCents": 38970,
        "discountInCents": 3000,
        "totalInCents": 35970,
        "product": {
          "id": "uuid",
          "name": "Produto Exemplo",
          "stock": 10,
          "status": "ACTIVE",
          "isActive": true
        }
      }
    ],
    "summary": {
      "itemsCount": 1,
      "totalQuantity": 3,
      "subtotalInCents": 38970,
      "discountInCents": 3000,
      "totalInCents": 35970
    }
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `VALIDATION_ERROR` | 400 | Param/body inválido |
| `INVALID_CART_QUANTITY` | 400 | Quantidade menor ou igual a zero |
| `CART_ITEM_NOT_FOUND` | 404 | Item não encontrado ou não pertence ao usuário |
| `PRODUCT_UNAVAILABLE` | 400 | Produto inativo, indisponível ou categoria inativa |
| `INSUFFICIENT_STOCK` | 400 | Quantidade solicitada maior que o estoque |

#### Exemplo curl

```bash
curl -X PATCH "$BASE_URL/cart/CART_ITEM_ID" \
  -H "Authorization: Bearer $TOKEN_CUSTOMER" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 3
  }'
```

---

### DELETE /api/cart/:id

Remove um item específico do carrinho.

- Autenticação: sim
- Role: `CUSTOMER` ou `ADMIN`
- Restrição: o item precisa pertencer ao usuário autenticado

#### Response 200

```json
{
  "success": true,
  "data": {
    "items": [],
    "summary": {
      "itemsCount": 0,
      "totalQuantity": 0,
      "subtotalInCents": 0,
      "discountInCents": 0,
      "totalInCents": 0
    }
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `VALIDATION_ERROR` | 400 | Param `id` inválido |
| `CART_ITEM_NOT_FOUND` | 404 | Item não encontrado ou não pertence ao usuário |

#### Exemplo curl

```bash
curl -X DELETE "$BASE_URL/cart/CART_ITEM_ID" \
  -H "Authorization: Bearer $TOKEN_CUSTOMER"
```

---

### DELETE /api/cart

Limpa todos os itens do carrinho do usuário autenticado.

- Autenticação: sim
- Role: `CUSTOMER` ou `ADMIN`

#### Response 200

```json
{
  "success": true,
  "data": {
    "items": [],
    "summary": {
      "itemsCount": 0,
      "totalQuantity": 0,
      "subtotalInCents": 0,
      "discountInCents": 0,
      "totalInCents": 0
    }
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |

#### Exemplo curl

```bash
curl -X DELETE "$BASE_URL/cart" \
  -H "Authorization: Bearer $TOKEN_CUSTOMER"
```

---

## 12. Checkout

O módulo de checkout calcula frete e revisa a compra antes da criação do pedido.

Todas as rotas exigem autenticação via Bearer Token.

Rotas confirmadas:

- `POST /api/checkout/shipping`
- `POST /api/checkout/review`

### Observações de regra de negócio

- O endereço precisa existir, estar ativo e pertencer ao usuário autenticado.
- O carrinho não pode estar vazio.
- Todos os produtos do carrinho precisam estar ativos e disponíveis.
- A quantidade dos itens não pode exceder o estoque atual.
- O frete é calculado pelo provider Melhor Envio.
- Se o provider de frete estiver desabilitado ou mal configurado, o cálculo pode falhar com erro de provider.
- `couponCode` existe no contrato de checkout, mas cupom ainda não está implementado. Enviar cupom gera erro `COUPON_NOT_IMPLEMENTED`.

---

### POST /api/checkout/shipping

Calcula opções de frete para o carrinho atual usando o endereço informado.

- Autenticação: sim
- Role: `CUSTOMER` ou `ADMIN`

#### Body

```json
{
  "addressId": "uuid"
}
```

#### Regras de validação

- `addressId`: UUID obrigatório

#### Response 200

```json
{
  "success": true,
  "data": {
    "addressId": "uuid",
    "options": [
      {
        "provider": "MELHOR_ENVIO",
        "serviceCode": "1",
        "serviceName": "PAC",
        "priceInCents": 2500,
        "deadlineDays": 7
      }
    ]
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `VALIDATION_ERROR` | 400 | Body inválido |
| `ADDRESS_NOT_FOUND` | 404 | Endereço não encontrado ou não pertence ao usuário |
| `CART_EMPTY` | 400 | Carrinho vazio |
| `PRODUCT_UNAVAILABLE` | 400 | Produto inativo, indisponível ou categoria inativa |
| `INSUFFICIENT_STOCK` | 400 | Quantidade no carrinho maior que estoque |
| `SHIPPING_PROVIDER_DISABLED` | 500 | Provider de frete desabilitado |
| `SHIPPING_PROVIDER_NOT_CONFIGURED` | 500 | Provider de frete sem configuração necessária |
| `SHIPPING_PROVIDER_TIMEOUT` | 504 | Timeout ao consultar provider |
| `SHIPPING_PROVIDER_REQUEST_FAILED` | 502 | Falha na consulta ao provider |
| `INVALID_SHIPPING_PROVIDER_RESPONSE` | 502 | Resposta inválida do provider |

#### Exemplo curl

```bash
curl -X POST "$BASE_URL/checkout/shipping" \
  -H "Authorization: Bearer $TOKEN_CUSTOMER" \
  -H "Content-Type: application/json" \
  -d '{
    "addressId": "ADDRESS_ID"
  }'
```

---

### POST /api/checkout/review

Revisa a compra antes de criar o pedido.

- Autenticação: sim
- Role: `CUSTOMER` ou `ADMIN`

#### Body

```json
{
  "addressId": "uuid",
  "shippingServiceCode": "1",
  "paymentMethod": "PIX",
  "couponCode": null
}
```

#### Regras de validação

- `addressId`: UUID obrigatório
- `shippingServiceCode`: string obrigatória
- `paymentMethod`: `CREDIT_CARD`, `PIX` ou `BOLETO`
- `couponCode`: opcional, string ou `null`

#### Response 200

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "productName": "Produto Exemplo",
        "productSlug": "produto-exemplo",
        "productSku": "SKU-001",
        "productImageUrl": "https://example.com/image.jpg",
        "quantity": 2,
        "unitPriceInCents": 12990,
        "unitDiscountInCents": 1000,
        "subtotalInCents": 25980,
        "discountInCents": 2000,
        "totalInCents": 23980
      }
    ],
    "address": {
      "id": "uuid",
      "zipCode": "32073000",
      "street": "Rua Exemplo",
      "number": "123",
      "complement": "Apto 101",
      "neighborhood": "Industrial São Luiz",
      "city": "Contagem",
      "state": "MG",
      "country": "Brazil",
      "recipientName": "Matheus Felix",
      "recipientPhone": "31999999999"
    },
    "shipping": {
      "provider": "MELHOR_ENVIO",
      "serviceCode": "1",
      "serviceName": "PAC",
      "priceInCents": 2500,
      "deadlineDays": 7
    },
    "payment": {
      "method": "PIX"
    },
    "coupon": null,
    "summary": {
      "itemsCount": 1,
      "totalQuantity": 2,
      "subtotalInCents": 25980,
      "discountInCents": 2000,
      "shippingInCents": 2500,
      "couponDiscountInCents": 0,
      "totalInCents": 26480
    }
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `VALIDATION_ERROR` | 400 | Body inválido |
| `COUPON_NOT_IMPLEMENTED` | 400 | `couponCode` enviado |
| `ADDRESS_NOT_FOUND` | 404 | Endereço não encontrado ou não pertence ao usuário |
| `CART_EMPTY` | 400 | Carrinho vazio |
| `PRODUCT_UNAVAILABLE` | 400 | Produto inativo, indisponível ou categoria inativa |
| `INSUFFICIENT_STOCK` | 400 | Quantidade no carrinho maior que estoque |
| `SHIPPING_OPTION_NOT_FOUND` | 400 | Código de serviço de frete não encontrado nas opções calculadas |
| `SHIPPING_PROVIDER_DISABLED` | 500 | Provider de frete desabilitado |
| `SHIPPING_PROVIDER_NOT_CONFIGURED` | 500 | Provider de frete sem configuração necessária |
| `SHIPPING_PROVIDER_TIMEOUT` | 504 | Timeout ao consultar provider |
| `SHIPPING_PROVIDER_REQUEST_FAILED` | 502 | Falha na consulta ao provider |
| `INVALID_SHIPPING_PROVIDER_RESPONSE` | 502 | Resposta inválida do provider |

#### Exemplo curl

```bash
curl -X POST "$BASE_URL/checkout/review" \
  -H "Authorization: Bearer $TOKEN_CUSTOMER" \
  -H "Content-Type: application/json" \
  -d '{
    "addressId": "ADDRESS_ID",
    "shippingServiceCode": "1",
    "paymentMethod": "PIX",
    "couponCode": null
  }'
```

#### Exemplo com cupom ainda não implementado

```bash
curl -X POST "$BASE_URL/checkout/review" \
  -H "Authorization: Bearer $TOKEN_CUSTOMER" \
  -H "Content-Type: application/json" \
  -d '{
    "addressId": "ADDRESS_ID",
    "shippingServiceCode": "1",
    "paymentMethod": "PIX",
    "couponCode": "PROMO10"
  }'
```

Resposta esperada:

```json
{
  "success": false,
  "error": {
    "code": "COUPON_NOT_IMPLEMENTED",
    "message": "Coupon is not implemented yet."
  }
}
```


---

## 15. Admin

O módulo administrativo concentra operações restritas a usuários com role `ADMIN`.

Todas as rotas deste módulo exigem:

```http
Authorization: Bearer <TOKEN_ADMIN>
```

Rotas confirmadas:

- `PATCH /api/admin/orders/:id/cancel`
- `GET /api/admin/reports/sales`
- `GET /api/admin/reports/top-products`
- `GET /api/admin/reports/low-stock`
- `GET /api/admin/users`
- `GET /api/admin/users/:id`
- `PATCH /api/admin/users/:id/status`
- `PATCH /api/admin/users/:id/role`
- `POST /api/admin/products/:id/stock-adjustments`
- `GET /api/admin/products/:id/stock-movements`

### Regras gerais

- Todas as rotas usam autenticação.
- Todas as rotas exigem role `ADMIN`.
- Usuário `ADMIN` não pode bloquear a própria conta.
- Usuário `ADMIN` não pode remover a própria role admin.
- Operações de estoque registram movimentação.
- Cancelamento administrativo só cancela pedidos `PENDING`, sem fluxo de reembolso.

---

### PATCH /api/admin/orders/:id/cancel

Cancela um pedido pendente por ação administrativa.

- Autenticação: sim
- Role: `ADMIN`
- Regra: apenas pedidos `PENDING` podem ser cancelados por esta rota

#### Response 200

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "status": "CANCELED",
    "paymentStatus": "CANCELED",
    "addressId": "uuid",
    "items": [],
    "summary": {
      "itemsCount": 1,
      "totalQuantity": 2,
      "subtotalInCents": 25980,
      "discountInCents": 2000,
      "totalInCents": 26480
    },
    "canceledAt": "2026-05-20T00:00:00.000Z",
    "createdAt": "2026-05-20T00:00:00.000Z",
    "updatedAt": "2026-05-20T00:00:00.000Z"
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `FORBIDDEN_ACCESS` | 403 | Usuário não é `ADMIN` |
| `VALIDATION_ERROR` | 400 | Param `id` inválido |
| `ORDER_NOT_FOUND` | 404 | Pedido não encontrado |
| `ORDER_ALREADY_CANCELED` | 409 | Pedido já está cancelado |
| `ADMIN_ORDER_CANNOT_BE_CANCELED` | 400 | Pedido não está `PENDING` |

#### Exemplo curl

```bash
curl -X PATCH "$BASE_URL/admin/orders/ORDER_ID/cancel" \
  -H "Authorization: Bearer $TOKEN_ADMIN"
```

---

### GET /api/admin/reports/sales

Retorna relatório de vendas por período.

- Autenticação: sim
- Role: `ADMIN`

#### Query params

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---:|---|
| `startDate` | `YYYY-MM-DD` | sim | Data inicial |
| `endDate` | `YYYY-MM-DD` | sim | Data final |

A data inicial precisa ser menor ou igual à data final.

#### Response 200

```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2026-05-01",
      "endDate": "2026-05-31"
    },
    "totalOrders": 10,
    "totalRevenueInCents": 150000,
    "totalItemsSold": 25,
    "averageTicketInCents": 15000
  }
}
```

#### Observação

Os campos agregados retornados dependem do relatório calculado pelo repositório administrativo. A estrutura confirmada no service sempre inclui `period`.

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `FORBIDDEN_ACCESS` | 403 | Usuário não é `ADMIN` |
| `VALIDATION_ERROR` | 400 | Query params inválidos |

#### Exemplo curl

```bash
curl -X GET "$BASE_URL/admin/reports/sales?startDate=2026-05-01&endDate=2026-05-31" \
  -H "Authorization: Bearer $TOKEN_ADMIN"
```

---

### GET /api/admin/reports/top-products

Retorna relatório de produtos mais vendidos por período.

- Autenticação: sim
- Role: `ADMIN`

#### Query params

| Campo | Tipo | Default | Descrição |
|---|---|---:|---|
| `startDate` | `YYYY-MM-DD` | obrigatório | Data inicial |
| `endDate` | `YYYY-MM-DD` | obrigatório | Data final |
| `limit` | number | `10` | Limite de produtos, máximo 50 |

#### Response 200

```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2026-05-01",
      "endDate": "2026-05-31"
    },
    "limit": 10,
    "products": [
      {
        "productId": "uuid",
        "productName": "Produto Exemplo",
        "productSku": "SKU-001",
        "quantitySold": 20,
        "revenueInCents": 200000
      }
    ]
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `FORBIDDEN_ACCESS` | 403 | Usuário não é `ADMIN` |
| `VALIDATION_ERROR` | 400 | Query params inválidos |

#### Exemplo curl

```bash
curl -X GET "$BASE_URL/admin/reports/top-products?startDate=2026-05-01&endDate=2026-05-31&limit=10" \
  -H "Authorization: Bearer $TOKEN_ADMIN"
```

---

### GET /api/admin/reports/low-stock

Lista produtos com estoque menor ou igual ao limite informado.

- Autenticação: sim
- Role: `ADMIN`

#### Query params

| Campo | Tipo | Default | Descrição |
|---|---|---:|---|
| `threshold` | number | `5` | Limite de estoque |
| `page` | number | `1` | Página atual |
| `perPage` | number | `10` | Itens por página, máximo 100 |

#### Response 200

```json
{
  "success": true,
  "data": {
    "threshold": 5,
    "products": [
      {
        "id": "uuid",
        "name": "Produto Exemplo",
        "sku": "SKU-001",
        "stock": 3,
        "status": "ACTIVE",
        "isActive": true
      }
    ]
  },
  "meta": {
    "page": 1,
    "perPage": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `FORBIDDEN_ACCESS` | 403 | Usuário não é `ADMIN` |
| `VALIDATION_ERROR` | 400 | Query params inválidos |

#### Exemplo curl

```bash
curl -X GET "$BASE_URL/admin/reports/low-stock?threshold=5&page=1&perPage=10" \
  -H "Authorization: Bearer $TOKEN_ADMIN"
```

---

### GET /api/admin/users

Lista usuários com filtros administrativos.

- Autenticação: sim
- Role: `ADMIN`

#### Query params

| Campo | Tipo | Default | Descrição |
|---|---|---:|---|
| `page` | number | `1` | Página atual |
| `perPage` | number | `10` | Itens por página |
| `search` | string | - | Busca textual |
| `role` | `CUSTOMER` ou `ADMIN` | - | Filtra por role |
| `isActive` | `true` ou `false` | - | Filtra por status ativo/inativo |

#### Response 200

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Matheus Felix",
      "email": "matheus@example.com",
      "phone": null,
      "role": "CUSTOMER",
      "isActive": true,
      "createdAt": "2026-05-20T00:00:00.000Z",
      "updatedAt": "2026-05-20T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "perPage": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `FORBIDDEN_ACCESS` | 403 | Usuário não é `ADMIN` |
| `VALIDATION_ERROR` | 400 | Query params inválidos |

#### Exemplo curl

```bash
curl -X GET "$BASE_URL/admin/users?page=1&perPage=10&role=CUSTOMER&isActive=true" \
  -H "Authorization: Bearer $TOKEN_ADMIN"
```

---

### GET /api/admin/users/:id

Detalha um usuário por ID.

- Autenticação: sim
- Role: `ADMIN`

#### Response 200

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Matheus Felix",
    "email": "matheus@example.com",
    "phone": null,
    "role": "CUSTOMER",
    "isActive": true,
    "createdAt": "2026-05-20T00:00:00.000Z",
    "updatedAt": "2026-05-20T00:00:00.000Z"
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `FORBIDDEN_ACCESS` | 403 | Usuário não é `ADMIN` |
| `VALIDATION_ERROR` | 400 | Param `id` inválido |
| `USER_NOT_FOUND` | 404 | Usuário não encontrado |

#### Exemplo curl

```bash
curl -X GET "$BASE_URL/admin/users/USER_ID" \
  -H "Authorization: Bearer $TOKEN_ADMIN"
```

---

### PATCH /api/admin/users/:id/status

Ativa ou bloqueia um usuário.

- Autenticação: sim
- Role: `ADMIN`

#### Body

```json
{
  "isActive": false
}
```

#### Regras de negócio

- `isActive` é obrigatório e boolean.
- Admin não pode bloquear a própria conta.
- Se o usuário já estiver no status informado, a API retorna conflito.

#### Response 200

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Usuário Cliente",
    "email": "cliente@example.com",
    "phone": null,
    "role": "CUSTOMER",
    "isActive": false,
    "createdAt": "2026-05-20T00:00:00.000Z",
    "updatedAt": "2026-05-20T00:00:00.000Z"
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `FORBIDDEN_ACCESS` | 403 | Usuário não é `ADMIN` |
| `VALIDATION_ERROR` | 400 | Param/body inválido |
| `USER_NOT_FOUND` | 404 | Usuário não encontrado |
| `USER_CANNOT_BLOCK_SELF` | 400 | Admin tentou bloquear a própria conta |
| `USER_ALREADY_ACTIVE` | 409 | Usuário já está ativo |
| `USER_ALREADY_BLOCKED` | 409 | Usuário já está bloqueado |

#### Exemplo curl

```bash
curl -X PATCH "$BASE_URL/admin/users/USER_ID/status" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false
  }'
```

---

### PATCH /api/admin/users/:id/role

Altera a role de um usuário.

- Autenticação: sim
- Role: `ADMIN`

#### Body

```json
{
  "role": "ADMIN"
}
```

#### Regras de validação

- `role`: `CUSTOMER` ou `ADMIN`

#### Regras de negócio

- Admin não pode remover a própria role `ADMIN`.
- Se o usuário já possuir a role informada, a API retorna conflito.

#### Response 200

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Usuário Cliente",
    "email": "cliente@example.com",
    "phone": null,
    "role": "ADMIN",
    "isActive": true,
    "createdAt": "2026-05-20T00:00:00.000Z",
    "updatedAt": "2026-05-20T00:00:00.000Z"
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `FORBIDDEN_ACCESS` | 403 | Usuário não é `ADMIN` |
| `VALIDATION_ERROR` | 400 | Param/body inválido |
| `USER_NOT_FOUND` | 404 | Usuário não encontrado |
| `USER_CANNOT_CHANGE_OWN_ROLE` | 400 | Admin tentou remover a própria role admin |
| `USER_ALREADY_HAS_ROLE` | 409 | Usuário já possui a role informada |

#### Exemplo curl

```bash
curl -X PATCH "$BASE_URL/admin/users/USER_ID/role" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "ADMIN"
  }'
```

---

### POST /api/admin/products/:id/stock-adjustments

Cria um ajuste manual de estoque para um produto.

- Autenticação: sim
- Role: `ADMIN`

#### Body

```json
{
  "quantityChange": 10,
  "reason": "Entrada manual de estoque"
}
```

#### Regras de validação

- `id`: UUID do produto no path
- `quantityChange`: inteiro diferente de zero
- `reason`: mínimo 3, máximo 255 caracteres

#### Regras de negócio

- `quantityChange` positivo aumenta o estoque.
- `quantityChange` negativo reduz o estoque.
- O ajuste não pode resultar em estoque negativo.
- A operação registra movimento de estoque com tipo `MANUAL_ADJUSTMENT`.

#### Response 201

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "productId": "uuid",
    "adminUserId": "uuid",
    "type": "MANUAL_ADJUSTMENT",
    "quantityChange": 10,
    "stockBefore": 5,
    "stockAfter": 15,
    "reason": "Entrada manual de estoque",
    "createdAt": "2026-05-20T00:00:00.000Z"
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `FORBIDDEN_ACCESS` | 403 | Usuário não é `ADMIN` |
| `VALIDATION_ERROR` | 400 | Param/body inválido |
| `PRODUCT_NOT_FOUND` | 404 | Produto não encontrado |
| `INVALID_STOCK_ADJUSTMENT` | 400 | Ajuste resultaria em estoque negativo |

#### Exemplo curl

```bash
curl -X POST "$BASE_URL/admin/products/PRODUCT_ID/stock-adjustments" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantityChange": 10,
    "reason": "Entrada manual de estoque"
  }'
```

Exemplo de redução:

```bash
curl -X POST "$BASE_URL/admin/products/PRODUCT_ID/stock-adjustments" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantityChange": -2,
    "reason": "Correção de inventário"
  }'
```

---

### GET /api/admin/products/:id/stock-movements

Lista movimentações de estoque de um produto.

- Autenticação: sim
- Role: `ADMIN`

#### Query params

| Campo | Tipo | Default | Descrição |
|---|---|---:|---|
| `page` | number | `1` | Página atual |
| `perPage` | number | `10` | Itens por página, máximo 100 |

#### Tipos de movimentação de estoque

Tipos existentes no schema:

- `MANUAL_ADJUSTMENT`
- `ORDER_RESERVED`
- `ORDER_CANCELED`
- `ORDER_SHIPPED`
- `RETURN`

#### Response 200

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "productId": "uuid",
      "adminUserId": "uuid",
      "type": "MANUAL_ADJUSTMENT",
      "quantityChange": 10,
      "stockBefore": 5,
      "stockAfter": 15,
      "reason": "Entrada manual de estoque",
      "createdAt": "2026-05-20T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "perPage": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

#### Possíveis erros

| Código | HTTP | Quando acontece |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Token ausente ou inválido |
| `FORBIDDEN_ACCESS` | 403 | Usuário não é `ADMIN` |
| `VALIDATION_ERROR` | 400 | Param/query inválido |
| `PRODUCT_NOT_FOUND` | 404 | Produto não encontrado |

#### Exemplo curl

```bash
curl -X GET "$BASE_URL/admin/products/PRODUCT_ID/stock-movements?page=1&perPage=10" \
  -H "Authorization: Bearer $TOKEN_ADMIN"
```

---

## 16. Fluxos principais da API

### 16.1 Fluxo de autenticação

1. Cliente cria conta em `POST /api/auth/register`.
2. Cliente autentica em `POST /api/auth/login`.
3. API retorna:
   - `accessToken`
   - `refreshToken`
4. Cliente envia o access token nas rotas protegidas:

```http
Authorization: Bearer <TOKEN>
```

5. Quando o access token expirar, o cliente usa `POST /api/auth/refresh`.
6. Para encerrar sessão, o cliente chama `POST /api/auth/logout` com o refresh token.

---

### 16.2 Fluxo de compra

1. Cliente lista produtos em `GET /api/products`.
2. Cliente detalha produto em `GET /api/products/:slug`.
3. Cliente adiciona produto ao carrinho em `POST /api/cart`.
4. Cliente consulta o carrinho em `GET /api/cart`.
5. Cliente cadastra ou escolhe endereço em `/api/addresses`.
6. Cliente calcula frete em `POST /api/checkout/shipping`.
7. Cliente revisa a compra em `POST /api/checkout/review`.
8. Cliente cria pedido em `POST /api/orders`.
9. Cliente processa pagamento em `POST /api/payments/orders/:orderId/process`.
10. Mercado Pago envia atualização para `POST /api/payments/webhooks/mercado-pago`.
11. Quando o pagamento for aprovado, o pedido passa para:
    - `paymentStatus: PAID`
    - `status: PAID`
12. Admin avança o status logístico:
    - `PROCESSING`
    - `SEPARATED`
    - `SHIPPED`
    - `DELIVERED`

---

### 16.3 Fluxo administrativo de expedição

1. Admin consulta pedidos.
2. Admin atualiza pedido pago para `PROCESSING`.
3. Admin atualiza para `SEPARATED`.
4. Admin atualiza para `SHIPPED` informando `trackingCode`.
5. Admin atualiza para `DELIVERED`.

Exemplo:

```bash
curl -X PATCH "$BASE_URL/orders/ORDER_ID/status" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "SHIPPED",
    "trackingCode": "BR123456789BR",
    "trackingUrl": "https://rastreamento.example.com/BR123456789BR"
  }'
```

---

### 16.4 Fluxo de estoque

O estoque pode ser alterado por:

- criação de pedido;
- cancelamento de pedido pendente;
- ajuste manual administrativo;
- futuras operações de devolução/envio.

Tipos existentes de movimentação:

- `MANUAL_ADJUSTMENT`
- `ORDER_RESERVED`
- `ORDER_CANCELED`
- `ORDER_SHIPPED`
- `RETURN`

---

## 17. Variáveis de ambiente relevantes

### Core da aplicação

| Variável | Descrição |
|---|---|
| `NODE_ENV` | Ambiente da aplicação: `development`, `test` ou `production` |
| `PORT` | Porta HTTP da API |
| `DATABASE_URL` | URL de conexão PostgreSQL |
| `JWT_SECRET` | Secret usado para assinatura JWT |
| `JWT_EXPIRES_IN` | Tempo de expiração do access token |
| `CORS_ORIGINS` | Lista de origens permitidas separadas por vírgula |

### Melhor Envio

| Variável | Descrição |
|---|---|
| `MELHOR_ENVIO_ENABLED` | Habilita/desabilita integração |
| `MELHOR_ENVIO_BASE_URL` | URL base da API Melhor Envio |
| `MELHOR_ENVIO_ACCESS_TOKEN` | Token real da integração |
| `MELHOR_ENVIO_USER_AGENT` | User-Agent exigido pelo provider |
| `MELHOR_ENVIO_ORIGIN_ZIP_CODE` | CEP de origem usado no cálculo de frete |

### Mercado Pago

| Variável | Descrição |
|---|---|
| `MERCADO_PAGO_ENABLED` | Habilita/desabilita integração |
| `MERCADO_PAGO_BASE_URL` | URL base da API Mercado Pago |
| `MERCADO_PAGO_ACCESS_TOKEN` | Access token real do Mercado Pago |
| `MERCADO_PAGO_PUBLIC_KEY` | Public key da conta |
| `MERCADO_PAGO_WEBHOOK_SECRET` | Secret usado para validar webhooks |
| `MERCADO_PAGO_SUCCESS_URL` | URL de sucesso após pagamento |
| `MERCADO_PAGO_FAILURE_URL` | URL de falha após pagamento |
| `MERCADO_PAGO_PENDING_URL` | URL de pagamento pendente |
| `MERCADO_PAGO_NOTIFICATION_URL` | URL pública do webhook da API |

### Observações de produção

- Nunca versionar valores reais de secrets.
- Usar secrets do provedor cloud ou variáveis protegidas.
- `JWT_SECRET` deve ter no mínimo 32 caracteres fortes.
- `CORS_ORIGINS` em produção deve conter apenas domínios autorizados.
- `MERCADO_PAGO_NOTIFICATION_URL` deve apontar para:

```text
https://seu-dominio.com/api/payments/webhooks/mercado-pago
```

---

## 18. Segurança e produção

### Autenticação

- Rotas privadas exigem Bearer Token JWT.
- Rotas administrativas exigem role `ADMIN`.
- Refresh tokens são tokens opacos.
- O refresh token deve ser guardado com cuidado no cliente.

### Autorização

Papéis disponíveis:

- `CUSTOMER`
- `ADMIN`

Rotas públicas:

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/categories`
- `GET /api/categories/:slug`
- `GET /api/products`
- `GET /api/products/:slug`
- `POST /api/payments/webhooks/mercado-pago`

Rotas administrativas:

- `/api/admin/*`
- `POST /api/categories`
- `PATCH /api/categories/:id`
- `PATCH /api/categories/:id/restore`
- `DELETE /api/categories/:id`
- `POST /api/products`
- `PATCH /api/products/:id`
- `PATCH /api/products/:id/restore`
- `DELETE /api/products/:id`
- `PATCH /api/orders/:id/status`

### CORS

Em produção, configurar `CORS_ORIGINS` apenas com domínios oficiais do frontend, painel administrativo e domínios confiáveis.

Exemplo:

```env
CORS_ORIGINS=https://seudominio.com,https://www.seudominio.com,https://admin.seudominio.com
```

### Rate limit

A aplicação possui rate limit global e limites específicos em rotas sensíveis.

Rotas sensíveis incluem:

- login;
- registro;
- refresh;
- logout;
- recuperação de senha;
- processamento de pagamento;
- webhook Mercado Pago.

### Webhooks

O endpoint de webhook do Mercado Pago é público, mas protegido por validação de assinatura.

Headers relevantes:

```http
x-signature: ts=...,v1=...
x-request-id: request_id
```

### Docker

A aplicação possui Dockerfile de produção com:

- build multi-stage;
- `npm ci`;
- build TypeScript;
- Prisma generate;
- execução como usuário `node`;
- `HEALTHCHECK` usando `/api/health`;
- exposição da porta `3000`.

---

## 19. Padrão de paginação

Endpoints paginados usam o formato:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "perPage": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

Endpoints com paginação confirmados:

- `GET /api/products`
- `GET /api/orders`
- `GET /api/admin/users`
- `GET /api/admin/reports/low-stock`
- `GET /api/admin/products/:id/stock-movements`

---

## 20. Padrão de erros

### Erro de regra de negócio

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message."
  }
}
```

### Erro de validação

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data.",
    "issues": []
  }
}
```

### Erro inesperado

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Internal server error."
  }
}
```

### Códigos recorrentes

| Código | Significado |
|---|---|
| `VALIDATION_ERROR` | Dados de entrada inválidos |
| `AUTHENTICATION_REQUIRED` | Token ausente ou inválido |
| `FORBIDDEN_ACCESS` | Usuário sem permissão |
| `USER_NOT_FOUND` | Usuário não encontrado |
| `PRODUCT_NOT_FOUND` | Produto não encontrado |
| `CATEGORY_NOT_FOUND` | Categoria não encontrada |
| `ADDRESS_NOT_FOUND` | Endereço não encontrado |
| `ORDER_NOT_FOUND` | Pedido não encontrado |
| `CART_EMPTY` | Carrinho vazio |
| `INSUFFICIENT_STOCK` | Estoque insuficiente |
| `PRODUCT_UNAVAILABLE` | Produto indisponível |
| `COUPON_NOT_IMPLEMENTED` | Cupom ainda não implementado |
| `PAYMENT_ALREADY_PROCESSED` | Pagamento já processado |
| `ORDER_NOT_PAYABLE` | Pedido não pode ser pago |
| `INVALID_WEBHOOK_SIGNATURE` | Assinatura de webhook inválida |

---

## 21. OpenAPI / Swagger

A documentação atual está em Markdown para manter controle manual e evitar divergência entre documentação e implementação.

Recomendação futura:

- adicionar especificação OpenAPI após estabilização da API;
- gerar Swagger UI apenas depois que os contratos estiverem maduros;
- manter schemas sincronizados com os DTOs Zod;
- evitar documentação duplicada divergente.

Sugestão futura de arquivo:

```text
docs/openapi.yaml
```

Ou rota interna:

```text
/api/docs
```

Somente após decisão explícita do projeto.

---

## 22. Checklist de validação da documentação

Antes do commit, validar:

```bash
npm run lint
npm run build
npm test
docker build -t ecommerce-backend:prod .
git status
```

Critérios de aceite:

- documentação criada em `docs/api-documentation.md`;
- nenhum endpoint inventado;
- payloads alinhados aos DTOs atuais;
- respostas alinhadas aos controllers/services atuais;
- fluxos de checkout, pedido e pagamento documentados;
- variáveis de ambiente relevantes documentadas;
- segurança, CORS, autenticação e produção documentados;
- lint passando;
- build passando;
- testes passando;
- build Docker passando;
- working tree contendo apenas a documentação esperada antes do commit.

---

## 23. Comandos finais de commit

```bash
git add docs/api-documentation.md

git commit -m "docs: add api documentation"

git push origin develop
```
