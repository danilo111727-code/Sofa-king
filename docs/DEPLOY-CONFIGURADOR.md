# Configurador Sofa King — publicação manual

## Situação da entrega

Código preparado em `release/configurador-manual`, sem merge na main e sem deploy. Os quatro pacotes formam uma única entrega: publique o backend antes do frontend, seguindo a ordem abaixo. Não publique apenas arquivos avulsos.

| Pacote | Entrega |
| --- | --- |
| 1 — Integração e salvamento | API Express existente recebe álbuns de variações livres, fotos, acréscimos, associações, restrições de tecidos/espumas e prazo. Modelo e configuração são gravados juntos; falhas no banco não geram sucesso nem alteram o cache. |
| 2 — Segurança e carrinho | Autorização depende exclusivamente do middleware Clerk. Carrinho guarda IDs das opções e recalcula preços, disponibilidade e parcelamento no servidor antes do WhatsApp. Mudanças exigem revisão do cliente. |
| 3 — Compatibilidade | Frontend construído sobre a main `6e944d2cb58988c3e1913e45c3189e7cd38ef2ce`, preservando início, catálogo, menu e paleta. Carrinho oficial `sk_cart_v1` preservado. Produção usa `/api`; preview usa armazenamento separado. |
| 4 — Validação e operação | Testes de integração com PostgreSQL/WASM isolado, testes funcionais/visuais em 390 e 1440 px, snapshot público de preços, roteiro manual e reversão. |

Nenhum registro `[TESTE]`, foto de homologação, credencial ou dado do Supabase de testes faz parte da implantação. Os novos álbuns oficiais começam vazios. As opções reais deverão ser cadastradas pelo administrador e associadas aos modelos desejados.

## 1. Registrar a versão segura e fazer backup

1. Anote os IDs dos deploys atualmente ativos no Render e na Vercel. Eles são a referência real de rollback; o HEAD do GitHub pode conter somente upload de foto.
2. Faça um backup completo do PostgreSQL oficial com o recurso de backup disponível na conta ou, no seu computador, com `pg_dump --format=custom --file=sofa-king-antes-configurador.dump "$DATABASE_URL"`. Use a conexão externa do banco, mantida somente no seu ambiente. Não cole segredos no repositório.
3. Guarde a revisão do backend anterior: `fe891474fc92027bcb0d242011785bc752f1ec43`. A base do frontend preparado é `6e944d2cb58988c3e1913e45c3189e7cd38ef2ce`. Se a produção tiver avançado, registre o novo deploy e concilie as alterações antes de publicar.
4. Salve também a fotografia pública do catálogo, sem escrever na API:

```bash
node artifacts/api-server/scripts/catalog-snapshot.mjs --out=release-evidence/antes.json
```

O snapshot JSON ajuda a comparar preços; ele não substitui o backup do banco, que também contém configurações, eventos e outros registros.

## 2. Preparar o banco — antes de publicar o backend

No clone do backend, selecione `release/configurador-manual`, instale as dependências e configure `DATABASE_URL` para o banco oficial, no seu terminal. Execute somente quando estiver pronto para a publicação:

```bash
pnpm install --frozen-lockfile --prod=false --filter @workspace/api-server...
NODE_ENV=production CONFIGURATOR_MIGRATE=1 pnpm --filter @workspace/api-server exec node scripts/migrate-configurator.mjs
```

A migração cria apenas `sofa_king_private.variation_albums`, em schema privado, com RLS e sem permissão pública. Pode ser repetida. Ela não altera tabelas existentes, preços ou modelos e não importa nada do Supabase de testes. O usuário do banco usado pela API precisa ser o proprietário da nova tabela ou receber privilégios adequados do administrador do banco.

Se estiver usando um serviço Render sem acesso a Shell, execute pelo computador com a conexão externa do PostgreSQL. Não crie outro banco nem substitua `DATABASE_URL` no serviço de produção pela conexão de testes.

## 3. Publicar o backend manualmente no Render

Use o serviço existente `sofa-king`, no workspace **My Workspace**:

https://dashboard.render.com/web/srv-d7hbhbfavr4c73f01090

1. Primeiro desative Auto-Deploy nesse serviço. A entrega não alterou as configurações da sua conta.
2. Selecione o repositório `danilo111727-code/Sofa-king` e a branch `release/configurador-manual`. Não use o servidor `preview-api/server.mjs` e não aplique o Blueprint para criar um novo banco.
3. Preserve as variáveis oficiais de banco, Clerk, administradores e upload de imagens. Não copie variáveis dos serviços de testes. `ADMIN_EMAILS` deve conter o e-mail verificado da sua conta administrativa.
4. Build: `bash render-build.sh`.
5. Start: `node --enable-source-maps artifacts/api-server/dist/index.mjs`.
6. Faça o deploy manual da revisão preparada e acompanhe até ficar Live.
7. Confira `/api/healthz`, `/api/products`, `/api/albums`, `/api/materials`, `/api/settings` e `/api/variation_albums` (este último deve começar como `[]`).
8. Compare os preços antes de seguir para o frontend:

```bash
node artifacts/api-server/scripts/catalog-snapshot.mjs --out=release-evidence/depois.json --compare=release-evidence/antes.json
```

Se houver diferença não prevista ou falha de rota, pare antes do frontend e use a reversão. Não envie produtos JSON para a API para tentar corrigir uma divergência.

## 4. Publicar o frontend manualmente na Vercel

