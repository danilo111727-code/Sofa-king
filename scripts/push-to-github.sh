#!/bin/bash
# Envia arquivos modificados para o GitHub via API
# Uso: bash scripts/push-to-github.sh "mensagem do commit" arquivo1 arquivo2 ...

set -e

REPO="danilo111727-code/Sofa-king"
BRANCH="main"
COMMIT_MSG="${1:-"Atualização via Replit"}"
shift

if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ GITHUB_TOKEN não definido"
  exit 1
fi

if [ "$#" -eq 0 ]; then
  echo "❌ Informe pelo menos um arquivo"
  exit 1
fi

echo "📦 Enviando para GitHub: $REPO ($BRANCH)"
echo "📝 Commit: $COMMIT_MSG"

for FILE in "$@"; do
  if [ ! -f "$FILE" ]; then
    echo "⚠️  Arquivo não encontrado: $FILE"
    continue
  fi

  CONTENT=$(base64 -w 0 "$FILE")
  
  # Pega o SHA atual do arquivo (se já existe no repo)
  SHA=$(curl -s \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/$REPO/contents/$FILE?ref=$BRANCH" \
    | node -e "const d=[];process.stdin.on('data',c=>d.push(c));process.stdin.on('end',()=>{try{const r=JSON.parse(Buffer.concat(d));console.log(r.sha||'')}catch{console.log('')}})")

  # Monta o payload
  if [ -n "$SHA" ]; then
    PAYLOAD="{\"message\":\"$COMMIT_MSG\",\"content\":\"$CONTENT\",\"sha\":\"$SHA\",\"branch\":\"$BRANCH\"}"
  else
    PAYLOAD="{\"message\":\"$COMMIT_MSG\",\"content\":\"$CONTENT\",\"branch\":\"$BRANCH\"}"
  fi

  RESULT=$(curl -s -X PUT \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    "https://api.github.com/repos/$REPO/contents/$FILE")

  STATUS=$(echo "$RESULT" | node -e "const d=[];process.stdin.on('data',c=>d.push(c));process.stdin.on('end',()=>{try{const r=JSON.parse(Buffer.concat(d));console.log(r.content?'ok':r.message||'erro')}catch{console.log('erro')}})")

  if [ "$STATUS" = "ok" ]; then
    echo "✅ $FILE"
  else
    echo "❌ $FILE — $STATUS"
  fi
done

echo ""
echo "🎉 Pronto! Acesse o Replit original e clique em 'Pull' para atualizar o site."
