import { useState, useEffect } from "react";
import { useLocation, Redirect } from "wouter";
import { useUser, useClerk, Show } from "@clerk/react";
import {
  fetchProducts,
  fetchAdminStatus,
  createProduct,
  updateProduct,
  deleteProduct,
  type Product,
} from "@/lib/api";

const EMPTY_FORM = {
  name: "",
  price: "",
  description: "",
  longDescription: "",
  image: "",
  dimensions: "",
  colors: "",
  fabrics: "",
  disponibilidade: true,
  prazoEntrega: "",
};

type FormData = typeof EMPTY_FORM;

function toProduct(f: FormData): Omit<Product, "id"> {
  return {
    name: f.name,
    price: Number(f.price),
    description: f.description,
    longDescription: f.longDescription,
    image: f.image || "/images/placeholder.png",
    dimensions: f.dimensions,
    colors: f.colors.split(",").map((s) => s.trim()).filter(Boolean),
    fabrics: f.fabrics.split(",").map((s) => s.trim()).filter(Boolean),
    disponibilidade: f.disponibilidade,
    prazoEntrega: f.prazoEntrega,
  };
}

function fromProduct(p: Product): FormData {
  return {
    name: p.name,
    price: String(p.price),
    description: p.description,
    longDescription: p.longDescription,
    image: p.image,
    dimensions: p.dimensions,
    colors: p.colors.join(", "),
    fabrics: p.fabrics.join(", "),
    disponibilidade: p.disponibilidade,
    prazoEntrega: p.prazoEntrega,
  };
}

