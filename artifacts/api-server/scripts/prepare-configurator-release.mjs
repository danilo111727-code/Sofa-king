import pg from 'pg';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {prepareRelease} from '../src/lib/configurator/releaseBackup.mjs';
if(process.env.CONFIGURATOR_MIGRATE!=='1'||!process.env.DATABASE_URL)throw new Error('Preparação exige CONFIGURATOR_MIGRATE=1 e o ambiente existente do serviço.');
const client=new pg.Client({connectionString:process.env.DATABASE_URL,ssl:process.env.NODE_ENV==='production'?{rejectUnauthorized:false}:false});
try {
  await client.connect();
  const result=await prepareRelease(client,readFileSync(new URL('./configurator-schema.sql',import.meta.url),'utf8'),fileURLToPath(new URL('../release-backups/before-configurador.json.gz',import.meta.url)));
  console.log('CONFIGURATOR_RELEASE_PREPARED '+JSON.stringify(result));
} finally {await client.end();}
