import { Link } from "wouter";
import { ShoppingCart, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { SideDrawer } from "./SideDrawer";
import logoImg from "@assets/sofa-king-logo.png";

export function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/90 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDrawerOpen(true)}
              data-testid="button-mobile-menu"
              aria-label="Abrir menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <Link href="/" className="flex items-center gap-3" data-testid="link-home-logo">
              <img src={logoImg} alt="Sofá King" className="h-11 w-auto object-contain" />
              <div className="hidden sm:flex flex-col leading-none">
                <span className="font-serif text-xl font-bold tracking-wide text-foreground">SOFÁ KING</span>
                <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-0.5">Estofados planejados</span>
              </div>
            </Link>
          </div>

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
        <div className="bg-[#25D366] text-white text-xs sm:text-sm py-2 overflow-hidden">
          <div className="flex items-center gap-12 whitespace-nowrap animate-marquee">
            <span className="px-4">✓ Frete grátis para diversas regiões do Brasil</span>
            <span className="px-4">✓ Estofados planejados sob medida</span>
            <span className="px-4">✓ Acabamento artesanal premium</span>
            <span className="px-4">✓ Frete grátis para diversas regiões do Brasil</span>
            <span className="px-4">✓ Estofados planejados sob medida</span>
            <span className="px-4">✓ Acabamento artesanal premium</span>
          </div>
        </div>
      </header>
    </>
  );
}
