# Estratégia de Deploy — ecommerce-backend

## Etapa

1.8E — Definir estratégia real de deploy para produção.

## Objetivo

Definir uma estratégia realista de deploy para o backend/API do projeto ecommerce-backend usando ferramentas gratuitas ou dentro do free tier, com foco em MVP, baixo custo, segurança suficiente e possibilidade de evolução para produção real.

## Decisão técnica

### Plataforma escolhida para API

Azure Container Apps.

### Banco de dados escolhido

Azure Database for PostgreSQL Flexible Server.

### Estratégia de imagem Docker

Usar o Dockerfile já existente no projeto.

Para evitar custo inicial com Azure Container Registry, a estratégia preferencial para MVP é publicar a imagem no GitHub Container Registry, usando o padrão:

ghcr.io/MatheusFelixDev/ecommerce-backend:<commit-sha>

### Estratégia de CI/CD

GitHub Actions.

Fluxo recomendado:

1. Push ou Pull Request para develop.
2. GitHub Actions executa lint, build e testes.
3. GitHub Actions executa docker build.
4. Workflow de deploy publica imagem no GitHub Container Registry.
5. Azure Container Apps recebe nova revisão com a nova imagem.
6. Migrations de produção são executadas separadamente por workflow manual.

## Motivos da escolha

A Azure foi escolhida porque permite uma estratégia mais profissional que plataformas simplificadas, mantendo possibilidade de uso gratuito no estágio inicial.

Pontos positivos:

- Suporte nativo a containers.
- SSL automático no endpoint público.
- Escalabilidade com Azure Container Apps.
- Suporte a revisions para rollback.
- PostgreSQL gerenciado.
- Backup automático no Azure Database for PostgreSQL.
- Integração com GitHub Actions.
- Possibilidade de migrar para arquitetura mais robusta no futuro.
- Boa compatibilidade com webhooks externos, como Mercado Pago.

Pontos de atenção:

- Mais complexa que Render/Railway.
- Exige cuidado com billing.
- Recursos fora do free tier podem gerar cobrança.
- O banco gratuito é limitado a 12 meses.
- O uso de min replicas igual a 0 reduz custo, mas pode gerar cold start.
- Para produção real com pagamentos, pode ser necessário usar min replicas igual a 1.

## Free tier considerado

### Azure Container Apps

O Azure Container Apps possui grants gratuitos mensais no plano Consumption:

- 180.000 vCPU-seconds por mês.
- 360.000 GiB-seconds por mês.
- 2 milhões de requests HTTP por mês.

Quando uma revisão escala para zero réplicas, não há cobrança de consumo de CPU/memória.

### Azure Database for PostgreSQL Flexible Server

O Azure Free Services oferece, por 12 meses:

- 750 horas por mês de Flexible Server.
- Burstable B1MS.
- 32 GB de storage.
- 32 GB de backup storage.

## Arquitetura alvo

Cliente / Frontend
        |
        | HTTPS
        v
Azure Container Apps
        |
        | DATABASE_URL com SSL
        v
Azure Database for PostgreSQL Flexible Server

Integrações externas:

- Mercado Pago envia webhook HTTPS para a API.
- Melhor Envio é consumido pela API quando habilitado.
- GitHub Actions executa CI/CD.
- GitHub Container Registry armazena imagens Docker.

## Deploy da API

### Serviço

Azure Container Apps.

### Nome sugerido

ca-ecommerce-backend

### Resource Group sugerido

rg-ecommerce-backend-mvp

### Região sugerida

Preferência:

Brazil South

Fallback:

East US

A API e o banco devem ficar na mesma região sempre que possível.

### Tipo de deploy

Container Docker.

### Branch de deploy

develop durante o MVP.

Futuramente, quando existir ambiente separado, usar:

- develop para staging.
- main para production.

### Porta

O projeto deve usar a variável PORT.

Valor recomendado no Azure Container Apps:

3000

### Ingress

External.

### Target port

3000.

### Health check

Endpoint:

/api/health

Teste esperado:

GET /api/health deve retornar status 2xx.

### Escala

Para MVP gratuito:

minReplicas: 0
maxReplicas: 1

Para produção real:

