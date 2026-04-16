import { useParams } from "wouter";
import { Link } from "wouter";
import { ChevronRight, ArrowLeft, Ruler, Palette, Info, Check, ShieldCheck, Truck } from "lucide-react";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { fetchProduct, type Product } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export default function Produto() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedFabric, setSelectedFabric] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchProduct(id)
      .then((p) => {
        setProduct(p);
        setSelectedColor(p.colors[0] ?? "");
        setSelectedFabric(p.fabrics[0] ?? "");
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

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
            <Button asChild>
              <Link href="/">Voltar para o início</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = () => {
    toast({
      title: "Adicionado ao carrinho",
      description: `${product.name} em ${selectedFabric} (${selectedColor}) foi adicionado com sucesso.`,
      duration: 3000,
    });
  };

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <Navbar />

      <main className="flex-grow">
        {/* Breadcrumb */}
        <div className="bg-secondary/30 py-4 border-b border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center text-sm text-muted-foreground">
              <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1" data-testid="link-breadcrumb-home">
                <ArrowLeft className="w-3 h-3" /> Início
              </Link>
              <ChevronRight className="w-4 h-4 mx-2 text-border" />
              <span>Sofás</span>
              <ChevronRight className="w-4 h-4 mx-2 text-border" />
              <span className="text-foreground font-medium">{product.name}</span>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Image Gallery */}
            <div className="space-y-6">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted border border-border">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover object-center"
                  data-testid="img-product-main"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="aspect-[4/3] rounded-lg overflow-hidden border-2 border-primary cursor-pointer opacity-100">
                  <img src={product.image} alt="Vista 1" className="w-full h-full object-cover" />
                </div>
                <div className="aspect-[4/3] rounded-lg overflow-hidden border border-border cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
                  <img src={product.image} alt="Vista 2" className="w-full h-full object-cover grayscale-[30%]" />
                </div>
                <div className="aspect-[4/3] rounded-lg overflow-hidden border border-border cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
                  <img src={product.image} alt="Vista 3" className="w-full h-full object-cover grayscale-[50%]" />
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground" data-testid="text-product-detail-name">
                  {product.name}
                </h1>
                {!product.disponibilidade && (
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full font-medium">Indisponível</span>
                )}
              </div>
              <p className="text-3xl font-medium text-accent mb-2" data-testid="text-product-detail-price">
                R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              {product.prazoEntrega && (
                <p className="text-sm text-muted-foreground mb-6 flex items-center gap-1">
                  🚚 Prazo de entrega: <strong>{product.prazoEntrega}</strong>
                </p>
              )}
              
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed" data-testid="text-product-detail-desc">
                {product.longDescription}
              </p>

              <Separator className="my-8" />

              {/* Configurations */}
              <div className="space-y-8">
                {product.fabrics.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2 text-foreground">
                      <Palette className="w-4 h-4 text-primary" /> Tecido
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {product.fabrics.map((fabric) => (
                        <button
                          key={fabric}
                          onClick={() => setSelectedFabric(fabric)}
                          className={`px-5 py-3 rounded-md text-sm font-medium transition-all ${
                            selectedFabric === fabric 
                              ? "bg-primary text-primary-foreground border-primary shadow-md" 
                              : "bg-transparent text-foreground border border-border hover:border-primary/50"
                          }`}
                          data-testid={`button-fabric-${fabric}`}
                        >
                          {fabric}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {product.colors.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2 text-foreground">
                      Cor: <span className="text-muted-foreground font-normal capitalize">{selectedColor}</span>
                    </h3>
                    <div className="flex flex-wrap gap-4">
                      {product.colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`group relative w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                            selectedColor === color 
                              ? "ring-2 ring-primary ring-offset-2 ring-offset-background" 
                              : "ring-1 ring-border hover:ring-primary/50"
                          }`}
                          title={color}
                          aria-label={`Selecionar cor ${color}`}
                          data-testid={`button-color-${color}`}
                        >
                          <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden shadow-inner flex items-center justify-center">
                            <span className="text-[10px] text-foreground/50">{color.substring(0, 2)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Separator className="my-10" />

              {/* Actions */}
              <div className="mt-auto space-y-4">
                <Button 
                  size="lg" 
                  className="w-full h-16 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                  onClick={handleAddToCart}
                  disabled={!product.disponibilidade}
                  data-testid="button-add-to-cart"
                >
                  {product.disponibilidade ? "Adicionar ao carrinho" : "Produto indisponível"}
                </Button>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground justify-center p-4 rounded-lg bg-secondary/20">
                    <Truck className="w-5 h-5 text-primary" />
                    <span>Frete grátis SP</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground justify-center p-4 rounded-lg bg-secondary/20">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <span>5 anos de garantia</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info Tabs */}
          <div className="mt-24 pt-16 border-t border-border">
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
                        <p className="text-muted-foreground leading-relaxed" data-testid="text-product-dimensions">{product.dimensions}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 text-primary">
                      <Info className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Estrutura</h4>
                      <p className="text-muted-foreground leading-relaxed">Madeira maciça de eucalipto reflorestado, seca e imunizada. Molas bonnel e percintas italianas para máximo suporte.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-secondary/30 p-8 rounded-xl">
                  <h4 className="font-semibold text-foreground mb-4">O que está incluso:</h4>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-muted-foreground">
                      <Check className="w-4 h-4 text-accent" /> Entrega agendada premium
                    </li>
                    <li className="flex items-center gap-3 text-muted-foreground">
                      <Check className="w-4 h-4 text-accent" /> Montagem no local (Capital)
                    </li>
                    <li className="flex items-center gap-3 text-muted-foreground">
                      <Check className="w-4 h-4 text-accent" /> Certificado de garantia
                    </li>
                    <li className="flex items-center gap-3 text-muted-foreground">
                      <Check className="w-4 h-4 text-accent" /> Kit de cuidados com o tecido
                    </li>
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
