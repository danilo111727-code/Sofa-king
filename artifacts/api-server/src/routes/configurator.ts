import {Router} from 'express';
import {requireAdmin} from '../lib/adminAuth.js';
import {listVariations,saveVariation,deleteVariation,database} from '../lib/variationStore.js';
import {catalogSnapshot} from '../lib/configuratorSnapshot.js';
import {quote} from '../lib/configurator/validation.mjs';
import {quoteCart} from '../lib/configurator/cartQuote.mjs';

import {encodeBackup} from '../lib/configurator/releaseBackup.mjs';

const router = Router();
router.get('/admin/configurator-backup/latest',requireAdmin,async (_req,res) => {
  const result=await database().query('SELECT id,payload,checksum FROM sofa_king_private.release_backups ORDER BY created_at DESC LIMIT 1');
  const row=result.rows[0];
  if(!row){res.status(404).json({error:'Backup não encontrado.'});return;}
  const encoded=encodeBackup(row.payload);
  if(encoded.checksum!==row.checksum)throw new Error('Falha na verificação do backup.');
  res.set('Cache-Control','no-store').set('Content-Type','application/gzip').set('Content-Disposition',`attachment; filename="sofa-king-before-configurador-${row.id}.json.gz"`).send(encoded.buffer);
});
router.get('/variation_albums',async (_req,res) => {
  const albums = await listVariations();
  res.json(albums.filter(a => a.active).map(a => ({...a,options:a.options.filter((o: any) => o.active !== false)})));
});
router.get('/admin/variation_albums',requireAdmin,async (_req,res) => res.json(await listVariations()));
router.post('/admin/variation_albums',requireAdmin,async (req,res) => res.status(201).json(await saveVariation(null,req.body)));
router.put('/admin/variation_albums/:id',requireAdmin,async (req,res) => {
  const album = await saveVariation(String(req.params.id),req.body);
  if (!album) { res.status(404).json({error:'Variação não encontrada.'}); return; }
  res.json(album);
});
router.delete('/admin/variation_albums/:id',requireAdmin,async (req,res) => {
  if (!await deleteVariation(String(req.params.id))) { res.status(404).json({error:'Variação não encontrada.'}); return; }
  res.json({success:true});
});
router.post('/products/:id/quote',async (req,res) => {
  const catalog = await catalogSnapshot();
  const product = catalog.products.find(p => p.id === String(req.params.id) && p.disponibilidade !== false);
  if (!product) { res.status(404).json({error:'Modelo indisponível.'}); return; }
  res.json(quote(product,catalog.albums,catalog.foams,req.body,catalog.variations));
});
router.post('/cart/quote',async (req,res) => res.json(quoteCart(req.body,await catalogSnapshot())));
export default router;
