export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-24 py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-4">
          <h3 className="font-serif text-2xl font-bold">SOFÁ KING</h3>
          <p className="text-xs tracking-[0.25em] uppercase text-accent font-medium -mt-2">Estofados planejados</p>
          <p className="text-primary-foreground/80 text-sm max-w-xs leading-relaxed pt-2">
            Sofás sob medida com design brasileiro contemporâneo, formas orgânicas e conforto absoluto para o seu lar.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-4 tracking-wide">Navegação</h4>
          <ul className="space-y-3 text-sm text-primary-foreground/80">
            <li><a href="#" className="hover:text-white transition-colors" data-testid="link-footer-inicio">Início</a></li>
            <li><a href="#" className="hover:text-white transition-colors" data-testid="link-footer-produtos">Nossos Produtos</a></li>
            <li><a href="#" className="hover:text-white transition-colors" data-testid="link-footer-garantia">Garantia</a></li>
            <li><a href="#" className="hover:text-white transition-colors" data-testid="link-footer-trocas">Trocas e Devoluções</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4 tracking-wide">Atendimento</h4>
          <ul className="space-y-3 text-sm text-primary-foreground/80">
            <li><a href="https://wa.me/5575991495793" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-2" data-testid="link-footer-whatsapp">📱 WhatsApp: (75) 99149-5793</a></li>
            <li><a href="#" className="hover:text-white transition-colors" data-testid="link-footer-fale">Fale Conosco</a></li>
            <li><a href="#" className="hover:text-white transition-colors" data-testid="link-footer-faq">Perguntas Frequentes</a></li>
            <li><a href="#" className="hover:text-white transition-colors" data-testid="link-footer-pedido">Acompanhe seu Pedido</a></li>
            <li><a href="#" className="hover:text-white transition-colors" data-testid="link-footer-cuidados">Cuidados com seu Sofá</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4 tracking-wide">Newsletter</h4>
          <p className="text-sm text-primary-foreground/80 mb-4 leading-relaxed">Inscreva-se para receber novidades e ofertas exclusivas.</p>
          <div className="flex">
            <input 
              type="email" 
              placeholder="Seu e-mail" 
              className="bg-primary-foreground/10 border border-primary-foreground/20 border-r-0 text-white placeholder:text-white/50 px-4 py-2.5 rounded-l-md w-full focus:outline-none focus:ring-1 focus:ring-white/50 text-sm"
              data-testid="input-newsletter"
            />
            <button 
              className="bg-white text-primary px-5 py-2.5 rounded-r-md font-semibold text-sm hover:bg-white/90 transition-colors"
              data-testid="button-newsletter-submit"
            >
              Assinar
            </button>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-primary-foreground/60">
        <p>&copy; {new Date().getFullYear()} Sofa King. Todos os direitos reservados.</p>
        <p>Desenvolvido com excelência no Brasil.</p>
      </div>
    </footer>
  );
}
