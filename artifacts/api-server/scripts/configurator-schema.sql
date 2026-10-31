-- Additive only. No import, seed, price update or change to existing tables.
BEGIN;
SELECT pg_advisory_xact_lock(741032901);
CREATE SCHEMA IF NOT EXISTS sofa_king_private;
REVOKE ALL ON SCHEMA sofa_king_private FROM PUBLIC;
CREATE TABLE IF NOT EXISTS sofa_king_private.variation_albums (
  id text PRIMARY KEY,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE sofa_king_private.variation_albums ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON sofa_king_private.variation_albums FROM PUBLIC;
COMMIT;
