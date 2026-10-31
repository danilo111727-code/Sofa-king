import {quote} from './validation.mjs';
import {resolveCatalogVariations} from './catalogVariations.mjs';
const invalid = message => { throw Object.assign(new Error(message), {status:400}); };
const round = value => Math.round(value * 100) / 100;

function deliveryLabel(rule, days) {
  if (!rule) return days > 0 ? `Prazo: ${days} dias úteis` : null;
  if (rule.mode === 'hidden') return null;
  if (rule.mode === 'consult') return rule.customText?.trim() || 'Prazo sob consulta';
  return `Prazo: ${rule.days} dias úteis`;
}

// Input contains identifiers only. All names, images and money come from the catalog.
export function quoteCart(input, catalog) {
  if (!Array.isArray(input?.items) || !input.items.length || input.items.length > 99) invalid('Confira os itens do carrinho.');
  const settings = catalog.settings;
  if (!Number.isFinite(settings.pixDiscountPct) || settings.pixDiscountPct < 0 || settings.pixDiscountPct >= 100 ||
      !Number.isInteger(settings.maxInstallments) || settings.maxInstallments < 1) invalid('Condições de pagamento indisponíveis.');
  const ids = new Set();
  const items = input.items.map(item => {
    if (!item || typeof item.id !== 'string' || !item.id || ids.has(item.id) || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 99) invalid('Quantidade ou item inválido.');
    ids.add(item.id);
    const product = catalog.products.find(p => p.id === item.productId);
    if (!product || product.disponibilidade === false) invalid('Um modelo não está mais disponível. Remova-o do carrinho.');
    const result = quote(product,catalog.albums,catalog.foams,item,catalog.variations);
    const album = catalog.albums.find(a => a.id === item.albumId);
    const fabric = album?.fabrics.find(f => f.id === item.fabricId);
    const foam = catalog.foams.find(f => f.id === item.foamId);
    const groups = resolveCatalogVariations(product.configuration,catalog.variations);
    return {
      id:item.id, productId:product.id, productName:product.name, productImage:product.images?.[0] || product.image,
      size:{label:item.sizeLabel,basePrice:result.basePrice},
      album:album ? {id:album.id,name:album.name,surcharge:result.albumSurcharge} : null,
      fabric:fabric ? {id:fabric.id,name:fabric.name,imageUrl:fabric.imageUrl} : null,
      foam:foam ? {id:foam.id,name:foam.name,priceAdjustment:result.foamAdjustment} : null,
      configurationSelections:result.selections,
      variations:result.selections.filter(s => s.quantity > 0).map(s => {
        const group = groups.find(g => g.id === s.groupId);
        const option = group.options.find(o => o.id === s.optionId);
        return {groupName:group.name,optionName:option.name,quantity:s.quantity,priceAdjustment:option.priceAdjustment};
      }),
      delivery:deliveryLabel(product.configuration?.delivery,settings.prazoEntregaDias),
      unitPrice:result.total, qty:item.qty,
    };
  });
  const subtotal = round(items.reduce((total,item) => total + item.unitPrice * item.qty,0));
  const cardTotal = round(subtotal / (1 - settings.pixDiscountPct/100));
  return {items,subtotal,cardTotal,maxInstallments:settings.maxInstallments,pixDiscountPct:settings.pixDiscountPct};
}
