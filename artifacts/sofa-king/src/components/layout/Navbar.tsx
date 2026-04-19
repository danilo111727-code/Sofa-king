import { Link } from "wouter";
import { ShoppingCart, Menu, Search, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { SideDrawer } from "./SideDrawer";
import { Show, useUser, useClerk } from "@clerk/react";
import logoImg from "@assets/sofa-king-logo.png";
import { useCart } from "@/contexts/CartContext";

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

function CartIcon() {
  const { count } = useCart();
  return (
    <Link href="/carrinho" data-testid="button-cart">
      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative" aria-label="Ver carrinho">
        <ShoppingCart className="h-5 w-5" />
        {count > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center"
            data-testid="text-cart-count"
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Button>
    </Link>
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-24 grid grid-cols-3 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDrawerOpen(true)}
            data-testid="button-mobile-menu"
            aria-label="Abrir menu"
            className="justify-self-start"
          >
            <Menu className="h-6 w-6" />
          </Button>

          <Link
            href="/"
            className="justify-self-center flex items-center justify-center"
            data-testid="link-home-logo"
          >
            <img
              src={logoImg}
              alt="Sofá King"
              className="h-16 sm:h-20 w-auto object-contain"
            />
          </Link>

          <div className="flex items-center gap-1 sm:gap-2 justify-self-end">
            <AuthButtons />
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" data-testid="button-search">
              <Search className="h-5 w-5" />
            </Button>
            <CartIcon />
          </div>
        </div>
        <div className="bg-primary text-primary-foreground text-sm sm:text-base py-3 overflow-hidden font-medium tracking-wide">
          <div className="flex items-center gap-12 whitespace-nowrap animate-marquee">
            <span className="px-4">✓ Personalize tecido, medidas e acabamento</span>
            <span className="px-4">✓ Acabamento artesanal premium</span>
            <span className="px-4">✓ 10 anos de inovação e comprometimento</span>
            <span className="px-4">✓ Personalize tecido, medidas e acabamento</span>
            <span className="px-4">✓ Acabamento artesanal premium</span>
            <span className="px-4">✓ 10 anos de inovação e comprometimento</span>
          </div>
        </div>
      </header>
    </>
  );
}
