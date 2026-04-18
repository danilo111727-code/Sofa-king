#!/usr/bin/env bash
  set -e

  echo "==> Node version: $(node --version)"
  echo "==> NPM version: $(npm --version)"

  echo "==> Instalando pnpm..."
  npm install -g pnpm@10

  echo "==> pnpm version: $(pnpm --version)"

  echo "==> Instalando dependências..."
  pnpm install --no-frozen-lockfile

  echo "==> Listando pacotes do workspace..."
  pnpm list -r --depth 0 || true

  echo "==> Construindo o frontend..."
  NODE_ENV=production BASE_PATH=/ pnpm --filter @workspace/sofa-king build

  echo "==> Construindo o servidor API..."
  pnpm --filter @workspace/api-server build

  echo "==> Build concluído!"
  