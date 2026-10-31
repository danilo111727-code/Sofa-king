import pg from 'pg';
import { readFileSync } from 'node:fs';
if (process.env.CONFIGURATOR_MIGRATE !== '1' || !process.env.DATABASE_URL) {
  throw new Error('Execute explicitamente com CONFIGURATOR_MIGRATE=1 e DATABASE_URL do ambiente escolhido.');
}
const client = new pg.Client({connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV === 'production' ? {rejectUnauthorized:false} : false});
try {
  await client.connect();
  await client.query(readFileSync(new URL('./configurator-schema.sql', import.meta.url),'utf8'));
  console.log('Estrutura do configurador pronta. Nenhum catálogo ou preço foi importado.');
} finally { await client.end(); }
