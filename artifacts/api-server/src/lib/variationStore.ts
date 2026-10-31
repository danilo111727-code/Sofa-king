import { randomUUID } from 'node:crypto';
import { getPool } from './db.js';
import { validateVariationAlbum } from './configurator/catalogVariations.mjs';

export function database() {
  const pool = getPool();
  if (!pool) throw Object.assign(new Error('Banco indisponível. Nenhuma alteração foi salva.'), {status:503});
  return pool;
}

export async function listVariations() {
  const result = await database().query('SELECT data FROM sofa_king_private.variation_albums ORDER BY created_at, id');
  return result.rows.map(row => row.data);
}

export async function saveVariation(id: string | null, input: any) {
  // Construct the document; never trust an ID supplied in the JSON body.
  const data = validateVariationAlbum({id:id ?? randomUUID(), name:input?.name,
    active:input?.active !== false, mode:input?.mode, options:input?.options});
  const result = id
    ? await database().query('UPDATE sofa_king_private.variation_albums SET data=$2, updated_at=now() WHERE id=$1 RETURNING data',[id,JSON.stringify(data)])
    : await database().query('INSERT INTO sofa_king_private.variation_albums (id,data) VALUES ($1,$2) RETURNING data',[data.id,JSON.stringify(data)]);
  return result.rows[0]?.data ?? null;
}

export async function deleteVariation(id: string) {
  const result = await database().query('DELETE FROM sofa_king_private.variation_albums WHERE id=$1 RETURNING id',[id]);
  return result.rows.length > 0;
}
