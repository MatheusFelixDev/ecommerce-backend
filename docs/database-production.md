# Banco de Dados em Produção — ecommerce-backend

## Objetivo

Preparar a estratégia operacional do PostgreSQL para produção sem executar deploy real e sem criar banco real neste momento.

Esta documentação cobre:

- escolha do PostgreSQL gerenciado;
- DATABASE_URL e SSL/TLS;
- política de migrations Prisma;
- seed/admin inicial;
- backups;
- restore;
- índices;
- performance básica;
- segurança;
- checklists operacionais.

---

## 1. Estratégia de PostgreSQL para produção

Banco recomendado:

```txt
Azure Database for PostgreSQL Flexible Server

Motivos:

PostgreSQL gerenciado;
backups automáticos;
point-in-time restore;
SSL/TLS obrigatório;
integração natural com Azure Container Apps;
menor responsabilidade operacional que PostgreSQL em container próprio;
estratégia já alinhada com a documentação de deploy do projeto.

Alternativas aceitáveis no futuro:

Neon;
Supabase;
Aiven.

PostgreSQL em container próprio não é recomendado para produção neste projeto, exceto em cenário controlado com equipe responsável por backup, restore, atualização, segurança, monitoramento e alta disponibilidade.

2. Ambientes
Local

Usa PostgreSQL local via Docker Compose.

Exemplo:

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ecommerce_db

O usuário postgres/postgres é aceitável apenas para desenvolvimento local.

Test

Usa PostgreSQL isolado para testes automatizados.

Exemplo:

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ecommerce_test_db

O uso de postgres/postgres em CI/teste é aceitável porque o banco é efêmero e isolado.

Production

Produção deve usar banco gerenciado, SSL/TLS e secrets.

Exemplo genérico, sem secret real:

DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require

Regras:

nunca commitar DATABASE_URL real;
armazenar somente em secrets do provedor;
usar senha forte;
não usar postgres/postgres;
exigir SSL/TLS;
não apontar produção para localhost, loopback ou ngrok.
3. SSL/TLS

Em produção, a connection string deve exigir SSL/TLS:

?sslmode=require

Exemplo:

DATABASE_URL=postgresql://ecommerce_admin:SENHA_FORTE@pg-ecommerce-backend-mvp.postgres.database.azure.com:5432/ecommerce_db?sslmode=require

Regras:

SSL/TLS é obrigatório em produção;
a aplicação nunca deve logar a DATABASE_URL;
certificados e parâmetros avançados devem ser tratados no momento do deploy real, conforme o provedor escolhido.
4. Prisma 7 e geração do client

O projeto usa Prisma 7 com:

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

A URL do banco é carregada via prisma.config.ts:

datasource: {
  url: env("DATABASE_URL"),
}

Regra:

manter schema.prisma sem URL hardcoded;
manter migrations versionadas em prisma/migrations;
gerar client antes de build/test quando necessário.
5. Política de migrations Prisma

Comando correto para produção:

npx prisma migrate deploy

Comandos úteis:

npx prisma migrate status
npx prisma migrate deploy

Regras obrigatórias:

nunca usar prisma db push em produção;
nunca usar prisma migrate dev em produção;
versionar todas as migrations;
revisar SQL gerado antes de aplicar;
testar migration em staging antes de produção;
fazer backup antes de migration sensível;
não rodar migrations escondidas no npm start;
não deixar múltiplas réplicas tentando migrar ao mesmo tempo;
executar migrations de produção via etapa controlada/manual.

Fluxo recomendado:

Criar migration localmente.
Rodar testes locais.
Commitar schema.prisma e prisma/migrations.
CI executa lint, build e testes.
Staging recebe npx prisma migrate deploy.
Validar staging.
Fazer backup de produção.
Executar npx prisma migrate deploy em produção.
Fazer deploy da aplicação.
Validar health check, login, produtos, pedidos e pagamentos.
6. Seed e admin inicial

O seed atual não deve ser usado como mecanismo automático de criação de admin em produção.

Regras:

não commitar e-mail/senha real de admin;
não deixar senha padrão de admin;
não rodar seed de desenvolvimento em produção;
admin inicial de produção deve ser criado por processo manual controlado ou script one-shot com variáveis seguras;
qualquer script de bootstrap de admin deve ser removido/desabilitado após uso.

Estratégia recomendada para o deploy real:

Criar banco.
Rodar migrations.
Criar admin inicial por processo controlado.
Forçar troca de senha, se aplicável.
Registrar evidência operacional sem expor senha.

Exemplo de variáveis futuras, se o projeto decidir criar script one-shot:

INITIAL_ADMIN_NAME=
INITIAL_ADMIN_EMAIL=
INITIAL_ADMIN_PASSWORD=

Essas variáveis nunca devem ser commitadas.

7. Backups

Para Azure Database for PostgreSQL Flexible Server:

habilitar backup automático;
usar retenção mínima de 7 dias;
para produção real com pedidos/pagamentos, avaliar 14 a 35 dias;
confirmar point-in-time restore;
fazer backup antes de migration crítica;
testar restore periodicamente.

Backup manual antes de mudanças críticas:

pg_dump "$DATABASE_URL" > backup-ecommerce-$(date +%Y-%m-%d).sql

Regras:

nunca commitar backup;
armazenar backup em local seguro;
tratar backup como dado sensível;
registrar data, responsável e motivo do backup;
validar se o backup pode ser restaurado.
8. Restore

O restore deve ser usado em casos como:

migration destrutiva aplicada por engano;
corrupção de dados;
exclusão acidental;
falha grave em pedidos/pagamentos;
necessidade de recuperar estado anterior consistente.

Fluxo recomendado para point-in-time restore:

Identificar incidente.
Congelar deploys.
Avaliar impacto em pedidos e pagamentos.
Definir ponto de restauração.
Restaurar para novo servidor/banco.
Validar tabelas críticas.
Validar usuários, produtos, pedidos e pagamentos.
Apontar aplicação para a nova DATABASE_URL, se aprovado.
Validar /api/health.
Validar endpoints críticos.
Comunicar janela de instabilidade/downtime.
Registrar causa raiz e ação preventiva.

Atenção:

restore não deve sobrescrever banco sem validação;
pedidos e pagamentos durante a janela do incidente exigem reconciliação manual;
webhooks do Mercado Pago podem precisar de reprocessamento ou conferência.
9. Índices revisados
Products

Consultas críticas:

listagem paginada;
filtro por categoria;
filtro por preço;
filtro por estoque;
ordenação por recentes;
ordenação por preço;
ordenação por mais vendidos;
detalhe por slug;
busca por SKU.

Cobertura atual considerada suficiente para MVP:

slug único;
sku único;
categoryId;
categoryId + isActive;
status;
isActive;
priceInCents;
stock;
salesCount;
createdAt.
Orders

Consultas críticas:

pedidos do usuário;
pedidos por status;
detalhe por usuário;
relatórios por status de pagamento e data.

Cobertura atual considerada suficiente para MVP:

userId;
status;
paymentStatus;
createdAt;
userId + status;
userId + createdAt.

Ponto de observação futura:

avaliar índice composto paymentStatus + createdAt se relatórios ficarem lentos.
Payments

Consultas críticas:

pagamento por pedido;
webhook por provider payment id;
webhook por provider preference id;
pagamento ativo por pedido;
histórico por status/data.

Cobertura atual considerada suficiente para MVP:

orderId;
provider;
providerPaymentId;
providerPreferenceId;
status;
createdAt.

Ponto de observação futura:

avaliar índices compostos provider + providerPaymentId e provider + providerPreferenceId após volume real de webhooks.
Cart

Cobertura atual adequada:

userId;
productId;
userId + productId único.
Stock movements

Cobertura atual adequada:

productId;
adminUserId;
type;
createdAt.
10. Performance básica

Não instalar dependência de load test neste momento.

Teste manual inicial, quando a API estiver rodando:

BASE_URL=http://localhost:3000/api

for i in {1..50}; do
  curl -s "$BASE_URL/products?page=1&perPage=10" > /dev/null
done

Endpoints críticos para teste futuro:

GET /api/products
GET /api/products/:slug
GET /api/orders
GET /api/admin/reports/sales
GET /api/admin/reports/top-products
GET /api/admin/reports/low-stock

Quando houver massa real de dados, usar:

EXPLAIN ANALYZE

em consultas críticas antes de adicionar novos índices.

11. Segurança de acesso ao banco

Regras obrigatórias:

usuário de produção com senha forte;
não usar postgres/postgres;
não expor porta do banco publicamente sem necessidade;
restringir por firewall/rede;
SSL/TLS obrigatório;
secrets no Azure Container Apps e GitHub Actions;
não logar DATABASE_URL;
rotacionar senha em caso de suspeita de vazamento;
aplicar princípio do menor privilégio quando o ambiente amadurecer.

Para MVP, um usuário administrativo do banco pode ser aceito, desde que:

esteja protegido por senha forte;
o acesso de rede seja restrito;
não seja compartilhado fora dos secrets;
não seja usado em ambiente local.
12. Checklist antes de migration
 Branch atualizada.
 Working tree limpa.
 Migration revisada.
 SQL destrutivo identificado.
 npx prisma migrate status executado.
 Backup feito antes de alteração sensível.
 Staging validado.
 Janela de deploy definida.
 Responsável definido.
 Plano de rollback de aplicação definido.
 Plano de restore de banco definido.
13. Checklist pós-migration
 npx prisma migrate deploy finalizou sem erro.
 Tabelas/colunas esperadas existem.
 /api/health responde.
 Login funciona.
 Listagem de produtos funciona.
 Carrinho funciona.
 Criação de pedido controlado funciona.
 Pagamento sandbox funciona, se aplicável.
 Logs sem erro recorrente de banco.
 Nenhum secret apareceu em log.
14. Checklist de incidente de banco
 Identificar horário do incidente.
 Congelar deploys.
 Preservar logs.
 Identificar tabelas afetadas.
 Avaliar impacto em pedidos/pagamentos.
 Decidir entre correção manual, rollback de aplicação ou restore.
 Se restore, definir ponto de restauração.
 Restaurar em novo banco/servidor.
 Validar dados restaurados.
 Atualizar DATABASE_URL apenas após validação.
 Reconciliar pedidos/pagamentos afetados.
 Registrar causa raiz.
 Criar ação preventiva.
15. Critérios de aceite da etapa 1.8J
 Estratégia de PostgreSQL para produção documentada.
 DATABASE_URL e SSL documentados.
 Política de migrations definida.
 Seed/admin inicial revisado.
 Backup documentado.
 Restore documentado.
 Índices revisados.
 Segurança de banco documentada.
 Checklist pré-migration criado.
 Checklist de incidente de banco criado.
 Lint passando.
 Build passando.
 Testes passando.
 Docker build passando.
Fontes oficiais
Prisma Migrate production/deploy:
https://www.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate
Prisma Migrate development and production:
https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production
Azure Database for PostgreSQL Flexible Server:
https://learn.microsoft.com/en-us/azure/postgresql/
Azure PostgreSQL backup and restore:
https://learn.microsoft.com/en-us/azure/postgresql/backup-restore/concepts-backup-restore
Azure PostgreSQL TLS/SSL:
https://learn.microsoft.com/en-us/azure/postgresql/security/security-tls
