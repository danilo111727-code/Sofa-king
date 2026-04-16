import { Link } from "wouter";
import { ArrowRight, Star } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { fetchProducts, type Product } from "@/lib/api";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col w-full bg-background selection:bg-primary/20">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative w-full h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src="/images/hero.png" 
              alt="Sala de estar elegante com sofá premium" 
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20" />
          </div>
          
          <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 text-center md:text-left">
            <div className="max-w-2xl text-white">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6" data-testid="badge-hero-collection">
                <Star className="w-4 h-4 text-accent fill-accent" />
                <span className="text-sm font-medium tracking-wide uppercase">Nova Coleção Jardins</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight leading-[1.1] mb-3" data-testid="text-hero-title">
                Sofá King
              </h1>
              <p className="text-sm md:text-base tracking-[0.3em] uppercase text-accent mb-6 font-medium" data-testid="text-hero-tagline">
                Estofados planejados
              </p>
              <p className="text-xl md:text-2xl font-light text-white/90 mb-2" data-testid="text-hero-subtitle">
                Escolha seu modelo.
              </p>
              <p className="text-base md:text-lg text-white/80 mb-10 max-w-xl leading-relaxed">
                Design brasileiro contemporâneo, conforto incomparável e acabamento artesanal para lares que valorizam a verdadeira elegância.
              </p>
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold h-14 px-8 rounded-none md:rounded-md text-base" data-testid="button-hero-cta">
                <a href="#produtos">
                  Explorar Coleção <ArrowRight className="ml-2 w-5 h-5" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        <section id="produtos" className="py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4" data-testid="text-section-title">Design Sofisticado</h2>
                <p className="text-muted-foreground text-lg max-w-2xl">
                  Descubra nossa curadoria de sofás projetados para transformar sua sala no ambiente mais acolhedor da casa.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-muted/30 rounded-lg h-80 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 lg:gap-12">
                {products
                  .filter((p) => p.disponibilidade)
                  .map((product) => (
                  <Link key={product.id} href={`/produto/${product.id}`} className="group group/card" data-testid={`card-product-${product.id}`}>
                    <div className="flex flex-col h-full bg-card rounded-lg overflow-hidden border border-border/50 hover:border-primary/20 transition-all duration-500 hover:shadow-xl">
                      <div className="relative aspect-[16/10] overflow-hidden bg-muted/30">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover object-center transition-transform duration-700 group-hover/card:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/5 transition-colors duration-500" />
                      </div>
                      <div className="p-8 flex flex-col flex-grow">
                        <div className="flex justify-between items-start mb-4 gap-4">
                          <h3 className="text-2xl font-serif font-bold text-foreground group-hover/card:text-primary transition-colors" data-testid={`text-product-name-${product.id}`}>
                            {product.name}
                          </h3>
                          <span className="text-xl font-medium text-accent whitespace-nowrap" data-testid={`text-product-price-${product.id}`}>
                            R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed flex-grow" data-testid={`text-product-desc-${product.id}`}>
                          {product.description}
                        </p>
                        {product.prazoEntrega && (
                          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                            🚚 Entrega: {product.prazoEntrega}
                          </p>
                        )}
                        <div className="mt-8 pt-6 border-t border-border flex items-center justify-between text-sm font-medium text-primary">
                          <span>Ver detalhes do produto</span>
                          <ArrowRight className="w-4 h-4 transform group-hover/card:translate-x-2 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Brand Philosophy Section */}
        <section className="py-24 bg-secondary/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">A Arte de Receber Bem</h2>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10">
              Na Sofa King, acreditamos que o sofá é o coração de uma casa. É onde a vida acontece, onde as histórias são contadas e onde o verdadeiro conforto encontra a sofisticação estética do design brasileiro.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 text-left">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <span className="font-serif italic text-xl">1</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">Materiais Premium</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">Madeira de reflorestamento, espumas de alta densidade e tecidos selecionados para durar gerações.</p>
              </div>
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <span className="font-serif italic text-xl">2</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">Design Exclusivo</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">Linhas pensadas para se adaptar a diferentes estilos arquitetônicos, do minimalista ao clássico.</p>
              </div>
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <span className="font-serif italic text-xl">3</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">Conforto Absoluto</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">Ergonomia estudada exaustivamente para garantir o abraço perfeito a cada vez que você se senta.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
