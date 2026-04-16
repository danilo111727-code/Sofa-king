import { X, Search, ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

type MenuItem =
  | { label: string; href: string }
  | { label: string; children: { label: string; href: string }[] };

const menu: MenuItem[] = [
  { label: "SOFÁS", href: "#produtos" },
  { label: "POLTRONAS", href: "#produtos" },
  { label: "CAMA", href: "#produtos" },
  { label: "PUFF", href: "#produtos" },
  { label: "PRAZO DE ENTREGA", href: "#prazo-entrega" },
  { label: "GARANTIA", href: "#garantia" },
  { label: "FORMA DE PAGAMENTO", href: "#pagamento" },
];

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SideDrawer({ open, onClose }: SideDrawerProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

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
        </div>
      </aside>
    </>
  );
}
