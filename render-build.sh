#!/usr/bin/env bash
  set -e

  echo "==> Node: $(node --version)"

  echo "==> Ativando Corepack e pnpm@10..."
  corepack enable
  corepack prepare pnpm@10 --activate

  echo "==> pnpm: $(pnpm --version)"

  echo "==> Instalando dependências..."
  pnpm install --no-frozen-lockfile

  echo "==> Construindo o frontend (sofa-king)..."
  NODE_ENV=production BASE_PATH=/ pnpm --filter @workspace/sofa-king build

  echo "==> Construindo o servidor API..."
  pnpm --filter @workspace/api-server build

  echo "==> Build concluído!"
  