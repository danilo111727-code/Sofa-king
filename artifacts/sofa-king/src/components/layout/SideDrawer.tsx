import { X, Search, ChevronDown, ChevronRight, User, LogOut, UserPlus, Settings, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Show, useUser, useClerk } from "@clerk/react";
import { fetchAdminStatus } from "@/lib/api";

type MenuItem =
  | { label: string; href: string }
  | { label: string; children: { label: string; href: string }[] };

const menu: MenuItem[] = [
  { label: "⭐ BESTSELLERS", href: "/modelos?destaque=1" },
  { label: "TODOS OS MODELOS", href: "/modelos" },
  {
    label: "SOFÁS",
    children: [
      { label: "Sofá Retrátil", href: "/modelos?categoria=retratil" },
      { label: "Sofá-cama", href: "/modelos?categoria=cama" },
      { label: "Sofá de Canto", href: "/modelos?categoria=canto" },
      { label: "Sofá Orgânico", href: "/modelos?categoria=organicos" },
      { label: "Sofá Living", href: "/modelos?categoria=living" },
      { label: "Sofá Fixo", href: "/modelos?categoria=fixo" },
      { label: "Sofá Chaise", href: "/modelos?categoria=chaise" },
      { label: "Sofá Ilha", href: "/modelos?categoria=ilha" },
      { label: "Módulos", href: "/modelos?categoria=modulos" },
    ],
  },
  { label: "POLTRONAS E PUFFS", href: "/modelos" },
  { label: "CAMA", href: "/modelos?categoria=cama" },
  { label: "PRAZO DE ENTREGA", href: "/#prazo-entrega" },
  { label: "GARANTIA", href: "/#garantia" },
  { label: "FORMA DE PAGAMENTO", href: "/#pagamento" },
];

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SideDrawer({ open, onClose }: SideDrawerProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const firstName = user?.firstName || user?.username || user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "";

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (user) {
      fetchAdminStatus().then((s) => setIsAdmin(s.isAdmin)).catch(() => setIsAdmin(false));
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed top-0 left-0 h-full w-[85%] max-w-sm bg-background z-[70] shadow-2xl transition-transform duration-300 overflow-y-auto ${open ? "translate-x-0" : "-translate-x-full"}`}
        data-testid="side-drawer"
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <button onClick={onClose} className="p-1" aria-label="Fechar menu" data-testid="button-drawer-close">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-5 pb-24">
          <div className="mb-6">
            <Show when="signed-out">
              <div className="grid grid-cols-2 gap-2">
                <Link href="/sign-in" onClick={onClose} data-testid="link-drawer-signin">
                  <button className="w-full flex items-center justify-center gap-2 py-3 border border-border rounded-md text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors">
                    <User className="w-4 h-4" /> Entrar
                  </button>
                </Link>
                <Link href="/sign-up" onClick={onClose} data-testid="link-drawer-signup">
                  <button className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90 transition-colors">
                    <UserPlus className="w-4 h-4" /> Cadastrar
                  </button>
                </Link>
              </div>
            </Show>
            <Show when="signed-in">
              <div className="rounded-md border border-border bg-muted/30 px-4 py-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Olá,</p>
                  <p className="text-sm font-semibold text-foreground truncate">{firstName}</p>
                </div>
                <button
                  onClick={() => { onClose(); signOut({ redirectUrl: `${basePath}/` }); }}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-drawer-signout"
                >
                  <LogOut className="w-4 h-4" /> Sair
                </button>
              </div>
              {isAdmin && (
                <Link href="/admin" onClick={onClose} data-testid="link-drawer-admin">
                  <button className="mt-2 w-full flex items-center justify-center gap-2 py-3 bg-[#c9a96e] hover:bg-[#b8954f] text-[#1a1208] rounded-md text-sm font-semibold transition-colors">
                    <Settings className="w-4 h-4" /> Painel Admin
                  </button>
                </Link>
              )}
            </Show>
          </div>

          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Buscar produtos"
              className="w-full bg-muted/50 border border-border rounded-md py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              data-testid="input-drawer-search"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          </div>

          <nav className="flex flex-col">
            {menu.map((item) => {
              const hasChildren = "children" in item;
              const isOpen = expanded === item.label;
              const testId = `link-drawer-${item.label.toLowerCase().replace(/\s+/g, "-")}`;

              if (hasChildren) {
                return (
                  <div key={item.label} className="border-b border-border/50">
                    <button
                      onClick={() => setExpanded(isOpen ? null : item.label)}
                      className="w-full flex items-center justify-between py-4 text-sm font-semibold tracking-wider text-foreground hover:text-primary transition-colors"
                      data-testid={testId}
                    >
                      <span>{item.label}</span>
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="pb-3 pl-3 flex flex-col gap-1">
                        {item.children.map((child) => (
                          <a
                            key={child.label}
                            href={child.href}
                            onClick={onClose}
                            className="py-2.5 px-3 text-sm text-muted-foreground hover:text-primary hover:bg-muted/40 rounded-md transition-colors"
                            data-testid={`link-drawer-sub-${child.label.toLowerCase().replace(/\s+/g, "-")}`}
                          >
                            {child.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center justify-between py-4 border-b border-border/50 text-sm font-semibold tracking-wider text-foreground hover:text-primary transition-colors"
                  data-testid={testId}
                >
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>

          <div className="mt-6 pt-6 border-t border-border">
            <Link href="/favoritos" onClick={onClose} data-testid="link-drawer-favoritos">
              <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-md border border-red-200 bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition-colors">
                <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                Seus Favoritos
              </button>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
