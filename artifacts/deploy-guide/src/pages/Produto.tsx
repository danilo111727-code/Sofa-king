import { useParams, Link, useLocation } from "wouter";
import { ChevronRight, ArrowLeft, Ruler, Info, Check, ShieldCheck, ShoppingCart } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  fetchProduct, fetchAlbums, fetchMaterials, trackView,
  resolveAlbumSurcharge, resolveFoamAdjustment,
  type Product, type Album, type Material, type FabricSample,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { displayName, applyPixDiscount, PIX_DISCOUNT_PCT, MAX_INSTALLMENTS } from "@/lib/categories";

function brl(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Produto() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { add } = useCart();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [foams, setFoams] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [sizeIdx, setSizeIdx] = useState(0);
  const [albumIdx, setAlbumIdx] = useState(0);
  const [fabric, setFabric] = useState<FabricSample | null>(null);
  const [foamIdx, setFoamIdx] = useState(0);
  const [mainImageIdx, setMainImageIdx] = useState(0);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([fetchProduct(id), fetchAlbums(), fetchMaterials()])
      .then(([p, al, fo]) => {
        setProduct(p);
        setAlbums(al);
        setFoams(fo.filter((f) => f.active));
        if (al.length > 0 && al[0].fabrics.length > 0) setFabric(al[0].fabrics[0]);
        trackView({ productId: p.id, productName: p.name, path: `/produto/${p.id}` });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const selectedSize = product?.sizes[sizeIdx];
  const selectedAlbum = albums[albumIdx];
  const selectedFoam = foams[foamIdx];

  const albumSurcharge = useMemo(
    () => (selectedSize ? resolveAlbumSurcharge(selectedAlbum, selectedSize.label) : 0),
    [selectedAlbum, selectedSize],
  );
  const foamAdjustment = useMemo(
    () => (selectedSize ? resolveFoamAdjustment(selectedFoam, selectedSize.label) : 0),
    [selectedFoam, selectedSize],
  );
  const finalPrice = useMemo(() => {
    const base = selectedSize?.basePrice ?? 0;
    return base + albumSurcharge + foamAdjustment;
  }, [selectedSize, albumSurcharge, foamAdjustment]);

  const pixPrice = useMemo(() => applyPixDiscount(finalPrice), [finalPrice]);
  const installmentPrice = useMemo(() => finalPrice / MAX_INSTALLMENTS, [finalPrice]);
  const fullName = product ? displayName(product.name, product.category) : "";
  const galleryImages = useMemo(() => {
    if (!product) return [];
    if (product.images && product.images.length > 0) return product.images;
    return product.image ? [product.image] : [];
  }, [product]);

  useEffect(() => { setMainImageIdx(0); }, [product?.id]);

  useEffect(() => {
    // when album changes, pick its first fabric
    if (selectedAlbum && selectedAlbum.fabrics.length > 0) {
      setFabric(selectedAlbum.fabrics[0]);
    } else {
      setFabric(null);
    }
  }, [albumIdx, selectedAlbum?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col w-full bg-background">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-muted-foreground">Carregando...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen flex flex-col w-full bg-background">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-serif font-bold mb-4">Produto não encontrado</h1>
            <p className="text-muted-foreground mb-8">O sofá que você procura não está disponível ou não existe.</p>
            <Button asChild><Link href="/">Voltar para o início</Link></Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = (goToCart: boolean) => {
    if (!selectedSize) return;
    add({
      productId: product.id,
      productName: fullName,
      productImage: galleryImages[0] || product.image,
      size: { label: selectedSize.label, basePrice: selectedSize.basePrice },
      album: selectedAlbum
        ? { id: selectedAlbum.id, name: selectedAlbum.name, surcharge: albumSurcharge }
        : null,
      fabric: fabric ? { id: fabric.id, name: fabric.name, imageUrl: fabric.imageUrl } : null,
      foam: selectedFoam
        ? { id: selectedFoam.id, name: selectedFoam.name, priceAdjustment: foamAdjustment }
        : null,
      unitPrice: finalPrice,
    });
    if (goToCart) {
      navigate("/carrinho");
    } else {
      toast({
        title: "Adicionado ao carrinho",
        description: `${fullName} — ${selectedSize.label} por ${brl(finalPrice)}`,
        duration: 2500,
      });
    }
  };

  const noSizes = product.sizes.length === 0;

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <Navbar />

      <main className="flex-grow pb-24 sm:pb-12">
        <div className="bg-secondary/30 py-4 border-b border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center text-sm text-muted-foreground">
              <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Início
              </Link>
              <ChevronRight className="w-4 h-4 mx-2 text-border" />
              <span>Sofás</span>
              <ChevronRight className="w-4 h-4 mx-2 text-border" />
              <span className="text-foreground font-medium">{fullName}</span>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Image Gallery */}
            <div className="space-y-3">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted border border-border">
                <img
                  src={galleryImages[mainImageIdx] || product.image}
                  alt={fullName}
                  className="w-full h-full object-cover object-center"
                  data-testid="img-product-main"
                />
              </div>
              {galleryImages.length > 1 && (
                <div className="grid grid-cols-5 gap-2" data-testid="product-thumbnails">
                  {galleryImages.map((url, i) => (
                    <button
                      key={`${url}-${i}`}
                      onClick={() => setMainImageIdx(i)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        mainImageIdx === i ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50 opacity-70 hover:opacity-100"
                      }`}
                      data-testid={`thumbnail-${i}`}
                      aria-label={`Ver foto ${i + 1}`}
                    >
                      <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground" data-testid="text-product-detail-name">
                  {fullName}
                </h1>
                {!product.disponibilidade && (
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full font-medium">Indisponível</span>
                )}
              </div>

              <p className="text-muted-foreground mb-6 leading-relaxed" data-testid="text-product-detail-desc">
                {product.longDescription || product.description}
              </p>

              {product.prazoEntrega && (
                <p className="text-sm text-muted-foreground mb-6 flex items-center gap-1">
                  🚚 Prazo de entrega: <strong>{product.prazoEntrega}</strong>
                </p>
              )}

              <Separator className="my-4" />

              {/* Step 1: size */}
              {noSizes ? (
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm mb-6">
                  Este modelo ainda não tem metragens cadastradas. Entre em contato pelo WhatsApp para saber o preço.
                </div>
              ) : (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 text-foreground">
                    1. Escolha a metragem
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setSizeIdx(i)}
                        className={`px-4 py-2.5 rounded-md text-sm font-medium border transition-all ${
                          sizeIdx === i
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-transparent text-foreground border-border hover:border-primary/50"
                        }`}
                        data-testid={`button-size-${i}`}
                      >
                        <div>{s.label}</div>
                        <div className="text-xs opacity-80 mt-0.5">{brl(s.basePrice)}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: album */}
              {albums.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 text-foreground">
                    2. Escolha o álbum de tecido
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {albums.map((a, i) => {
                      const s = selectedSize ? resolveAlbumSurcharge(a, selectedSize.label) : a.surcharge;
                      return (
                      <button
                        key={a.id}
                        onClick={() => setAlbumIdx(i)}
                        className={`px-4 py-2.5 rounded-md text-sm font-medium border transition-all text-left ${
                          albumIdx === i
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-transparent text-foreground border-border hover:border-primary/50"
                        }`}
                        data-testid={`button-album-${a.id}`}
                      >
                        <div className="font-semibold">{a.name}</div>
                        <div className="text-xs opacity-80">{s > 0 ? `+${brl(s)}` : s < 0 ? brl(s) : "incluso"}</div>
                      </button>
                      );
                    })}
                  </div>

                  {selectedAlbum && selectedAlbum.fabrics.length > 0 && (
                    <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                      <p className="text-xs text-muted-foreground mb-2">
                        Cores disponíveis no {selectedAlbum.name}{fabric ? ` — ${fabric.name}` : ""}:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedAlbum.fabrics.map((f) => (
                          <button
                            key={f.id}
                            onClick={() => setFabric(f)}
                            className={`flex items-center gap-2 px-2 py-1 rounded-md border transition-all ${
                              fabric?.id === f.id ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
                            }`}
                            title={f.name}
                            data-testid={`button-fabric-${f.id}`}
                          >
                            {f.imageUrl ? (
                              <img src={f.imageUrl} alt={f.name} className="w-8 h-8 rounded object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded bg-secondary border border-border" />
                            )}
                            <span className="text-xs font-medium">{f.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: foam */}
              {foams.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 text-foreground">
                    3. Escolha a espuma
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {foams.map((f, i) => {
                      const adj = selectedSize ? resolveFoamAdjustment(f, selectedSize.label) : f.priceAdjustment;
                      return (
                      <button
                        key={f.id}
                        onClick={() => setFoamIdx(i)}
                        className={`p-2 rounded-md text-sm font-medium border transition-all text-left flex flex-col ${
                          foamIdx === i
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-transparent text-foreground border-border hover:border-primary/50"
                        }`}
                        data-testid={`button-foam-${f.id}`}
                      >
                        {f.imageUrl && (
                          <div className="w-full aspect-[4/3] rounded bg-white/60 overflow-hidden mb-2 border border-border/50">
                            <img src={f.imageUrl} alt={f.name} className="w-full h-full object-contain" loading="lazy" />
                          </div>
                        )}
                        <div className="font-semibold leading-tight">{f.name}</div>
                        <div className="text-xs opacity-80 mt-0.5">
                          {adj > 0 ? `+${brl(adj)}` : adj < 0 ? brl(adj) : "incluso"}
                        </div>
                      </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <Separator className="my-4" />

              {/* Price + CTA */}
              {!noSizes && (
                <div className="rounded-xl bg-secondary/30 border border-border p-5 mb-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
                  <p className="text-4xl font-bold text-accent mt-1" data-testid="text-product-detail-price">
                    {brl(finalPrice)}
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-foreground" data-testid="text-installment">
                      <strong>{MAX_INSTALLMENTS}x de {brl(installmentPrice)}</strong> <span className="text-muted-foreground">sem juros no cartão</span>
                    </p>
                    <p className="text-sm text-green-700" data-testid="text-pix-price">
                      <strong>ou {brl(pixPrice)} no PIX</strong> <span className="text-green-700/80">({PIX_DISCOUNT_PCT}% OFF à vista)</span>
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground mt-3 space-y-0.5 pt-3 border-t border-border">
                    {selectedSize && <div>• Metragem {selectedSize.label}: {brl(selectedSize.basePrice)}</div>}
                    {selectedAlbum && albumSurcharge !== 0 && <div>• {selectedAlbum.name}: {albumSurcharge > 0 ? "+" : ""}{brl(albumSurcharge)}</div>}
                    {selectedFoam && foamAdjustment !== 0 && <div>• {selectedFoam.name}: {foamAdjustment > 0 ? "+" : ""}{brl(foamAdjustment)}</div>}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleAddToCart(false)}
                  disabled={!product.disponibilidade || noSizes}
                  className="h-14 text-base font-semibold"
                  data-testid="button-add-to-cart"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Adicionar ao carrinho
                </Button>
                <Button
                  size="lg"
                  onClick={() => handleAddToCart(true)}
                  disabled={!product.disponibilidade || noSizes}
                  className="h-14 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                  data-testid="button-buy-now"
                >
                  {product.disponibilidade ? "Comprar agora" : "Indisponível"}
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-2">
                O fechamento do pedido é feito pelo WhatsApp, direto do seu carrinho.
              </p>
            </div>
          </div>

          {product.dimensions && (
            <div className="mt-16 pt-10 border-t border-border">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 text-primary">
                    <Ruler className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Dimensões</h4>
                    <p className="text-muted-foreground leading-relaxed">{product.dimensions}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
