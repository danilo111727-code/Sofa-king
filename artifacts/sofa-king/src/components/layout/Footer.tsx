import { Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-24 py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="space-y-4">
          <h3 className="font-serif text-2xl font-bold">SOFÁ KING</h3>
          <p className="text-xs tracking-[0.25em] uppercase text-accent font-medium -mt-2">Estofados planejados</p>
          <p className="text-primary-foreground/80 text-sm max-w-xs leading-relaxed pt-2">
            Ateliê de estofados sob medida. Cada peça é desenhada e produzida artesanalmente, conforme a agenda do nosso ateliê.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-4 tracking-wide">Atendimento</h4>
          <ul className="space-y-3 text-sm text-primary-foreground/80">
            <li>
              <a
                href="https://wa.me/5575991495793"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
                data-testid="link-footer-whatsapp"
              >
                WhatsApp: (75) 99149-5793
              </a>
            </li>
            <li>
              <a
                href="https://instagram.com/soffa_king"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors inline-flex items-center gap-2"
                data-testid="link-footer-instagram"
              >
                <Instagram className="w-4 h-4" />
                @soffa_king
              </a>
            </li>
            <li><a href="#garantia" className="hover:text-white transition-colors" data-testid="link-footer-garantia">Garantia</a></li>
            <li><a href="#prazo-entrega" className="hover:text-white transition-colors" data-testid="link-footer-prazo">Prazo de Entrega</a></li>
            <li><a href="#pagamento" className="hover:text-white transition-colors" data-testid="link-footer-pagamento">Forma de Pagamento</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 tracking-wide">Empresa</h4>
          <div className="space-y-2 text-sm text-primary-foreground/80 leading-relaxed">
            <p><span className="text-primary-foreground/60">Razão social:</span><br />Sofá King</p>
            <p><span className="text-primary-foreground/60">CNPJ:</span><br />39.387.184/0001-20</p>
            <p><span className="text-primary-foreground/60">Endereço:</span><br />Avenida Casemiro de Abreu, nº 160<br />Feira de Santana – BA<br />CEP 44053-200</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-primary-foreground/60">
        <p>&copy; {new Date().getFullYear()} Sofá King — Estofados planejados. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
