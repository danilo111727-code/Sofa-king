#!/usr/bin/env bash
  set -e

  echo "==> Node: $(node --version)"
  echo "==> npm: $(npm --version)"

  # Use npx to invoke pnpm 10.26.1 directly (avoids global install / Corepack issues)
  PNPM="npx --yes pnpm@10.26.1"

  echo "==> Instalando dependências com pnpm@10.26.1..."
  $PNPM install --no-frozen-lockfile

  echo "==> Construindo o frontend (sofa-king)..."
  NODE_ENV=production BASE_PATH=/ $PNPM --filter @workspace/sofa-king build

  echo "==> Construindo o servidor API..."
  $PNPM --filter @workspace/api-server build

  echo "==> Build concluído!"
  