function AdminInner() {
  const [, navigate] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    fetchAdminStatus().then((s) => {
      setIsAdmin(s.isAdmin);
      if (s.isAdmin) loadProducts();
      else setLoading(false);
    });
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      setProducts(await fetchProducts());
    } finally {
      setLoading(false);
    }
  }

  function flash(type: "ok" | "err", text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  }

  function openNew() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditId(p.id);
    setForm(fromProduct(p));
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditId(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await updateProduct(editId, toProduct(form));
        flash("ok", "Produto atualizado com sucesso!");
      } else {
        await createProduct(toProduct(form));
        flash("ok", "Produto criado com sucesso!");
      }
      closeForm();
      await loadProducts();
    } catch (err: any) {
      flash("err", err.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteProduct(id);
      flash("ok", "Produto excluído.");
      setDeleteId(null);
      await loadProducts();
    } catch (err: any) {
      flash("err", err.message ?? "Erro ao excluir");
    }
  }

  async function handleLogout() {
    await signOut({ redirectUrl: "/" });
  }

  if (isAdmin === false) {
    const email = user?.primaryEmailAddress?.emailAddress;
    return (
      <div className="min-h-screen bg-[#120d06] text-white flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-[#1a1208] border border-[#3d2e1e] rounded-2xl p-8">
          <div className="text-[#c9a96e] text-4xl mb-3">🔒</div>
          <h1 className="text-xl font-semibold mb-2">Acesso restrito</h1>
          <p className="text-[#a08060] text-sm mb-6">
            Você está logado como <strong className="text-white">{email}</strong>, mas esta conta não tem permissão para acessar o painel administrativo.
          </p>
          <div className="flex gap-3">
            <button onClick={() => navigate("/")} className="flex-1 py-2.5 border border-[#3d2e1e] rounded-lg text-[#a08060] hover:text-white text-sm">
              Voltar ao site
            </button>
            <button onClick={handleLogout} className="flex-1 py-2.5 bg-[#c9a96e] hover:bg-[#b8954f] text-[#1a1208] font-semibold rounded-lg text-sm">
              Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isAdmin === null) {
    return <div className="min-h-screen bg-[#120d06] text-[#a08060] flex items-center justify-center">Verificando acesso...</div>;
  }

  function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div>
        <label className="block text-[#a08060] text-xs font-medium mb-1 uppercase tracking-wider">{label}</label>
        {children}
      </div>
    );
  }

  const inputCls = "w-full bg-[#1a1208] border border-[#3d2e1e] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#5a4030] focus:outline-none focus:border-[#c9a96e] transition-colors";

  return (
    <div className="min-h-screen bg-[#120d06] text-white">
      <header className="bg-[#1a1208] border-b border-[#2d1f10] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[#c9a96e] text-xl">♛</span>
          <div>
            <span className="font-semibold text-white">Sofa King</span>
            <span className="text-[#a08060] text-sm ml-2">— Painel Admin</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" className="text-[#a08060] hover:text-white text-sm transition-colors">Ver site</a>
          <button onClick={handleLogout} className="text-[#a08060] hover:text-red-400 text-sm transition-colors">
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {msg && (
          <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${msg.type === "ok" ? "bg-green-900/40 border border-green-700/50 text-green-400" : "bg-red-900/40 border border-red-700/50 text-red-400"}`}>
            {msg.text}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold">Produtos</h1>
            <p className="text-[#a08060] text-sm mt-0.5">{products.length} modelo{products.length !== 1 ? "s" : ""} cadastrado{products.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={openNew}
            className="bg-[#c9a96e] hover:bg-[#b8954f] text-[#1a1208] font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2"
          >
            + Adicionar Modelo
          </button>
        </div>

        {loading ? (
          <div className="text-center text-[#a08060] py-16">Carregando...</div>
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <div key={p.id} className="bg-[#1a1208] border border-[#2d1f10] rounded-xl p-4 flex items-center gap-4">
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-16 h-16 object-cover rounded-lg bg-[#261a0e] flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-white">{p.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.disponibilidade ? "bg-green-900/50 text-green-400 border border-green-800" : "bg-red-900/50 text-red-400 border border-red-800"}`}>
                      {p.disponibilidade ? "Disponível" : "Indisponível"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-[#a08060] flex-wrap">
                    <span className="text-[#c9a96e] font-semibold">
                      {p.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                    {p.prazoEntrega && <span>🚚 {p.prazoEntrega}</span>}
                    {p.description && <span className="truncate max-w-xs hidden sm:block">{p.description}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => openEdit(p)}
                    className="px-3 py-1.5 bg-[#261a0e] hover:bg-[#3d2e1e] border border-[#3d2e1e] rounded-lg text-sm text-[#c9a96e] transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setDeleteId(p.id)}
                    className="px-3 py-1.5 bg-red-950/50 hover:bg-red-900/50 border border-red-900/50 rounded-lg text-sm text-red-400 transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <div className="text-center text-[#a08060] py-16 border border-dashed border-[#2d1f10] rounded-xl">
                Nenhum produto cadastrado. Clique em "Adicionar Modelo" para começar.
              </div>
            )}
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-[#1a1208] border border-[#3d2e1e] rounded-2xl w-full max-w-lg my-8 shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#2d1f10]">
              <h2 className="font-semibold text-lg">{editId ? "Editar Produto" : "Novo Produto"}</h2>
              <button onClick={closeForm} className="text-[#a08060] hover:text-white text-xl leading-none">✕</button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              <Field label="Nome do Modelo *">
                <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Ex: Sofá Retrátil Milano" />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Preço (R$) *">
                  <input className={inputCls} type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required placeholder="0,00" />
                </Field>
                <Field label="Prazo de Entrega">
                  <input className={inputCls} value={form.prazoEntrega} onChange={(e) => setForm({ ...form, prazoEntrega: e.target.value })} placeholder="Ex: 15-20 dias úteis" />
                </Field>
              </div>

              <Field label="Disponibilidade">
                <div className="flex items-center gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, disponibilidade: true })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${form.disponibilidade ? "bg-green-900/50 border-green-700 text-green-400" : "bg-[#120d06] border-[#2d1f10] text-[#5a4030]"}`}
                  >
                    ✓ Disponível
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, disponibilidade: false })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${!form.disponibilidade ? "bg-red-900/50 border-red-700 text-red-400" : "bg-[#120d06] border-[#2d1f10] text-[#5a4030]"}`}
                  >
                    ✗ Indisponível
                  </button>
                </div>
              </Field>

              <Field label="Descrição Curta">
                <input className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: Elegante e funcional, 3 lugares" />
              </Field>

              <Field label="Descrição Completa">
                <textarea className={`${inputCls} resize-none`} rows={3} value={form.longDescription} onChange={(e) => setForm({ ...form, longDescription: e.target.value })} placeholder="Descrição detalhada do produto..." />
              </Field>

              <Field label="Dimensões">
                <input className={inputCls} value={form.dimensions} onChange={(e) => setForm({ ...form, dimensions: e.target.value })} placeholder="Ex: 2.40m (L) x 1.10m (P) x 0.95m (A)" />
              </Field>

              <Field label="Cores (separadas por vírgula)">
                <input className={inputCls} value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} placeholder="Ex: Bege, Cinza, Terracota" />
              </Field>

              <Field label="Tecidos (separados por vírgula)">
                <input className={inputCls} value={form.fabrics} onChange={(e) => setForm({ ...form, fabrics: e.target.value })} placeholder="Ex: Linho Premium, Veludo Soft" />
              </Field>

              <Field label="URL da Imagem">
                <input className={inputCls} value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="Ex: /images/sofa-novo.png" />
              </Field>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="flex-1 py-2.5 border border-[#3d2e1e] rounded-lg text-[#a08060] hover:text-white text-sm transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#c9a96e] hover:bg-[#b8954f] disabled:opacity-50 text-[#1a1208] font-semibold rounded-lg text-sm transition-colors">
                  {saving ? "Salvando..." : editId ? "Salvar Alterações" : "Criar Produto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1208] border border-[#3d2e1e] rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="font-semibold text-lg mb-2">Excluir Produto</h3>
            <p className="text-[#a08060] text-sm mb-6">
              Tem certeza que deseja excluir <strong className="text-white">{products.find((p) => p.id === deleteId)?.name}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-[#3d2e1e] rounded-lg text-[#a08060] hover:text-white text-sm transition-colors">
                Cancelar
              </button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 bg-red-700 hover:bg-red-600 text-white font-semibold rounded-lg text-sm transition-colors">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  return (
    <>
      <Show when="signed-in">
        <AdminInner />
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}
