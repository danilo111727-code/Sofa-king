#!/usr/bin/env bash
  set -e

  echo "==> Instalando dependências com pnpm..."
  pnpm install --frozen-lockfile=false

  echo "==> Construindo o servidor API..."
  pnpm --filter @workspace/api-server build

  echo "==> Build do backend concluído!"
  