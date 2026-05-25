# Checklist de Produção — ecommerce-backend

## Objetivo

Checklist para validar o backend/API ecommerce-backend antes, durante e depois do deploy no Azure.

---

## 1. Checklist antes do deploy

### Código e repositório

- [ ] Branch `develop` atualizada com `origin/develop`.
- [ ] Working tree limpa antes do deploy.
- [ ] Dockerfile de produção existente.
- [ ] `.dockerignore` existente.
- [ ] `package.json` com script `start` funcionando.
- [ ] API escutando em `0.0.0.0`.
- [ ] Porta configurável via `PORT`.
- [ ] Health check disponível em `/api/health`.
- [ ] CORS restrito em produção.
- [ ] `.env.production.example` atualizado.
- [ ] Nenhum secret real commitado.

### Validação local obrigatória

Executar:

```bash
npm run lint
npm run build
npm test
docker build -t ecommerce-backend:prod .
git status
```

Resultado esperado:

- [ ] Lint sem erro.
- [ ] Build TypeScript sem erro.
- [ ] Testes automatizados passando.
- [ ] Docker build passando.
- [ ] `git status` sem alterações inesperadas.

---

## 2. Checklist Azure

### Conta e billing

- [ ] Conta Azure ativa.
- [ ] Free tier entendido.
- [ ] Budget alert configurado.
- [ ] Monitoramento básico de custo ativado.
- [ ] Região escolhida.

Região recomendada:

```txt
Brazil South
```

Fallback:

```txt
East US
```

### Resource Group

- [ ] Resource Group criado.

Nome sugerido:

```txt
rg-ecommerce-backend-mvp
```

---

## 3. Checklist do PostgreSQL

Serviço recomendado:

```txt
Azure Database for PostgreSQL Flexible Server
```

Checklist:

- [ ] PostgreSQL Flexible Server criado.
- [ ] Plano dentro do free tier selecionado, quando disponível.
- [ ] Região igual ou próxima da API.
- [ ] Database `ecommerce_db` criado.
- [ ] Usuário administrativo criado.
- [ ] SSL obrigatório confirmado.
- [ ] Backup automático confirmado.
- [ ] Política de acesso/firewall revisada.
- [ ] `DATABASE_URL` montada.
- [ ] `DATABASE_URL` salva apenas em secrets.
- [ ] `DATABASE_URL` não commitada.

---

## 4. Checklist do Azure Container Apps

Serviço recomendado:

```txt
Azure Container Apps
```

Configuração inicial:

```txt
Container App: ca-ecommerce-backend
Ingress: external
Target port: 3000
Min replicas: 0
Max replicas: 1
Health check: /api/health
```

Checklist:

- [ ] Container App criado.
- [ ] Ingress externo habilitado.
- [ ] Target port configurada para `3000`.
- [ ] `minReplicas` configurado conforme ambiente.
- [ ] `maxReplicas` definido.
- [ ] Health check configurado para `/api/health`.
- [ ] Variáveis de ambiente configuradas.
- [ ] Secrets configurados.
- [ ] URL pública HTTPS disponível.

Observação:

Para MVP gratuito, `minReplicas=0` reduz custo, mas pode gerar cold start. Para produção real com pagamentos, avaliar `minReplicas=1`.

---

## 5. Checklist GitHub Actions

### CI

O CI deve validar:

- [ ] `npm ci`
- [ ] `npx prisma generate`
- [ ] `npx prisma migrate deploy` em banco de teste
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `npm test`
- [ ] `docker build -t ecommerce-backend:ci .`

### Secrets do GitHub

- [ ] `AZURE_CREDENTIALS` configurado.
- [ ] `AZURE_SUBSCRIPTION_ID` configurado.
- [ ] `AZURE_RESOURCE_GROUP` configurado.
- [ ] `AZURE_CONTAINER_APP_NAME` configurado.
- [ ] `DATABASE_URL` de produção configurado em environment seguro.
- [ ] `GHCR_TOKEN` configurado, se necessário.
- [ ] Nenhum secret real em arquivo versionado.

### Workflows futuros

- [ ] Workflow de deploy Azure criado quando necessário.
- [ ] Workflow manual de migrations criado quando necessário.
- [ ] Workflow de migration exige execução manual.
- [ ] Environment `production` com proteção configurada, se possível.

---

## 6. Checklist de migrations Prisma

Comando correto para produção:

