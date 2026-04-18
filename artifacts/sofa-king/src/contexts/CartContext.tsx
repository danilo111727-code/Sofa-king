import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

  const CART_KEY = "sk_cart_v1";

  export interface CartItemSize { label: string; basePrice: number; }
  export interface CartItemAlbum { name: string; surcharge: number; }
  export interface CartItemFabric { name: string; }
  export interface CartItemFoam { name: string; priceAdjustment: number; }

  export interface CartItem {
    id: string;
    productId: string;
    productName: string;
    productImage: string;
    size: CartItemSize;
    album?: CartItemAlbum;
    fabric?: CartItemFabric;
    foam?: CartItemFoam;
    unitPrice: number;
    qty: number;
  }

  export type CartItemInput = Omit<CartItem, "id" | "qty">;

  interface CartContextType {
    items: CartItem[];
    count: number;
    subtotal: number;
    add: (item: CartItemInput, qty?: number) => void;
    remove: (id: string) => void;
    setQty: (id: string, qty: number) => void;
    clear: () => void;
  }

  const CartContext = createContext<CartContextType | null>(null);

  export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>(() => {
      if (typeof window === "undefined") return [];
      try {
        const stored = localStorage.getItem(CART_KEY);
        return stored ? JSON.parse(stored) : [];
      } catch { return []; }
    });

    useEffect(() => {
      try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch {}
    }, [items]);

    const count = items.reduce((acc, item) => acc + item.qty, 0);
    const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.qty, 0);

    function add(item: CartItemInput, qty = 1) {
      setItems(prev => [...prev, { ...item, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, qty }]);
    }
    function remove(id: string) { setItems(prev => prev.filter(i => i.id !== id)); }
    function setQty(id: string, qty: number) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, Math.min(99, qty)) } : i));
    }
    function clear() { setItems([]); }

    return (
      <CartContext.Provider value={{ items, count, subtotal, add, remove, setQty, clear }}>
        {children}
      </CartContext.Provider>
    );
  }

  export function useCart(): CartContextType {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
    return ctx;
  }
  