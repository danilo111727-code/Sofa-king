# Execução autorizada da publicação

O serviço Render gratuito não oferece Shell. Para executar a preparação no próprio ambiente do serviço, sem retirar ou revelar DATABASE_URL, o build desta publicação usa:

```bash
bash render-build.sh && CONFIGURATOR_MIGRATE=1 node artifacts/api-server/scripts/prepare-configurator-release.mjs
```

A preparação lê, em uma transação consistente, todas as linhas das tabelas públicas `products`, `materials`, `site_settings` e `events`, com metadados das colunas e índices. Ela não lê tabelas de outros aplicativos e não modifica os registros originais.

O backup lógico é armazenado em `sofa_king_private.release_backups`, com RLS e sem permissões públicas, e também em arquivo privado do artefato de build. O script registra apenas ID, checksum e contagens, sem dados de clientes ou credenciais. Depois de salvar o backup, aplica a migração aditiva de variações na mesma transação. Qualquer erro desfaz a transação e faz o build falhar antes de substituir o serviço atual.

O administrador autorizado pode baixar a cópia por `GET /api/admin/configurator-backup/latest`. A rota usa a mesma autorização Clerk verificada das demais rotas administrativas, valida o checksum e responde como download sem cache. Não há rota pública de backup.

Esse é um backup lógico das tabelas da aplicação Sofa King; não equivale a um snapshot físico de todo o servidor PostgreSQL nem protege contra perda completa do provedor. O roteiro anterior de pg_dump continua disponível para quem precisar de uma cópia externa completa.

Publicar o commit específico no Render desabilita Auto-Deploy pela interface. Não é necessário fazer merge na main. Após o backend ficar Live, conferir rotas e comparar o snapshot público de preços antes de publicar o frontend na Vercel.

Validação adicional: três testes de backup, download administrativo e rollback em caso de falha; backend totaliza 55 testes aprovados, além de TypeScript e build. O frontend preparado permanece no commit e500ca244b191b98d75c77715f1f05488b2712c8, sem mudanças no visual e nas funções aprovadas.