minReplicas: 1
maxReplicas: 3 ou mais, conforme tráfego.

### Observação sobre cold start

Com minReplicas igual a 0, a aplicação pode dormir quando não houver tráfego. Isso reduz custo, mas pode gerar atraso na primeira requisição e em webhooks.

Para pagamentos reais, recomenda-se minReplicas igual a 1.

## Banco de dados PostgreSQL

### Serviço

Azure Database for PostgreSQL Flexible Server.

### Nome sugerido

pg-ecommerce-backend-mvp

### Database

ecommerce_db

### Usuário sugerido

ecommerce_admin

### SSL

Obrigatório.

A connection string de produção deve usar SSL conforme exigido pelo Azure PostgreSQL.

### Política de acesso

Durante MVP:

- Permitir acesso somente a partir dos recursos necessários.
- Evitar liberar acesso amplo em produção.
- Não commitar DATABASE_URL.
- Guardar DATABASE_URL apenas em secrets.

Futuro:

- Usar regras de firewall mais restritivas.
- Avaliar private networking quando o projeto evoluir.

## Migrations Prisma

### Comando oficial de produção

npx prisma migrate deploy

### Estratégia adotada

As migrations de produção não devem rodar automaticamente no start da aplicação.

Não usar:

npm start && npx prisma migrate deploy

Não colocar migration escondida no boot da API.

### Fluxo correto

1. Validar código no CI.
2. Rodar workflow manual de migration.
3. Executar npx prisma migrate deploy contra o banco de produção.
4. Fazer deploy da imagem da aplicação.
5. Validar a aplicação após deploy.

### Motivo

Separar migration do start da aplicação reduz risco de:

- migration acidental.
- falha de boot da API por problema de banco.
- alteração irreversível sem revisão.
- múltiplas réplicas tentando executar migration simultaneamente.

## Secrets e variáveis de ambiente

### Onde configurar secrets

- Azure Container Apps: variáveis/secrets da aplicação em runtime.
- GitHub Actions: secrets usados no CI/CD e nas migrations.

### Nunca commitar

- DATABASE_URL real.
- JWT_SECRET real.
- Tokens do Mercado Pago.
- Tokens do Melhor Envio.
- Secrets de webhook.
- Credenciais Azure.

## Domínio e SSL

### MVP

Usar domínio gerado pelo Azure Container Apps:

https://ca-ecommerce-backend.<region>.azurecontainerapps.io

### Produção futura

Usar domínio próprio:

https://api.seudominio.com

### SSL

Azure Container Apps fornece endpoint HTTPS.

Para domínio customizado, configurar certificado conforme recurso do Azure Container Apps.

## CORS

Durante MVP, CORS deve apontar para o frontend real publicado, por exemplo:

https://seu-frontend.vercel.app

Em produção futura:

https://seudominio.com
https://www.seudominio.com
https://admin.seudominio.com

Não usar wildcard em produção.

Evitar:

CORS_ORIGINS=*

## Webhook Mercado Pago

### Endpoint

/api/payments/webhooks/mercado-pago

### URL no MVP

https://ca-ecommerce-backend.<region>.azurecontainerapps.io/api/payments/webhooks/mercado-pago

### URL em produção futura

https://api.seudominio.com/api/payments/webhooks/mercado-pago

### Requisitos

- URL pública HTTPS.
- Endpoint sem autenticação JWT.
- Validação de assinatura ativa.
- Logs suficientes para depuração.
- Não registrar secrets em logs.
- Processamento idempotente.
- Teste em sandbox antes de pagamento real.

## Melhor Envio

Durante MVP gratuito, recomenda-se iniciar com:

MELHOR_ENVIO_ENABLED=false

Quando for testar frete real, configurar:

- MELHOR_ENVIO_ACCESS_TOKEN
- MELHOR_ENVIO_USER_AGENT
- MELHOR_ENVIO_ORIGIN_ZIP_CODE
- MELHOR_ENVIO_BASE_URL

## CI/CD

### CI atual esperado

O CI deve validar:

- npm ci
- npx prisma generate
- npx prisma migrate deploy em banco de teste
- npm run lint
- npm run build
- npm test

### Ajuste recomendado

Adicionar docker build ao CI:

