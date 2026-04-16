import { Link } from "wouter";
import { ShoppingCart, Menu, Search, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { SideDrawer } from "./SideDrawer";
import { Show, useUser, useClerk } from "@clerk/react";
import logoImg from "@assets/sofa-king-logo.png";

function AuthButtons() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const firstName = user?.firstName || user?.username || user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "Conta";

  return (
    <>
      <Show when="signed-out">
        <Link href="/sign-in" data-testid="link-signin">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-foreground hover:text-foreground gap-2">
            <User className="h-4 w-4" /> Entrar
          </Button>
        </Link>
        <Link href="/sign-up" data-testid="link-signup">
          <Button size="sm" className="hidden sm:inline-flex bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
            Cadastrar
          </Button>
        </Link>
        <Link href="/sign-in" data-testid="link-signin-mobile" className="sm:hidden">
          <Button variant="ghost" size="icon" aria-label="Entrar">
            <User className="h-5 w-5" />
          </Button>
        </Link>
      </Show>
      <Show when="signed-in">
        <span className="hidden md:inline text-sm text-muted-foreground" data-testid="text-username">
          Olá, <strong className="text-foreground">{firstName}</strong>
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ redirectUrl: `${basePath}/` })}
          className="gap-2"
          data-testid="button-signout"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </Show>
    </>
  );
}

export function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const handler = () => setDrawerOpen(true);
    window.addEventListener("open-side-drawer", handler);
    return () => window.removeEventListener("open-side-drawer", handler);
  }, []);

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

          <div className="flex items-center gap-1 sm:gap-2">
            <AuthButtons />
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
            <span className="px-4">✓ Estofados planejados sob medida</span>
            <span className="px-4">✓ Acabamento artesanal premium</span>
            <span className="px-4">✓ 10 anos de inovação e comprometimento</span>
            <span className="px-4">✓ Estofados planejados sob medida</span>
            <span className="px-4">✓ Acabamento artesanal premium</span>
            <span className="px-4">✓ 10 anos de inovação e comprometimento</span>
          </div>
        </div>
      </header>
    </>
  );
}