1. No repositório `danilo111727-code/sofa-king-frontend`, selecione `release/configurador-manual`.
2. Preserve a chave pública Clerk e o proxy Clerk usados no site oficial. Não use a chave da homologação.
3. Configure `VITE_APP_ENV=production` e `VITE_API_BASE_URL=/api`.
4. Instalação: `npm ci`. Build: `npm run build`. Saída: `dist`.
5. O `vercel.json` já encaminha `/api/*` para `https://sofa-king.onrender.com/api/*` e preserva a navegação SPA. A integração Git automática está desabilitada nessa versão para evitar publicar ao criar a branch.
6. Faça a publicação manual pelo seu fluxo Vercel. Pelo terminal, dentro do frontend e vinculado ao projeto oficial, o comando de publicação é `vercel --prod`. Execute-o somente após conferir o projeto de destino e concluir as etapas do backend. Não basta subir a pasta `dist` sem a configuração do proxy.
7. Nenhum merge na main é necessário para publicar essa branch manualmente. Qualquer merge posterior deve ser revisado separadamente.

## 5. Checklist depois da publicação manual

- [ ] Site abre na página inicial; links diretos de produto e carrinho recarregam corretamente.
- [ ] Catálogo, fotos, favoritos, menu e paleta continuam corretos.
- [ ] Login de administrador funciona com a conta oficial; clientes não acessam cadastros administrativos.
- [ ] Clientes, estatísticas, pedidos, configurações e upload de fotos existentes continuam disponíveis.
- [ ] Em Materiais → Variações, cadastrar uma variação real, adicionar foto e acréscimo; editar e recarregar.
- [ ] No modelo escolhido, marcar somente as opções oferecidas; remover duas espumas, salvar e reabrir. Conferir que apenas essas duas continuam desmarcadas.
- [ ] No cliente, conferir foto, opções permitidas, quantidades de módulos, prazo e cálculo.
- [ ] Conferir carrinho com itens antigos e novos; alterar um acréscimo e confirmar que o carrinho exige revisão antes de abrir o WhatsApp.
- [ ] Conferir o resumo no WhatsApp sem enviar um pedido de teste real.
- [ ] Conferir celular e computador usando as URLs oficiais.

Essas verificações no ambiente publicado ficam para a execução manual: não foram feitas em produção nesta entrega.

## Reversão

1. Reverta primeiro o frontend na Vercel para o deploy seguro anotado no início.
2. Se necessário, reverta o backend no Render para o deploy seguro anterior. Confira as variáveis da revisão escolhida: o rollback reutiliza variáveis do deploy de destino; não restaura o banco. Mantenha o Auto-Deploy desativado.
3. Não apague a nova tabela e não restaure o banco inteiro como primeira ação: a migração é aditiva e a versão anterior ignora os novos dados. Assim você preserva pedidos e alterações feitos desde a publicação.
4. Não importe dados de testes nem execute DELETE/UPDATE em massa. Restauração de banco exige avaliar quais dados posteriores precisam ser preservados.

## Evidências antes do deploy

- 52 testes automatizados de backend e 13 de frontend aprovados.
- TypeScript e builds dos dois projetos aprovados.
- PostgreSQL/WASM local: migração repetível; CRUD de variações; associações e espumas após recarga; falha de gravação sem mudança de cache; cotação atual; bloqueio de associação inválida e de acesso indevido.
- Browser local isolado em 390×844 e 1440×1000: cadastro, upload real para armazenamento local, associação, remoção de duas espumas, recarga, foto no cliente, quantidade de módulos, preço, carrinho e revisão obrigatória de preço alterado. Sem erros JavaScript ou rolagem horizontal nos cenários conferidos.
- As identidades Clerk dos testes locais são substitutos de teste; o login real da conta oficial e seus provedores de armazenamento precisam do smoke test acima após a publicação. Nenhuma mensagem WhatsApp foi enviada.
- Catálogo público oficial lido em 30/10/2026: 104 modelos; 33.516 combinações comparadas com o cálculo da main, sem divergência de preço. Hash de preços: `0c58516c0d9bb024d5369f2eef8fcd630c547434bbb7dba9bb121bd25cb50454`.
- Aviso de bundle grande no Vite permanece; não impede o build. A preparação não altera produção, banco oficial, serviços Render ou branch main.

## Repetir a validação local

Backend (somente banco isolado em memória):

```bash
pnpm --filter @workspace/api-server test
pnpm --filter @workspace/api-server typecheck
bash render-build.sh
```

Frontend:

```bash
npm ci
npm test
npm run typecheck
npm run build
```

Para repetir o fluxo de navegador sem usar contas, APIs ou bancos externos, instale o Chromium do Playwright (`npx playwright install chromium`) e execute no frontend:

```bash
SK_BACKEND_PATH=/caminho/do/clone/Sofa-king npm run qa:visual
```

Esse teste inicia os servidores apenas em `127.0.0.1` nas portas 4100/4101, substitui a identidade Clerk somente no harness de testes e cria seus próprios dados temporários. Os cenários incluem upload local, duas espumas removidas, variação livre, seleção por quantidade, carrinho e revisão de preço; o WhatsApp é interceptado sem enviar mensagem. As imagens ficam em `playwright-results`. Não execute os harnesses como comando de produção.

Referências operacionais: [deploy manual no Render](https://render.com/docs/deploys), [reversão no Render](https://render.com/docs/rollbacks), [deploy automático por Git na Vercel](https://vercel.com/docs/project-configuration/git-configuration).
