import { database } from './variationStore.js';

// Read one consistent, fresh database snapshot. Never approve a price from fallback JSON/cache.
export async function catalogSnapshot() {
  const client = await database().connect();
  try {
    await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const products = await client.query('SELECT data FROM products ORDER BY created_at');
    const materials = await client.query('SELECT data FROM materials ORDER BY created_at');
    const variations = await client.query('SELECT data FROM sofa_king_private.variation_albums ORDER BY created_at');
    const settings = await client.query("SELECT value FROM site_settings WHERE key='main'");
    if (!settings.rows[0]) throw Object.assign(new Error('Configurações indisponíveis. Tente novamente.'),{status:503});
    await client.query('COMMIT');
    return {
      products:products.rows.map(r => r.data),
      albums:materials.rows.filter(r => r.data._type === 'album').map(r => r.data),
      foams:materials.rows.filter(r => r.data._type === 'espuma').map(r => r.data),
      variations:variations.rows.map(r => r.data), settings:settings.rows[0].value,
    };
  } catch(error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
