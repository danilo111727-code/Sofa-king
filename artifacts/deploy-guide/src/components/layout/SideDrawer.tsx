import { X, Search, ChevronRight } from "lucide-react";
import { useEffect } from "react";

const categories = [
  { label: "SOFÁS", href: "#produtos", hasArrow: true },
  { label: "BEST SELLERS", href: "#produtos", hasArrow: false },
  { label: "POLTRONAS E PUFFS", href: "#produtos", hasArrow: true },
  { label: "INSPIRAÇÕES", href: "#filosofia", hasArrow: false },
  { label: "SHOWROOM", href: "#contato", hasArrow: true },
  { label: "CONTATO", href: "#contato", hasArrow: false },
  { label: "PERGUNTAS FREQUENTES", href: "#filosofia", hasArrow: false },
];

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SideDrawer({ open, onClose }: SideDrawerProps) {
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
        className={`fixed top-0 left-0 h-full w-[85%] max-w-sm bg-background z-[70] shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}
        data-testid="side-drawer"
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <button onClick={onClose} className="p-1" aria-label="Fechar menu" data-testid="button-drawer-close">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-5">
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
            {categories.map((cat) => (
              <a
                key={cat.label}
                href={cat.href}
                onClick={onClose}
                className="flex items-center justify-between py-4 border-b border-border/50 text-sm font-semibold tracking-wider text-foreground hover:text-primary transition-colors"
                data-testid={`link-drawer-${cat.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <span>{cat.label}</span>
                {cat.hasArrow && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </a>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