docker build -t ecommerce-backend:ci .

### Deploy futuro

Criar workflow separado:

.github/workflows/deploy-azure.yml

Responsabilidades:

1. Login no Azure.
2. Login no GitHub Container Registry.
3. Build da imagem Docker.
4. Push da imagem para GHCR.
5. Atualização do Azure Container Apps com a nova imagem.

### Migrations futuras

Criar workflow separado:

.github/workflows/production-migrations.yml

Responsabilidades:

1. Execução manual via workflow_dispatch.
2. Uso de environment production.
3. Uso de DATABASE_URL de produção como secret.
4. Execução de npx prisma migrate deploy.

## Rollback

### Rollback de aplicação

Azure Container Apps usa revisions.

Plano:

1. Identificar deploy quebrado.
2. Direcionar tráfego para revisão anterior saudável.
3. Validar /api/health.
4. Validar login.
5. Validar listagem de produtos.
6. Validar fluxo controlado de pedido/pagamento sandbox.
7. Corrigir código na develop.
8. Fazer novo deploy.

### Rollback de banco

Rollback de aplicação não desfaz migration.

Regras:

- Evitar migrations destrutivas.
- Preferir migrations compatíveis com versão anterior da aplicação.
- Fazer backup antes de migration sensível.
- Para incidentes graves, restaurar banco para novo servidor usando point-in-time restore.
- Atualizar DATABASE_URL somente após validar restore.

## Backup

### Backup automático

Azure Database for PostgreSQL Flexible Server possui backups automáticos e point-in-time restore dentro do período de retenção configurado.

### Backup manual antes de mudanças críticas

Usar pg_dump:

pg_dump "$DATABASE_URL" > backup-ecommerce-$(date +%Y-%m-%d).sql

### Regras

- Nunca commitar backup no repositório.
- Guardar backup em local seguro.
- Testar restore periodicamente.
- Ter cuidado com dados de clientes, pedidos e pagamentos.

## Riscos

### Risco 1 — cobrança inesperada

Mitigação:

- Criar budget alert no Azure.
- Usar apenas recursos dentro do free tier.
- Evitar recursos pagos desnecessários.
- Evitar Azure Container Registry no início.
- Monitorar uso do PostgreSQL e Container Apps.

### Risco 2 — cold start

Mitigação:

- Aceitar durante MVP.
- Usar minReplicas=1 quando houver pagamento real.

### Risco 3 — migration irreversível

Mitigação:

- Rodar migration manualmente.
- Fazer backup antes.
- Evitar DROP destrutivo.
- Validar migration em staging antes de produção real.

### Risco 4 — webhook perdido ou atrasado

Mitigação:

- Usar HTTPS público.
- Manter logs.
- Validar assinatura.
- Consultar status do pagamento diretamente no Mercado Pago quando necessário.
- Considerar minReplicas=1 em produção real.

## Fontes oficiais consultadas

- Azure Container Apps billing:
  https://learn.microsoft.com/en-us/azure/container-apps/billing

- Azure Free Services:
  https://azure.microsoft.com/en-us/pricing/free-services

- Azure Database for PostgreSQL:
  https://azure.microsoft.com/en-us/products/postgresql

- Azure PostgreSQL backup and restore:
  https://learn.microsoft.com/en-us/azure/postgresql/backup-restore/concepts-backup-restore

- Azure Container Apps revisions:
  https://learn.microsoft.com/en-us/azure/container-apps/revisions

- Azure Container Apps environment variables:
  https://learn.microsoft.com/en-us/azure/container-apps/environment-variables

- Azure Container Apps GitHub Actions:
  https://learn.microsoft.com/en-us/azure/container-apps/github-actions

## Decisão final

Para o MVP, a estratégia escolhida é:

API: Azure Container Apps
Banco: Azure Database for PostgreSQL Flexible Server
Imagem: GitHub Container Registry
CI/CD: GitHub Actions
Migrations: workflow manual com npx prisma migrate deploy
SSL: HTTPS do Azure Container Apps
Webhook: URL pública HTTPS do Azure
Backup: backup automático do Azure PostgreSQL + pg_dump antes de migrations críticas
Rollback: revisions do Azure Container Apps + restore de banco quando necessário
