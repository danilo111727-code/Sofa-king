#!/usr/bin/env bash
  set -e

  echo "==> Node: $(node --version)"
  echo "==> pnpm: $(pnpm --version)"

  echo "==> Instalando dependências do backend..."
  pnpm install --no-frozen-lockfile

  echo "==> Construindo o servidor API..."
  pnpm --filter @workspace/api-server build

  echo "==> Build concluído!"
  