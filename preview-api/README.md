# Sofa King — ambiente exclusivo de homologação

Frontend: branch `preview` em `sofa-king-frontend`. API: branch `preview-configurador` em `Sofa-king`. Nenhum merge em `main` é necessário.

- API e acesso com recarga de rotas: https://sofa-king-api-preview.onrender.com
- Assets do frontend: https://sofa-king-configurador-preview.onrender.com
- Supabase permitido: `lcmtaxesbctibpyggbuj`, esquema privado `preview_private`.
- Persistência: `documents`, `product_drafts` e `product_configurations`; produto e configuração são gravados na mesma transação.
- Nenhuma credencial Supabase privilegiada é enviada ao frontend ou ao Render. O gateway Edge usa a credencial interna e só aceita requisições assinadas pelo serviço de testes.
- `PREVIEW_SIGNING_KEY` é segredo de runtime do serviço de testes. Sua chave pública correspondente está em `gateway.ts`. Não versionar a chave privada.
- `DATABASE_URL` é recusada pelo serviço. Um `SUPABASE_URL` diferente do projeto de teste também impede a inicialização.

A autenticação normal verifica a assinatura, expiração e emissor do JWT Clerk. A autorização administrativa atual é consultada por **GET** no endpoint de identidade existente (`/api/admin/me`); nenhuma rota de gravação da produção é chamada. Este compartilhamento de identidade evita copiar credenciais administrativas. O login real precisa ser validado com a conta do proprietário.

`PREVIEW_AUTOMATION_TOKEN` serve somente aos testes automatizados temporários e deve permanecer vazio fora dessas execuções. Ele nunca é incluído no código do navegador.

O código canônico desta API está em `danilo111727-code/Sofa-king`, branch `preview-configurador`, diretório `preview-api`. O serviço usa somente essa branch de testes.

## Verificação

```sh
node --check preview-api/server.mjs
node --test preview-api/validation.test.mjs
```

`GET /api/readyz` confirma leitura no Supabase de testes. O gateway de frontend suporta abertura e recarga de `/produto/:id`, `/admin` e `/carrinho`.

O produto `[TESTE] Configurador Sofa King` usa valores fictícios e permite validar braços, pés, quantidades, tecido, espuma e prazo sem editar os produtos de referência.
