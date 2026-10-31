# Publicação do configurador Sofa King — 31/10/2026

Situação: backend e frontend publicados em produção, sem merge na main.

## Revisões publicadas

- Backend: `15bbbbaef289f04c3b3d5aa939c19b446eb16e53`.
- Render: `dep-dbisrpff3r2c73bhad30`, confirmado Live.
- Frontend: `e500ca244b191b98d75c77715f1f05488b2712c8`.
- Vercel: `dpl_ChW2P6s5m7iZNEnezxvHdQNe1fUr`, confirmado READY, sem erro de alias.
- Domínio: https://sofakingestofados.com.br/
- Branches de origem: `release/configurador-manual` em ambos os repositórios. A main não foi alterada.

## Backup e migração

O build do backend executou o backup lógico privado e a migração aditiva no ambiente existente, sem revelar credenciais.
Backup `59773aff-039b-48fd-ba67-864ae88e41c9`: 104 produtos, 10 materiais, 1 configuração e 12.251 eventos.
Checksum: `38b6e31f2758013dcc40e1f9b3de01421e74b5d47d3265ad7601121f2d9262d2`.
Cópias no banco privado, com RLS, e no artefato privado do build. É um backup lógico da aplicação, não um snapshot físico de todo o servidor PostgreSQL.

A checagem do endpoint administrativo de download do backup em produção foi bloqueada pela revisão automática por poder acessar dados internos sem autenticação explícita. Essa checagem não foi repetida por outro caminho. Os testes locais cobriram autorização e download; não se afirma que o download administrativo foi validado em produção.

## Conferências em produção

- /api/healthz: HTTP 200 no domínio oficial.
- /api/variation_albums: HTTP 200 e lista vazia, sem importar registros de testes.
- Bundle do frontend publicado contém as integrações /cart/quote e /variation_albums.
- Comparação pública por proxy Vercel preservou os preços dos 104 modelos, álbuns, espumas e condições de pagamento.
- Hash antes/depois: `0c58516c0d9bb024d5369f2eef8fcd630c547434bbb7dba9bb121bd25cb50454`.
- Navegador real: Istambul Retrátil, 1,60 m, espuma D45 selada e tecido Maiorca 01 no álbum Brisas. Valor confirmado no servidor e no carrinho: R$ 5.132,25 à vista e R$ 5.832,10 no cartão, conforme condições oficiais.
- Item de conferência removido; nenhum pedido ou mensagem WhatsApp foi enviado.
- A criação/edição de variações reais e de associações em modelos oficiais ficou para o administrador: nenhum cadastro oficial foi alterado no smoke test.
- Validação anterior ao deploy: 55 testes de backend e 13 de frontend, TypeScript e builds; telas locais em 390 e 1440 px, inclusive remoção de exatamente duas espumas, upload, associações e quantidade de módulos.

## Usar a nova função

Painel → Materiais → Variações: cadastrar o tipo livre e opções com foto e acréscimo.
Na edição do modelo, abrir Opções disponíveis neste modelo e associar somente as opções desejadas.

## Reversão

- Frontend anterior: `dpl_AZVN7ujJiKfDueAJ5ZXeKwU7dBAf`, commit `6e944d2cb58988c3e1913e45c3189e7cd38ef2ce`.
- Backend anterior: `dep-d7vgipe7r5hc7399gvg0`, commit `fe891474fc92027bcb0d242011785bc752f1ec43`.
- Render Auto-Deploy foi desativado para não substituir o commit publicado por uma revisão antiga da main.
- Reverter primeiro o frontend. Reverter o backend, se necessário, com seu artefato anterior. Não apagar as tabelas novas nem restaurar o banco inteiro como primeira ação.