```bash
npx prisma migrate deploy
```

Checklist:

- [ ] Confirmar `DATABASE_URL` de produção.
- [ ] Confirmar estado atual do banco.
- [ ] Rodar `npx prisma migrate deploy`.
- [ ] Validar se as tabelas foram criadas/atualizadas.
- [ ] Não rodar `prisma migrate dev` em produção.
- [ ] Não rodar `prisma db push` em produção.
- [ ] Não rodar migrations escondidas no `npm start`.

Regra:

As migrations devem ser executadas de forma controlada, preferencialmente via workflow manual do GitHub Actions.

---

## 7. Checklist de variáveis de ambiente

### Core

- [ ] `NODE_ENV=production`
- [ ] `PORT=3000`
- [ ] `DATABASE_URL` configurado
- [ ] `JWT_SECRET` configurado
- [ ] `JWT_EXPIRES_IN` configurado
- [ ] `CORS_ORIGINS` configurado

### Melhor Envio

- [ ] `MELHOR_ENVIO_ENABLED` definido.
- [ ] `MELHOR_ENVIO_BASE_URL` definido.
- [ ] `MELHOR_ENVIO_ACCESS_TOKEN` configurado quando habilitado.
- [ ] `MELHOR_ENVIO_USER_AGENT` configurado quando habilitado.
- [ ] `MELHOR_ENVIO_ORIGIN_ZIP_CODE` configurado quando habilitado.

### Mercado Pago

- [ ] `MERCADO_PAGO_ENABLED` definido.
- [ ] `MERCADO_PAGO_BASE_URL` definido.
- [ ] `MERCADO_PAGO_ACCESS_TOKEN` configurado.
- [ ] `MERCADO_PAGO_PUBLIC_KEY` configurado.
- [ ] `MERCADO_PAGO_WEBHOOK_SECRET` configurado.
- [ ] `MERCADO_PAGO_SUCCESS_URL` configurado.
- [ ] `MERCADO_PAGO_FAILURE_URL` configurado.
- [ ] `MERCADO_PAGO_PENDING_URL` configurado.
- [ ] `MERCADO_PAGO_NOTIFICATION_URL` configurado.

---

## 8. Checklist pós-deploy

### Health check

Executar:

```bash
curl -i https://SUA_URL_AZURE/api/health
```

Validar:

- [ ] HTTP 2xx.
- [ ] API responde sem erro.
- [ ] Logs sem stack trace.

### Root endpoint

Executar:

```bash
curl -i https://SUA_URL_AZURE/
```

Validar:

- [ ] API responde.
- [ ] Sem erro de ambiente.
- [ ] Sem erro de conexão com banco.

### Autenticação

Executar:

```bash
curl -X POST "https://SUA_URL_AZURE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cliente@example.com",
    "password": "12345678"
  }'
```

Validar:

- [ ] Login retorna sucesso.
- [ ] JWT retornado.
- [ ] Refresh token funcionando, se aplicável.
- [ ] Credenciais inválidas retornam erro controlado.

### Produtos

Executar:

```bash
curl -i "https://SUA_URL_AZURE/api/products?page=1&perPage=10"
```

Validar:

- [ ] Resposta 2xx.
- [ ] Paginação funcionando.
- [ ] Sem erro de banco.

### Categorias

Executar:

```bash
curl -i "https://SUA_URL_AZURE/api/categories"
```

Validar:

- [ ] Resposta 2xx.
- [ ] Sem erro de banco.

### Pedido controlado

Validar:

- [ ] Adicionar produto ao carrinho.
- [ ] Revisar checkout.
- [ ] Criar pedido.
- [ ] Confirmar débito de estoque.
- [ ] Confirmar limpeza do carrinho.
- [ ] Confirmar listagem do pedido para o usuário.

---

## 9. Checklist Mercado Pago

Webhook esperado:

```txt
POST /api/payments/webhooks/mercado-pago
```

URL MVP:

```txt
https://SUA_URL_AZURE/api/payments/webhooks/mercado-pago
```

Checklist:

- [ ] URL pública HTTPS configurada no Mercado Pago.
- [ ] Endpoint acessível sem JWT.
- [ ] `MERCADO_PAGO_WEBHOOK_SECRET` configurado.
- [ ] Assinatura do webhook validada.
- [ ] Webhook sandbox testado.
- [ ] Pagamento sandbox criado.
- [ ] Status do pagamento atualizado corretamente.
- [ ] Pedido atualizado corretamente.
- [ ] Idempotência preservada.
- [ ] Logs não vazam token ou payload sensível.

