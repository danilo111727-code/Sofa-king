import {test} from 'node:test';
import assert from 'node:assert/strict';
import {quoteCart} from '../src/lib/configurator/cartQuote.mjs';
const catalog = {
  products:[{id:'p',name:'Modelo',disponibilidade:true,sizes:[{label:'2 m',basePrice:1000}],
    configuration:{catalogVariations:{arms:{enabled:true,required:true,optionIds:['wide']}}}}],
  albums:[],foams:[],variations:[{id:'arms',name:'Braços',active:true,mode:'single',options:[{id:'wide',name:'Largo',priceAdjustment:150}]}],
  settings:{pixDiscountPct:10,maxInstallments:10,prazoEntregaDias:20},
};
const item = {id:'cart1',productId:'p',sizeLabel:'2 m',qty:2,selections:[{groupId:'catalog:arms',optionId:'wide',quantity:1}]};
test('checkout uses catalog prices and ignores forged totals and names',() => {
  const result = quoteCart({items:[{...item,unitPrice:1,productName:'Forged'}],subtotal:1},catalog);
  assert.equal(result.subtotal,2300); assert.equal(result.cardTotal,2555.56);
  assert.equal(result.items[0].productName,'Modelo'); assert.equal(result.items[0].variations[0].optionName,'Largo');
  assert.equal(result.items[0].delivery,'Prazo: 20 dias úteis');
});
test('global price changes propagate at checkout without re-saving models',() => {
  const updated=structuredClone(catalog); updated.variations[0].options[0].priceAdjustment=300;
  assert.equal(quoteCart({items:[item]},updated).subtotal,2600);
});
test('inactive required group blocks checkout rather than removing its charge',() => {
  const updated=structuredClone(catalog);updated.variations[0].active=false;
  assert.throws(()=>quoteCart({items:[item]},updated),/obrigatória/);
});
test('unavailable product blocks checkout',() => {
  const updated=structuredClone(catalog);updated.products[0].disponibilidade=false;
  assert.throws(()=>quoteCart({items:[item]},updated),/disponível/);
});
for (const qty of [0,-1,100,1.5,'2']) test(`reject checkout quantity ${qty}`,()=>assert.throws(()=>quoteCart({items:[{...item,qty}]},catalog)));
test('duplicate cart IDs rejected',()=>assert.throws(()=>quoteCart({items:[item,item]},catalog)));
test('missing required choice rejected',()=>assert.throws(()=>quoteCart({items:[{...item,selections:[]}]},catalog)));
test('current payment settings used',()=>{
  const updated=structuredClone(catalog);updated.settings.pixDiscountPct=20;updated.settings.maxInstallments=6;
  const result=quoteCart({items:[item]},updated);assert.equal(result.cardTotal,2875);assert.equal(result.maxInstallments,6);
});
test('invalid payment settings cannot fall back to a guessed price',()=>{
  const updated=structuredClone(catalog);updated.settings.pixDiscountPct=100;
  assert.throws(()=>quoteCart({items:[item]},updated));
});
test('legacy product without configuration keeps existing price and materials',()=>{
  const updated=structuredClone(catalog);delete updated.products[0].configuration;
  assert.equal(quoteCart({items:[{...item,selections:[]}]},updated).subtotal,2000);
});
test('malformed selection fails as validation error',()=>{
  assert.throws(()=>quoteCart({items:[{...item,selections:[null]}]},catalog),err=>err.status===400);
});
