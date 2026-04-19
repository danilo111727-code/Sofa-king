#!/usr/bin/env bash
set -e

echo "==> Instalando dependências..."
pnpm install --frozen-lockfile=false

echo "==> Construindo o frontend..."
NODE_ENV=production BASE_PATH=/ pnpm --filter @workspace/sofa-king build

echo "==> Construindo o servidor API..."
pnpm --filter @workspace/api-server build

echo "==> Build concluído!"
