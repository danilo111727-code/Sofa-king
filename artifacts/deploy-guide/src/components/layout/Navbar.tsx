import { Link } from "wouter";
import { ShoppingCart, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImg from "@assets/sofa-king-logo.png";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/90 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-mobile-menu">
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/" className="flex items-center gap-2" data-testid="link-home-logo">
            <img src={logoImg} alt="Sofá King" className="h-12 w-auto object-contain" />
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors" data-testid="link-nav-inicio">Início</Link>
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="link-nav-colecoes">Coleções</Link>
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="link-nav-sobre">Sobre Nós</Link>
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="link-nav-contato">Contato</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" data-testid="button-search">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative" data-testid="button-cart">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent"></span>
          </Button>
        </div>
      </div>
    </header>
  );
}
