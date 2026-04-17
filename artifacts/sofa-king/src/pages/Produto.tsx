import { useParams, Link, useLocation } from "wouter";
import { ChevronRight, ArrowLeft, Ruler, Info, Check, ShieldCheck, ShoppingCart, ChevronDown, X } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { ImageLightbox } from "@/components/ImageLightbox";
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
import { displayName } from "@/lib/categories";
import { useSiteSettings, applyCardMarkup } from "@/contexts/SiteSettingsContext";
import { DiagramaViewer } from "@/components/DiagramaViewer";

function brl(v: number | null | undefined): string {
  const n = (v == null || !isFinite(v as number)) ? 0 : (v as number);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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
  const [foamSheetOpen, setFoamSheetOpen] = useState(false);
  const [sizeSheetOpen, setSizeSheetOpen] = useState(false);
  const [mainImageIdx, setMainImageIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

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

  const { pixDiscountPct, maxInstallments } = useSiteSettings();
  const selectedSize = product?.sizes[sizeIdx];
  const selectedAlbum = albums[albumIdx];
  const selectedFoam = foams[foamIdx];

  const albumSurcharge = useMemo(() => {
    if (!selectedSize || !selectedAlbum) return 0;
    const fromProduct = selectedSize.albumSurcharges?.[selectedAlbum.id];
    if (fromProduct !== undefined) return fromProduct;
    return resolveAlbumSurcharge(selectedAlbum, selectedSize.label);
  }, [selectedAlbum, selectedSize]);

  const foamAdjustment = useMemo(() => {
    if (!selectedSize || !selectedFoam) return 0;
    const fromProduct = selectedSize.foamSurcharges?.[selectedFoam.id];
    if (fromProduct !== undefined) return fromProduct;
    return resolveFoamAdjustment(selectedFoam, selectedSize.label);
  }, [selectedFoam, selectedSize]);
  const finalPrice = useMemo(() => {
    const base = selectedSize?.basePrice ?? 0;
    return base + albumSurcharge + foamAdjustment;
  }, [selectedSize, albumSurcharge, foamAdjustment]);

  const pixPrice = finalPrice;
  const cardPrice = useMemo(() => applyCardMarkup(finalPrice, pixDiscountPct), [finalPrice, pixDiscountPct]);
  const installmentPrice = useMemo(() => cardPrice / maxInstallments, [cardPrice, maxInstallments]);
  const fullName = product ? displayName(product.name, product.category) : "";
  const DIAGRAMA_SENTINEL = "__diagrama__";
  const galleryImages = useMemo(() => {
    if (!product) return [];
    const base = product.images && product.images.length > 0
      ? product.images
      : product.image ? [product.image] : [];
    if (product.diagramaUrl && product.diagramaAnotacoes && product.diagramaAnotacoes.length > 0) {
      return [...base, DIAGRAMA_SENTINEL];
    }
    return base;
  }, [product]);

  const lightboxImages = useMemo(
    () => galleryImages.filter((u) => u !== DIAGRAMA_SENTINEL),
    [galleryImages]
  );

  const openLightbox = useCallback(
    (galleryIdx: number) => {
      const img = galleryImages[galleryIdx];
      if (!img || img === DIAGRAMA_SENTINEL) return;
      const lbIdx = lightboxImages.indexOf(img);
      if (lbIdx === -1) return;
      setLightboxIdx(lbIdx);
      setLightboxOpen(true);
    },
    [galleryImages, lightboxImages]
  );

  useEffect(() => { setMainImageIdx(0); }, [product?.id]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [id]);

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
              <div
                className={`aspect-[4/3] rounded-xl overflow-hidden bg-muted border border-border relative group ${
                  galleryImages[mainImageIdx] !== DIAGRAMA_SENTINEL ? "cursor-zoom-in" : ""
                }`}
                data-testid="img-product-main"
                onClick={() => openLightbox(mainImageIdx)}
              >
                {galleryImages[mainImageIdx] === DIAGRAMA_SENTINEL && product.diagramaUrl && product.diagramaAnotacoes ? (
                  <DiagramaViewer imageUrl={product.diagramaUrl} anotacoes={product.diagramaAnotacoes} />
                ) : (
                  <>
                    <img
                      src={galleryImages[mainImageIdx] || product.image}
                      alt={fullName}
                      className="w-full h-full object-cover object-center transition-transform duration-200 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="bg-black/40 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm">
                        Toque para ampliar
                      </div>
                    </div>
                  </>
                )}
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
                      {url === DIAGRAMA_SENTINEL ? (
                        <div className="w-full h-full bg-secondary flex items-center justify-center">
                          <Ruler className="w-5 h-5 text-primary" />
                        </div>
                      ) : (
                        <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                      )}
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
                <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1">
                  🚚 Prazo de entrega: <strong>{product.prazoEntrega}</strong>
                </p>
              )}

              {/* Price highlight — mostra o preço total e condições de pagamento antes das seleções */}
              {!noSizes && (
                <div className="rounded-xl border border-border bg-gradient-to-br from-secondary/40 to-secondary/10 p-4 sm:p-5 mb-5" data-testid="price-highlight">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">PIX / À vista</p>
                  <p className="text-3xl sm:text-4xl font-bold text-green-700 leading-none" data-testid="text-price-highlight">
                    {brl(pixPrice)}
                  </p>
                  <div className="mt-2 space-y-0.5">
                    <p className="text-sm text-muted-foreground">
                      No cartão: <strong className="text-foreground">{maxInstallments}x de {brl(installmentPrice)}</strong>{" "}
                      <span className="text-muted-foreground">sem juros</span>
                      <span className="text-muted-foreground ml-1">({brl(cardPrice)} total)</span>
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Valor atualiza conforme você escolhe metragem, álbum e espuma abaixo.
                  </p>
                </div>
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
                  <button
                    type="button"
                    onClick={() => setSizeSheetOpen(true)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-md border border-border bg-background hover:border-primary/60 transition-colors text-left"
                    data-testid="button-open-size-selector"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Ruler className="w-4 h-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">
                          {selectedSize ? selectedSize.label : "Selecione uma medida…"}
                        </div>
                        {selectedSize && (
                          <div className="text-xs text-muted-foreground">
                            {brl(selectedSize.basePrice + resolveAlbumSurcharge(selectedAlbum, selectedSize.label) + resolveFoamAdjustment(selectedFoam, selectedSize.label))}
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                  </button>
                  <a
                    href={`https://wa.me/5575991495793?text=${encodeURIComponent(`Olá! Tenho interesse no "${fullName}" e gostaria de orçamento em uma medida diferente das padrão. Qual metragem você precisa?`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-800 border border-green-700/40 hover:border-green-700 rounded-lg px-3 py-2 transition-colors"
                    data-testid="button-custom-size-whatsapp"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/></svg>
                    Precisa de outra medida? Solicitar orçamento no WhatsApp
                  </a>
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
                        onClick={() => { setFoamIdx(i); setFoamSheetOpen(true); }}
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
                  {selectedFoam && (selectedFoam.weightSupport || selectedFoam.comfortLevel || selectedFoam.useIndication || selectedFoam.longTermBehavior) && (
                    <button
                      type="button"
                      onClick={() => setFoamSheetOpen(true)}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                      data-testid="button-show-foam-specs"
                    >
                      <Info className="w-3.5 h-3.5" />
                      Ver ficha técnica — {selectedFoam.name}
                    </button>
                  )}
                </div>
              )}

              <Separator className="my-4" />

              {/* Parcelamento info block */}
              <div className="rounded-xl border border-border bg-card p-5 mb-4">
                <h4 className="font-bold text-base text-foreground mb-3 flex items-center gap-2">
                  <span className="block w-1 h-5 rounded-full bg-accent shrink-0" />
                  Como funciona o parcelamento do projeto:
                </h4>
                <ol className="space-y-3">
                  <li className="flex gap-3 text-sm text-muted-foreground">
                    <span className="font-bold text-accent shrink-0">1.</span>
                    <span><strong className="text-foreground">50% de entrada</strong> para iniciar a produção da sua peça no ateliê.</span>
                  </li>
                  <li className="flex gap-3 text-sm text-muted-foreground">
                    <span className="font-bold text-accent shrink-0">2.</span>
                    <span>Quando a peça está pronta, fazemos um <strong className="text-foreground">vídeo ao vivo</strong> com você — ou você pode <strong className="text-foreground">conferir pessoalmente no ateliê</strong>.</span>
                  </li>
                  <li className="flex gap-3 text-sm text-muted-foreground">
                    <span className="font-bold text-accent shrink-0">3.</span>
                    <span>Aprovado, você paga os <strong className="text-foreground">50% restantes antes da entrega</strong>.</span>
                  </li>
                </ol>
              </div>

              {/* Price + CTA */}
              {!noSizes && (
                <div className="rounded-xl bg-secondary/30 border border-border p-5 mb-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">PIX / À vista</p>
                  <p className="text-4xl font-bold text-green-700 mt-1" data-testid="text-product-detail-price">
                    {brl(pixPrice)}
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-muted-foreground" data-testid="text-installment">
                      No cartão: <strong className="text-foreground">{maxInstallments}x de {brl(installmentPrice)}</strong>{" "}
                      <span className="text-muted-foreground">sem juros</span>
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid="text-pix-price">
                      Total no cartão: {brl(cardPrice)}
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

        </div>
      </main>

      {foamSheetOpen && selectedFoam && (selectedFoam.weightSupport || selectedFoam.comfortLevel || selectedFoam.useIndication || selectedFoam.longTermBehavior) && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 animate-in fade-in duration-200"
          onClick={() => setFoamSheetOpen(false)}
          data-testid="foam-specs-overlay"
        >
          <div
            className="bg-background w-full sm:max-w-md sm:rounded-lg rounded-t-2xl border-t-2 sm:border-2 border-primary p-5 shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
            data-testid="foam-specs-sheet"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Ficha técnica</div>
                <div className="text-lg font-semibold text-primary">{selectedFoam.name}</div>
              </div>
              <button
                onClick={() => setFoamSheetOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 -m-1"
                aria-label="Fechar"
                data-testid="button-close-foam-specs"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <dl className="space-y-3 text-sm">
              {selectedFoam.weightSupport && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">Peso suportado</dt>
                  <dd className="text-foreground font-medium">{selectedFoam.weightSupport}</dd>
                </div>
              )}
              {selectedFoam.comfortLevel && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">Nível de conforto</dt>
                  <dd className="text-foreground font-medium">{selectedFoam.comfortLevel}</dd>
                </div>
              )}
              {selectedFoam.useIndication && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">Indicação de uso</dt>
                  <dd className="text-foreground font-medium">{selectedFoam.useIndication}</dd>
                </div>
              )}
              {selectedFoam.longTermBehavior && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">Comportamento a longo prazo</dt>
                  <dd className="text-foreground leading-relaxed">{selectedFoam.longTermBehavior}</dd>
                </div>
              )}
            </dl>
            <button
              onClick={() => setFoamSheetOpen(false)}
              className="mt-5 w-full bg-primary text-primary-foreground py-2.5 rounded-md text-sm font-semibold hover:bg-primary/90"
              data-testid="button-confirm-foam-specs"
            >
              Entendi, continuar
            </button>
          </div>
        </div>
      )}

      {sizeSheetOpen && product && product.sizes.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 animate-in fade-in duration-200"
          onClick={() => setSizeSheetOpen(false)}
          data-testid="size-selector-overlay"
        >
          <div
            className="bg-background w-full sm:max-w-md sm:rounded-lg rounded-t-2xl border-t-2 sm:border-2 border-primary shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            data-testid="size-selector-sheet"
          >
            <div className="flex items-start justify-between gap-3 p-5 pb-3 border-b border-border">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Metragem</div>
                <div className="text-lg font-semibold text-primary">Selecione uma medida</div>
              </div>
              <button
                onClick={() => setSizeSheetOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 -m-1"
                aria-label="Fechar"
                data-testid="button-close-size-selector"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-3 space-y-2">
              {product.sizes.map((s, i) => {
                const sizeAlbumSurcharge = resolveAlbumSurcharge(selectedAlbum, s.label);
                const sizeFoamAdj = resolveFoamAdjustment(selectedFoam, s.label);
                const sizeTotal = s.basePrice + sizeAlbumSurcharge + sizeFoamAdj;
                const sizePix = sizeTotal;
                const sizeCard = applyCardMarkup(sizeTotal, pixDiscountPct);
                const sizeInstallment = sizeCard / maxInstallments;
                const active = sizeIdx === i;
                return (
                  <button
                    key={i}
                    onClick={() => { setSizeIdx(i); setSizeSheetOpen(false); }}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-md border text-left transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:border-primary/60"
                    }`}
                    data-testid={`button-size-${i}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? "border-primary-foreground" : "border-border"}`}>
                        {active && <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{s.label}</div>
                        <div className={`text-[11px] ${active ? "opacity-90" : "text-muted-foreground"}`}>
                          PIX {brl(sizePix)} · {maxInstallments}x {brl(sizeInstallment)}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-sm whitespace-nowrap">{brl(sizeTotal)}</div>
                  </button>
                );
              })}
            </div>
            <div className="p-3 border-t border-border">
              <a
                href={`https://wa.me/5575991495793?text=${encodeURIComponent(`Olá! Tenho interesse no "${fullName}" e gostaria de orçamento em uma medida diferente das padrão. Qual metragem você precisa?`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center text-sm font-medium text-green-700 hover:text-green-800 border border-green-700/40 hover:border-green-700 rounded-md px-3 py-2.5 transition-colors"
              >
                Precisa de outra medida? Fale no WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      <Footer />

      {lightboxOpen && lightboxImages.length > 0 && (
        <ImageLightbox
          images={lightboxImages}
          currentIndex={lightboxIdx}
          altBase={fullName}
          onClose={() => setLightboxOpen(false)}
          onNext={() => setLightboxIdx((i) => Math.min(i + 1, lightboxImages.length - 1))}
          onPrev={() => setLightboxIdx((i) => Math.max(i - 1, 0))}
        />
      )}
    </div>
  );
}