---

## 10. Checklist Melhor Envio

Se desabilitado no MVP:

- [ ] `MELHOR_ENVIO_ENABLED=false`.
- [ ] Fluxo de checkout não quebra.
- [ ] Mensagem de provider desabilitado é controlada.

Se habilitado:

- [ ] Token válido configurado.
- [ ] User-Agent configurado.
- [ ] CEP de origem configurado.
- [ ] Cotação de frete testada.
- [ ] Logs não vazam token.

---

## 11. Checklist de logs

- [ ] Logs visíveis no Azure.
- [ ] Logs não mostram `JWT_SECRET`.
- [ ] Logs não mostram `DATABASE_URL`.
- [ ] Logs não mostram access token do Mercado Pago.
- [ ] Logs não mostram access token do Melhor Envio.
- [ ] Erros têm mensagem suficiente para depuração.
- [ ] Webhooks têm logs controlados.

---

## 12. Checklist de CORS

Origem permitida:

- [ ] Frontend real consegue acessar a API.
- [ ] Admin real consegue acessar a API, se existir.

Origem não permitida:

- [ ] Origem desconhecida é bloqueada.
- [ ] `CORS_ORIGINS` não usa wildcard em produção.
- [ ] Apenas HTTPS é usado em produção.

---

## 13. Checklist de rollback

Plano de rollback da aplicação:

1. Identificar revisão com erro.
2. Voltar tráfego para revisão anterior no Azure Container Apps.
3. Testar `/api/health`.
4. Testar login.
5. Testar produtos.
6. Testar pedido controlado.
7. Corrigir código na `develop`.
8. Fazer novo deploy.

Checklist:

- [ ] Saber listar revisions do Azure Container Apps.
- [ ] Saber redirecionar tráfego para revisão anterior.
- [ ] Última revisão estável identificada.
- [ ] Migration recente não impede rollback.
- [ ] Backup feito antes de migration sensível.

---

## 14. Checklist de backup e restore

Backup automático:

- [ ] Backup automático do PostgreSQL confirmado.
- [ ] Retenção confirmada.
- [ ] Point-in-time restore entendido.

Backup manual antes de mudanças críticas:

```bash
pg_dump "$DATABASE_URL" > backup-ecommerce-$(date +%Y-%m-%d).sql
```

Checklist:

- [ ] `pg_dump` testado.
- [ ] Restore testado em ambiente separado.
- [ ] Backup nunca commitado.
- [ ] Dados sensíveis tratados com cuidado.

---

## 15. Critérios de aceite da etapa 1.8E

A etapa é considerada concluída quando:

- [ ] Plataforma de deploy escolhida.
- [ ] Banco PostgreSQL escolhido.
- [ ] Estratégia de migrations definida.
- [ ] Estratégia de secrets definida.
- [ ] Domínio/SSL definidos.
- [ ] Webhook Mercado Pago definido.
- [ ] Rollback definido.
- [ ] Backup definido.
- [ ] Checklist pós-deploy criado.
- [ ] Documentação commitada.
- [ ] Validações locais executadas.
- [ ] `git status` limpo após commit.

---

## 16. Checklist específico do banco — 1.8J

- [ ] `docs/database-production.md` revisado.
- [ ] Banco escolhido: Azure Database for PostgreSQL Flexible Server.
- [ ] `DATABASE_URL` de produção usa `sslmode=require`.
- [ ] `DATABASE_URL` real está somente em secrets.
- [ ] Usuário/senha de produção não usa `postgres/postgres`.
- [ ] `npx prisma migrate status` revisado antes da migration.
- [ ] `npx prisma migrate deploy` definido como comando oficial de produção.
- [ ] `prisma db push` proibido em produção.
- [ ] Seed de produção não cria admin com senha hardcoded.
- [ ] Admin inicial será criado por processo manual/controlado.
- [ ] Backup automático confirmado.
- [ ] Retenção de backup definida.
- [ ] Backup manual feito antes de migration crítica.
- [ ] Restore point-in-time entendido.
- [ ] Checklist de incidente de banco documentado.
- [ ] Índices revisados para MVP.
- [ ] Índices compostos futuros dependem de `EXPLAIN ANALYZE` com dados reais.
