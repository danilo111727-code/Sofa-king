import { Link } from "wouter";
import { ArrowLeft, Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import { useState, useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { trackWhatsapp } from "@/lib/api";
import { applyPixDiscount, PIX_DISCOUNT_PCT, MAX_INSTALLMENTS } from "@/lib/categories";

const WHATSAPP = "5575991495793";

function brl(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Payment = "pix" | "cartao";

interface PaymentOption {
  id: Payment;
  label: string;
  description: string;
  icon: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: "pix",
    label: `PIX à vista — ${PIX_DISCOUNT_PCT}% OFF`,
    description: "Pagamento instantâneo via QR Code, combinado diretamente pelo WhatsApp.",
    icon: "⚡",
  },
  {
    id: "cartao",
    label: `Cartão de crédito em até ${MAX_INSTALLMENTS}x`,
    description: "Parcelado no cartão, combinado diretamente pelo WhatsApp.",
    icon: "💳",
  },
];

export default function Carrinho() {
  const { items, subtotal, setQty, remove, clear } = useCart();
  const [payment, setPayment] = useState<Payment>("pix");
  const [notes, setNotes] = useState("");

  const empty = items.length === 0;
  const pixTotal = useMemo(() => applyPixDiscount(subtotal), [subtotal]);
  const installment = useMemo(() => subtotal / MAX_INSTALLMENTS, [subtotal]);
  const finalTotal = payment === "pix" ? pixTotal : subtotal;

  function handleSend() {
    trackWhatsapp({});
    const lines: string[] = [];
    lines.push("Olá! Gostaria de fechar o pedido abaixo 👇\n");
    items.forEach((it, idx) => {
      lines.push(`*Item ${idx + 1}* — ${it.productName}`);
      lines.push(`• Metragem: ${it.size.label} (${brl(it.size.basePrice)})`);
      if (it.album) {
        lines.push(
          `• Álbum: ${it.album.name}${it.fabric ? ` — ${it.fabric.name}` : ""}` +
            (it.album.surcharge !== 0 ? ` (${it.album.surcharge > 0 ? "+" : ""}${brl(it.album.surcharge)})` : ""),
        );
      }
      if (it.foam) {
        lines.push(
          `• Espuma: ${it.foam.name}` +
            (it.foam.priceAdjustment !== 0 ? ` (${it.foam.priceAdjustment > 0 ? "+" : ""}${brl(it.foam.priceAdjustment)})` : ""),
        );
      }
      lines.push(`• Quantidade: ${it.qty}`);
      lines.push(`• Subtotal: ${brl(it.unitPrice * it.qty)}`);
      lines.push("");
    });
    lines.push(`*Subtotal: ${brl(subtotal)}*`);
    lines.push("");
    const paymentLabel = PAYMENT_OPTIONS.find((p) => p.id === payment)!.label;
    lines.push(`*Forma de pagamento:* ${paymentLabel}`);
    if (payment === "pix") {
      lines.push(`  Desconto PIX (${PIX_DISCOUNT_PCT}%): -${brl(subtotal - pixTotal)}`);
      lines.push(`  *Total à vista no PIX: ${brl(pixTotal)}*`);
    } else {
      lines.push(`  Em ${MAX_INSTALLMENTS}x de aprox. ${brl(installment)} (a combinar)`);
      lines.push(`  *Total: ${brl(subtotal)}*`);
    }
    if (notes.trim()) {
      lines.push("");
      lines.push(`*Observações:* ${notes.trim()}`);
    }
    const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank");
  }

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <Navbar />

      <main className="flex-grow pb-24 sm:pb-12">
        <div className="bg-secondary/30 py-4 border-b border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1 text-sm text-muted-foreground">
              <ArrowLeft className="w-3 h-3" /> Continuar comprando
            </Link>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 max-w-5xl">
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-8 flex items-center gap-3">
            <ShoppingBag className="w-7 h-7 text-primary" /> Seu carrinho
          </h1>

          {empty ? (
            <div className="text-center py-20 border border-dashed border-border rounded-xl">
              <p className="text-muted-foreground mb-6">Seu carrinho está vazio.</p>
              <Button asChild><Link href="/">Ver modelos</Link></Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Items */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((it) => (
                  <div key={it.id} className="border border-border rounded-xl p-4 flex gap-4" data-testid={`cart-item-${it.productId}`}>
                    <img
                      src={it.productImage}
                      alt={it.productName}
                      className="w-24 h-24 rounded-lg object-cover bg-secondary flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{it.productName}</h3>
                          <p className="text-xs text-muted-foreground mt-1">Metragem: <strong>{it.size.label}</strong></p>
                          {it.album && (
                            <p className="text-xs text-muted-foreground">
                              Álbum: <strong>{it.album.name}</strong>{it.fabric ? ` — ${it.fabric.name}` : ""}
                            </p>
                          )}
                          {it.foam && (
                            <p className="text-xs text-muted-foreground">Espuma: <strong>{it.foam.name}</strong></p>
                          )}
                        </div>
                        <button
                          onClick={() => remove(it.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          aria-label="Remover item"
                          data-testid={`button-remove-${it.productId}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                        <div className="flex items-center border border-border rounded-md">
                          <button
                            onClick={() => setQty(it.id, it.qty - 1)}
                            className="p-2 hover:bg-secondary transition-colors"
                            aria-label="Diminuir"
                            data-testid={`button-qty-minus-${it.productId}`}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-3 text-sm font-medium w-8 text-center" data-testid={`text-qty-${it.productId}`}>{it.qty}</span>
                          <button
                            onClick={() => setQty(it.id, it.qty + 1)}
                            className="p-2 hover:bg-secondary transition-colors"
                            aria-label="Aumentar"
                            data-testid={`button-qty-plus-${it.productId}`}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{brl(it.unitPrice)} × {it.qty}</p>
                          <p className="font-semibold text-accent">{brl(it.unitPrice * it.qty)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={clear}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors underline"
                  data-testid="button-clear-cart"
                >
                  Esvaziar carrinho
                </button>
              </div>

              {/* Sidebar */}
              <aside className="lg:col-span-1">
                <div className="border border-border rounded-xl p-5 sticky top-24 bg-secondary/10">
                  <h2 className="font-semibold text-lg mb-4">Resumo</h2>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Itens</span>
                    <span>{items.reduce((n, i) => n + i.qty, 0)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{brl(subtotal)}</span>
                  </div>

                  <Separator className="my-4" />

                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 text-foreground">
                    Forma de pagamento
                  </h3>
                  <div className="space-y-2 mb-4">
                    {PAYMENT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setPayment(opt.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          payment === opt.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                        data-testid={`button-payment-${opt.id}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg leading-none mt-0.5">{opt.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground">{opt.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{opt.description}</p>
                            {opt.id === "pix" && payment === "pix" && subtotal > 0 && (
                              <p className="text-xs text-green-700 font-medium mt-1" data-testid="text-pix-savings">
                                Você economiza {brl(subtotal - pixTotal)}
                              </p>
                            )}
                            {opt.id === "cartao" && payment === "cartao" && subtotal > 0 && (
                              <p className="text-xs text-accent font-medium mt-1">
                                ~{brl(installment)} / mês em {MAX_INSTALLMENTS}x
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 text-foreground">
                    Observações (opcional)
                  </h3>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Ex.: endereço, CEP, prazo desejado..."
                    className="w-full text-sm rounded-md border border-border bg-background px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    data-testid="input-notes"
                  />

                  <Separator className="my-4" />

                  <div className="mb-4">
                    <div className="flex justify-between items-baseline">
                      <span className="font-semibold">Total</span>
                      <span className="text-2xl font-bold text-accent" data-testid="text-cart-total">{brl(finalTotal)}</span>
                    </div>
                    {payment === "pix" && subtotal > 0 && (
                      <p className="text-xs text-muted-foreground text-right mt-1">
                        <span className="line-through">{brl(subtotal)}</span> · {PIX_DISCOUNT_PCT}% OFF à vista
                      </p>
                    )}
                    {payment === "cartao" && subtotal > 0 && (
                      <p className="text-xs text-muted-foreground text-right mt-1">
                        ou {MAX_INSTALLMENTS}x de {brl(installment)} sem juros
                      </p>
                    )}
                  </div>

                  <Button
                    size="lg"
                    className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg"
                    onClick={handleSend}
                    data-testid="button-whatsapp-checkout"
                  >
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
