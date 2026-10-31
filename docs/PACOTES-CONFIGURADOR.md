# Pacotes do configurador — entrega para deploy manual

Os quatro pacotes estão preparados em conjunto na branch `release/configurador-manual` de cada repositório. Não são publicações independentes. A ordem operacional é migração aditiva → backend → verificação → frontend.

| Pacote | Conteúdo | Validação |
| --- | --- | --- |
| 1 — Integração e salvamento | Tipos livres de variações em Materiais, opções com foto e acréscimo, escolha única ou por quantidade, associação por modelo, tecidos e espumas permitidos e prazo herdado/específico/oculto. Salvamento definitivo junto do produto na API oficial existente. | CRUD, recarga do banco, remoção de exatamente duas espumas e persistência de associações; foto enviada pelo formulário; módulos por quantidade. |
| 2 — Segurança e preços | Clerk verificado, diagnósticos protegidos, erros de banco sem falso sucesso, gravações concorrentes serializadas. Preço calculado no servidor ao adicionar e ao fechar o carrinho; mudança exige revisão. | Requisição sem login, JWT forjado e cliente comum bloqueados; falhas em criar/editar/excluir preservam o cache; cotação rejeita escolhas inválidas e usa preço atual. |
| 3 — Compatibilidade | Base na main atual, mantendo visual e navegação aprovados. Rotas existentes preservadas. Produção usa API oficial e carrinho antigo; preview tem armazenamento separado. Dependências e builds reproduzíveis. | Início, catálogo, menu e CSS sem diferença em relação à main base; rota de clientes preservada; 104 modelos oficiais e 33.516 combinações sem divergência do cálculo anterior. |
| 4 — Testes e publicação manual | Testes automatizados, harness local de navegador, checklist, backup, migração aditiva, publicação em ordem e reversão. | 52 testes de backend e 13 de frontend; TypeScript/build; navegador em 390 e 1440 px sem erro JS ou transbordamento horizontal nos cenários conferidos. |

Nenhum merge, deploy ou mudança de dados oficiais foi executado. Não é necessário copiar os dados ou as imagens do Supabase de testes. O banco oficial recebe somente a estrutura nova quando você executar a migração manual.

Siga [DEPLOY-CONFIGURADOR.md](DEPLOY-CONFIGURADOR.md) para a publicação. Backup completo do banco, configuração da conta de hospedagem e smoke test nas URLs oficiais são etapas da sua execução manual; não estão marcados como já feitos.
