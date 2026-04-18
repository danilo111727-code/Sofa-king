#!/usr/bin/env bash
  set -e

  echo "==> Node: $(node --version)"
  echo "==> pnpm: $(pnpm --version 2>/dev/null || echo 'not found')"

  echo "==> Instalando dependências do workspace (backend)..."
  pnpm install --no-frozen-lockfile --filter @workspace/api-server --filter @workspace/api-zod --filter @workspace/db

  echo "==> Instalando dependências do frontend (sofa-king) com npm..."
  cd artifacts/sofa-king
  npm install --legacy-peer-deps
  echo "==> Construindo o frontend..."
  NODE_ENV=production BASE_PATH=/ npx vite build --config vite.config.ts
  cd ../..

  echo "==> Construindo o servidor API..."
  pnpm --filter @workspace/api-server build

  echo "==> Build concluído!"
  