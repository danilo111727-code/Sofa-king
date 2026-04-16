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
                Ateliê de estofados sob medida. Cada peça é desenhada e produzida artesanalmente para lares que valorizam o feito à mão.
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
            <div className="text-center mb-16">
              <p className="text-xs tracking-[0.4em] uppercase text-accent mb-4 font-semibold">Vagas abertas</p>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-5" data-testid="text-section-title">
                Modelos disponíveis agora
              </h2>
              <div className="w-12 h-[2px] bg-accent mx-auto mb-6" />
              <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                Estes são os projetos com vaga aberta no nosso ateliê neste momento. Cada um pode ser personalizado em medidas, tecidos e acabamentos.
              </p>
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

        {/* Manifesto / Sobre o Ateliê */}
        <section className="relative py-28 bg-gradient-to-b from-secondary/40 via-background to-background overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden="true">
            <div className="absolute top-10 left-10 font-serif text-[20rem] leading-none text-foreground select-none">"</div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-3xl mx-auto text-center mb-20">
              <p className="text-xs tracking-[0.4em] uppercase text-accent mb-5 font-semibold">Nosso ateliê</p>
              <h2 className="text-4xl md:text-6xl font-serif font-bold text-foreground leading-[1.1] mb-8">
                Cada peça nasce de uma <em className="italic text-accent">conversa</em>, não de uma esteira.
              </h2>
              <div className="w-16 h-[2px] bg-accent mx-auto mb-8" />
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Somos um ateliê — não uma fábrica. Aqui o estofado começa quando você nos diz como quer viver na sua sala. A partir daí, escolhemos juntos o desenho, o tecido, as medidas e os acabamentos. Cada vaga aberta na nossa agenda é uma nova história sendo construída à mão.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/60 rounded-2xl overflow-hidden border border-border/60 shadow-sm">
              <div className="bg-background p-10 md:p-12 hover:bg-secondary/30 transition-colors">
                <div className="flex items-center gap-4 mb-6">
                  <span className="font-serif italic text-4xl text-accent">i.</span>
                  <h3 className="text-xl font-serif font-bold text-foreground">Você personaliza</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Escolhe o modelo, a metragem, o tecido e a espuma. Cada projeto é montado com você — não é um produto de prateleira.
                </p>
              </div>
              <div className="bg-background p-10 md:p-12 hover:bg-secondary/30 transition-colors">
                <div className="flex items-center gap-4 mb-6">
                  <span className="font-serif italic text-4xl text-accent">ii.</span>
                  <h3 className="text-xl font-serif font-bold text-foreground">Feito à mão</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Estrutura cortada, montada, estofada e costurada peça por peça dentro do nosso ateliê em Feira de Santana. O tempo de cada projeto é o tempo do bem-feito.
                </p>
              </div>
              <div className="bg-background p-10 md:p-12 hover:bg-secondary/30 transition-colors">
                <div className="flex items-center gap-4 mb-6">
                  <span className="font-serif italic text-4xl text-accent">iii.</span>
                  <h3 className="text-xl font-serif font-bold text-foreground">Vagas limitadas</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Trabalhamos com agenda. Os modelos que aparecem disponíveis no site são as vagas que liberamos agora. Quando enche, abrimos as próximas.
                </p>
              </div>
            </div>

            <div className="mt-20 max-w-3xl mx-auto text-center">
              <p className="font-serif text-2xl md:text-3xl italic text-foreground/90 leading-relaxed">
                "Não fazemos sofás em série.<br className="hidden md:block" /> Fazemos o seu sofá."
              </p>
              <p className="mt-6 text-xs tracking-[0.3em] uppercase text-muted-foreground">— Sofá King · Estofados planejados</p>
            </div>
          </div>
        </section>
        {/* Info sections: Prazo, Garantia, Pagamento */}
        <section className="py-20 bg-background border-t border-border/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-16">
            <div id="prazo-entrega" className="scroll-mt-24" data-testid="section-prazo-entrega">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🚚</span>
                <h3 className="text-2xl md:text-3xl font-serif font-bold">Prazo de Entrega</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Nossos estofados são planejados sob medida e produzidos artesanalmente,
                por isso <strong className="text-foreground">não trabalhamos com prazo fixo</strong>.
                As vagas de produção são liberadas conforme nossa disponibilidade — quando uma vaga é aberta,
                o produto aparece como disponível aqui no site. Para confirmar o prazo da sua peça e a entrega na sua cidade,
                fale com nosso vendedor pelo WhatsApp.
              </p>
            </div>

            <div id="garantia" className="scroll-mt-24" data-testid="section-garantia">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🛡️</span>
                <h3 className="text-2xl md:text-3xl font-serif font-bold">Garantia</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-6">
                A Sofá King concede garantia para os produtos a partir da data de entrega, conforme abaixo:
              </p>
              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-muted/40 rounded-lg p-5 border border-border/50">
                  <p className="text-2xl font-serif font-bold text-foreground">02 anos</p>
                  <p className="text-sm text-muted-foreground mt-1">Estrutura de madeira</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-5 border border-border/50">
                  <p className="text-2xl font-serif font-bold text-foreground">01 ano</p>
                  <p className="text-sm text-muted-foreground mt-1">Espumas</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-5 border border-border/50">
                  <p className="text-2xl font-serif font-bold text-foreground">03 meses</p>
                  <p className="text-sm text-muted-foreground mt-1">Tecido</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <span className="text-green-600">✓</span> A garantia cobre defeitos de fabricação relacionados a:
                  </h4>
                  <ul className="space-y-2 text-muted-foreground text-sm">
                    <li className="flex gap-2"><span className="text-accent">●</span> Estrutura de madeira</li>
                    <li className="flex gap-2"><span className="text-accent">●</span> Espumas</li>
                    <li className="flex gap-2"><span className="text-accent">●</span> Percintas elásticas</li>
                    <li className="flex gap-2"><span className="text-accent">●</span> Costuras</li>
                    <li className="flex gap-2"><span className="text-accent">●</span> Tecido (dentro do prazo de cobertura)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <span className="text-red-500">✕</span> A garantia não cobre:
                  </h4>
                  <ul className="space-y-2 text-muted-foreground text-sm">
                    <li className="flex gap-2"><span className="text-muted-foreground">●</span> Desgaste natural do tecido</li>
                    <li className="flex gap-2"><span className="text-muted-foreground">●</span> Manchas, rasgos ou mau uso</li>
                    <li className="flex gap-2"><span className="text-muted-foreground">●</span> Danos causados por umidade, água ou exposição ao sol</li>
                    <li className="flex gap-2"><span className="text-muted-foreground">●</span> Transporte por terceiros</li>
                    <li className="flex gap-2"><span className="text-muted-foreground">●</span> Modificações ou consertos feitos por terceiros</li>
                  </ul>
                </div>
              </div>
            </div>

            <div id="pagamento" className="scroll-mt-24" data-testid="section-pagamento">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">💳</span>
                <h3 className="text-2xl md:text-3xl font-serif font-bold">Forma de Pagamento</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-muted/40 rounded-lg p-5 border border-border/50">
                  <p className="text-xs tracking-[0.25em] uppercase text-accent font-semibold mb-2">À vista</p>
                  <p className="text-2xl font-serif font-bold text-foreground">10% de desconto</p>
                  <p className="text-sm text-muted-foreground mt-1">Pagamento à vista no fechamento</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-5 border border-border/50">
                  <p className="text-xs tracking-[0.25em] uppercase text-accent font-semibold mb-2">Cartão</p>
                  <p className="text-2xl font-serif font-bold text-foreground">Em até 10x</p>
                  <p className="text-sm text-muted-foreground mt-1">No cartão de crédito</p>
                </div>
              </div>
              <div className="bg-secondary/40 border-l-4 border-accent rounded-r-lg p-5">
                <p className="font-semibold text-foreground mb-2">Como funciona o parcelamento do projeto:</p>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li className="flex gap-2"><span className="text-accent font-bold">1.</span> <span><strong className="text-foreground">50% de entrada</strong> para iniciar a produção da sua peça no ateliê.</span></li>
                  <li className="flex gap-2"><span className="text-accent font-bold">2.</span> <span>Quando a peça está pronta, fazemos um <strong className="text-foreground">vídeo ao vivo</strong> com você — ou você pode <strong className="text-foreground">conferir pessoalmente no ateliê</strong>.</span></li>
                  <li className="flex gap-2"><span className="text-accent font-bold">3.</span> <span>Aprovado, você paga os <strong className="text-foreground">50% restantes antes da entrega</strong>.</span></li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
