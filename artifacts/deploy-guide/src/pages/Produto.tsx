import { useParams, Link } from "wouter";
import { ChevronRight, ArrowLeft, Ruler, Info, Check, ShieldCheck } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  fetchProduct, fetchAlbums, fetchMaterials, trackView, trackWhatsapp,
  type Product, type Album, type Material, type FabricSample,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const WHATSAPP = "5575991495793";

function brl(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Produto() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [foams, setFoams] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [sizeIdx, setSizeIdx] = useState(0);
  const [albumIdx, setAlbumIdx] = useState(0);
  const [fabric, setFabric] = useState<FabricSample | null>(null);
  const [foamIdx, setFoamIdx] = useState(0);

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

  const finalPrice = useMemo(() => {
    const base = selectedSize?.basePrice ?? 0;
    const albumSur = selectedAlbum?.surcharge ?? 0;
    const foamSur = selectedFoam?.priceAdjustment ?? 0;
    return base + albumSur + foamSur;
  }, [selectedSize, selectedAlbum, selectedFoam]);

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

  const handleWhatsApp = () => {
    trackWhatsapp({ productId: product.id, productName: product.name });
    const parts = [
      `Olá! Tenho interesse no ${product.name}`,
      selectedSize ? `Metragem: ${selectedSize.label}` : "",
      selectedAlbum ? `Álbum: ${selectedAlbum.name}${fabric ? ` (${fabric.name})` : ""}` : "",
      selectedFoam ? `Espuma: ${selectedFoam.name}` : "",
      `Total: ${brl(finalPrice)}`,
    ].filter(Boolean);
    const msg = encodeURIComponent(parts.join("\n"));
    window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, "_blank");
  };

  const noSizes = product.sizes.length === 0;

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <Navbar />

      <main className="flex-grow">
        <div className="bg-secondary/30 py-4 border-b border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center text-sm text-muted-foreground">
              <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Início
              </Link>
              <ChevronRight className="w-4 h-4 mx-2 text-border" />
              <span>Sofás</span>
              <ChevronRight className="w-4 h-4 mx-2 text-border" />
              <span className="text-foreground font-medium">{product.name}</span>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Image */}
            <div className="space-y-4">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted border border-border">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover object-center" data-testid="img-product-main" />
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground" data-testid="text-product-detail-name">
                  {product.name}
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
                    {albums.map((a, i) => (
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
                        <div className="text-xs opacity-80">{a.surcharge > 0 ? `+${brl(a.surcharge)}` : a.surcharge < 0 ? brl(a.surcharge) : "incluso"}</div>
                      </button>
                    ))}
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
                  <div className="flex flex-wrap gap-2">
                    {foams.map((f, i) => (
                      <button
                        key={f.id}
                        onClick={() => setFoamIdx(i)}
                        className={`px-4 py-2.5 rounded-md text-sm font-medium border transition-all text-left ${
                          foamIdx === i
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-transparent text-foreground border-border hover:border-primary/50"
                        }`}
                        data-testid={`button-foam-${f.id}`}
                      >
                        <div className="font-semibold">{f.name}</div>
                        <div className="text-xs opacity-80">
                          {f.priceAdjustment > 0 ? `+${brl(f.priceAdjustment)}` : f.priceAdjustment < 0 ? brl(f.priceAdjustment) : "incluso"}
                        </div>
                      </button>
                    ))}
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
                  <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                    {selectedSize && <div>• Metragem {selectedSize.label}: {brl(selectedSize.basePrice)}</div>}
                    {selectedAlbum && selectedAlbum.surcharge !== 0 && <div>• {selectedAlbum.name}: {selectedAlbum.surcharge > 0 ? "+" : ""}{brl(selectedAlbum.surcharge)}</div>}
                    {selectedFoam && selectedFoam.priceAdjustment !== 0 && <div>• {selectedFoam.name}: {selectedFoam.priceAdjustment > 0 ? "+" : ""}{brl(selectedFoam.priceAdjustment)}</div>}
                  </div>
                </div>
              )}

              <Button
                size="lg"
                onClick={handleWhatsApp}
                disabled={!product.disponibilidade}
                className="w-full h-14 text-base font-semibold bg-green-600 hover:bg-green-700 text-white shadow-lg"
                data-testid="button-whatsapp-cta"
              >
                {product.disponibilidade ? "Comprar pelo WhatsApp" : "Produto indisponível"}
              </Button>

              <div className="flex items-center gap-3 text-sm text-muted-foreground justify-center p-3 mt-3 rounded-lg bg-secondary/20">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <span>5 anos de garantia</span>
              </div>
            </div>
          </div>

          {/* Specs */}
          <div className="mt-20 pt-12 border-t border-border">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-serif font-bold mb-8 text-center">Especificações Técnicas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
                <div className="space-y-6">
                  {product.dimensions && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 text-primary">
                        <Ruler className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Dimensões</h4>
                        <p className="text-muted-foreground leading-relaxed">{product.dimensions}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 text-primary">
                      <Info className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Estrutura</h4>
                      <p className="text-muted-foreground leading-relaxed">Madeira maciça seca e imunizada. Percintas elásticas e molas de alta durabilidade.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-secondary/30 p-8 rounded-xl">
                  <h4 className="font-semibold text-foreground mb-4">O que está incluso:</h4>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-muted-foreground"><Check className="w-4 h-4 text-accent" /> Entrega agendada</li>
                    <li className="flex items-center gap-3 text-muted-foreground"><Check className="w-4 h-4 text-accent" /> Montagem no local (Feira de Santana)</li>
                    <li className="flex items-center gap-3 text-muted-foreground"><Check className="w-4 h-4 text-accent" /> Certificado de garantia</li>
                    <li className="flex items-center gap-3 text-muted-foreground"><Check className="w-4 h-4 text-accent" /> Orientações de cuidado com o tecido</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
