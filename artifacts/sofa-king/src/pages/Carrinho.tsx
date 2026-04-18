import { useState, useMemo } from "react";
  import { Link } from "wouter";
  import { ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";
  import { Navbar } from "@/components/layout/Navbar";
  import { Footer } from "@/components/layout/Footer";
  import { Button } from "@/components/ui/button";
  import { Separator } from "@/components/ui/separator";
  import { useCart } from "@/contexts/CartContext";
  import { useSiteSettings } from "@/contexts/SiteSettingsContext";

  const WHATSAPP_NUMBER = "5575991495793";

  function formatCurrency(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function trackWhatsApp() {
    fetch("/api/events/whatsapp", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).catch(() => {});
  }

  export default function Carrinho() {
    const { items, subtotal, setQty, remove, clear } = useCart();
    const { pixDiscountPct, maxInstallments } = useSiteSettings();
    const [paymentMethod, setPaymentMethod] = useState<"pix" | "cartao">("pix");
    const [notes, setNotes] = useState("");

    const pixPrice = useMemo(() => subtotal * (1 - pixDiscountPct / 100), [subtotal, pixDiscountPct]);
    const installmentAmount = useMemo(() => subtotal / maxInstallments, [subtotal, maxInstallments]);
    const total = paymentMethod === "pix" ? pixPrice : subtotal;
    const isEmpty = items.length === 0;

    const paymentOptions = [
      { id: "pix", label: `PIX à vista — ${pixDiscountPct}% OFF`, description: "Pagamento instantâneo via QR Code, combinado diretamente pelo WhatsApp.", icon: "⚡" },
      { id: "cartao", label: `Cartão de crédito em até ${maxInstallments}x`, description: "Parcelado no cartão, combinado diretamente pelo WhatsApp.", icon: "💳" },
    ] as const;

    function handleWhatsAppCheckout() {
      trackWhatsApp();
      const lines: string[] = [];
      lines.push("Olá! Gostaria de fechar o pedido abaixo 👇\n");
      items.forEach((item, idx) => {
        lines.push(`*Item ${idx + 1}* — ${item.productName}`);
        lines.push(`• Metragem: ${item.size.label} (${formatCurrency(item.size.basePrice)})`);
        if (item.album) lines.push(`• Álbum: ${item.album.name}${item.fabric ? ` — ${item.fabric.name}` : ""}${item.album.surcharge !== 0 ? ` (${item.album.surcharge > 0 ? "+" : ""}${formatCurrency(item.album.surcharge)})` : ""}`);
        if (item.foam) lines.push(`• Espuma: ${item.foam.name}${item.foam.priceAdjustment !== 0 ? ` (${item.foam.priceAdjustment > 0 ? "+" : ""}${formatCurrency(item.foam.priceAdjustment)})` : ""}`);
        lines.push(`• Quantidade: ${item.qty}`);
        lines.push(`• Subtotal: ${formatCurrency(item.unitPrice * item.qty)}`);
        lines.push("");
      });
      lines.push(`*Subtotal: ${formatCurrency(subtotal)}*`);
      lines.push("");
      const selectedMethod = paymentOptions.find(p => p.id === paymentMethod)!.label;
      lines.push(`*Forma de pagamento:* ${selectedMethod}`);
      if (paymentMethod === "pix") {
        lines.push(`  Desconto PIX (${pixDiscountPct}%): -${formatCurrency(subtotal - pixPrice)}`);
        lines.push(`  *Total à vista no PIX: ${formatCurrency(pixPrice)}*`);
      } else {
        lines.push(`  Em ${maxInstallments}x de aprox. ${formatCurrency(installmentAmount)} (a combinar)`);
        lines.push(`  *Total: ${formatCurrency(subtotal)}*`);
      }
      if (notes.trim()) { lines.push(""); lines.push(`*Observações:* ${notes.trim()}`); }
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
      window.open(url, "_blank");
    }

    return (
      <div className="min-h-screen flex flex-col w-full bg-background">
        <Navbar />
        <div className="py-3 px-4 sm:px-6 lg:px-8 border-b border-border/40 bg-secondary/20">
          <Link href="/">
            <button className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Continuar comprando
            </button>
          </Link>
        </div>
        <main className="flex-grow pb-24 sm:pb-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 max-w-5xl">
            <h1 className="text-3xl md:text-4xl font-serif font-bold mb-8 flex items-center gap-3">
              <ShoppingCart className="w-7 h-7 text-primary" /> Seu carrinho
            </h1>
            {isEmpty ? (
              <div className="text-center py-20 border border-dashed border-border rounded-xl">
                <p className="text-muted-foreground mb-6">Seu carrinho está vazio.</p>
                <Button asChild><Link href="/">Ver modelos</Link></Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  {items.map(item => (
                    <div key={item.id} className="border border-border rounded-xl p-4 flex gap-4" data-testid={`cart-item-${item.productId}`}>
                      <img src={item.productImage} alt={item.productName} className="w-24 h-24 rounded-lg object-cover bg-secondary flex-shrink-0"
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground truncate">{item.productName}</h3>
                            <p className="text-xs text-muted-foreground mt-1">Metragem: <strong>{item.size.label}</strong></p>
                            {item.album && <p className="text-xs text-muted-foreground">Álbum: <strong>{item.album.name}{item.fabric ? ` — ${item.fabric.name}` : ""}</strong></p>}
                            {item.foam && <p className="text-xs text-muted-foreground">Espuma: <strong>{item.foam.name}</strong></p>}
                          </div>
                          <button onClick={() => remove(item.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1"
                            aria-label="Remover item" data-testid={`button-remove-${item.productId}`}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                          <div className="flex items-center border border-border rounded-md">
                            <button onClick={() => setQty(item.id, item.qty - 1)} className="p-2 hover:bg-secondary transition-colors" aria-label="Diminuir" data-testid={`button-qty-minus-${item.productId}`}>
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-3 text-sm font-medium w-8 text-center" data-testid={`text-qty-${item.productId}`}>{item.qty}</span>
                            <button onClick={() => setQty(item.id, item.qty + 1)} className="p-2 hover:bg-secondary transition-colors" aria-label="Aumentar" data-testid={`button-qty-plus-${item.productId}`}>
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice)} × {item.qty}</p>
                            <p className="font-semibold text-accent">{formatCurrency(item.unitPrice * item.qty)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={clear} className="text-xs text-muted-foreground hover:text-destructive transition-colors underline" data-testid="button-clear-cart">
                    Esvaziar carrinho
                  </button>
                </div>
                <aside className="lg:col-span-1">
                  <div className="border border-border rounded-xl p-5 sticky top-24 bg-secondary/10">
                    <h2 className="font-semibold text-lg mb-4">Resumo</h2>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Itens</span>
                      <span>{items.reduce((acc, i) => acc + i.qty, 0)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <Separator className="my-4" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 text-foreground">Forma de pagamento</h3>
                    <div className="space-y-2 mb-4">
                      {paymentOptions.map(option => (
                        <button key={option.id} onClick={() => setPaymentMethod(option.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${paymentMethod === option.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/50"}`}
                          data-testid={`button-payment-${option.id}`}>
                          <div className="flex items-start gap-2">
                            <span className="text-lg leading-none mt-0.5">{option.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-foreground">{option.label}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{option.description}</p>
                              {option.id === "pix" && paymentMethod === "pix" && subtotal > 0 && (
                                <p className="text-xs text-green-700 font-medium mt-1" data-testid="text-pix-savings">Você economiza {formatCurrency(subtotal - pixPrice)}</p>
                              )}
                              {option.id === "cartao" && paymentMethod === "cartao" && subtotal > 0 && (
                                <p className="text-xs text-accent font-medium mt-1">~{formatCurrency(installmentAmount)} / mês em {maxInstallments}x</p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 text-foreground">Observações (opcional)</h3>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                      placeholder="Ex.: endereço, CEP, prazo desejado..."
                      className="w-full text-sm rounded-md border border-border bg-background px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                      data-testid="input-notes" />
                    <Separator className="my-4" />
                    <div className="mb-4">
                      <div className="flex justify-between items-baseline">
                        <span className="font-semibold">Total</span>
                        <span className="text-2xl font-bold text-accent" data-testid="text-cart-total">{formatCurrency(total)}</span>
                      </div>
                      {paymentMethod === "pix" && subtotal > 0 && (
                        <p className="text-xs text-muted-foreground text-right mt-1">
                          <span className="line-through">{formatCurrency(subtotal)}</span> · {pixDiscountPct}% OFF à vista
                        </p>
                      )}
                      {paymentMethod === "cartao" && subtotal > 0 && (
                        <p className="text-xs text-muted-foreground text-right mt-1">ou {maxInstallments}x de {formatCurrency(installmentAmount)} sem juros</p>
                      )}
                    </div>
                    <Button size="lg" className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg"
                      onClick={handleWhatsAppCheckout} data-testid="button-whatsapp-checkout">
                      Solicitar contato no WhatsApp
                    </Button>
                    <p className="text-[11px] text-muted-foreground text-center mt-2 leading-snug">
                      Você será direcionado para o WhatsApp com o resumo do seu pedido para fecharmos juntos.
                    </p>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  