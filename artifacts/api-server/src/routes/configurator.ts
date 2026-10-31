import {Router} from 'express';
import {requireAdmin} from '../lib/adminAuth.js';
import {listVariations,saveVariation,deleteVariation} from '../lib/variationStore.js';
import {catalogSnapshot} from '../lib/configuratorSnapshot.js';
import {quote} from '../lib/configurator/validation.mjs';
import {quoteCart} from '../lib/configurator/cartQuote.mjs';

const router = Router();
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
