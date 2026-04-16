import { useState, useEffect, useRef } from "react";
import { useLocation, Redirect } from "wouter";
import { useUser, useClerk, Show } from "@clerk/react";
import {
  fetchProducts,
  fetchAdminStatus,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchAdminMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  fetchStats,
  fetchWhatsappEvents,
  fetchClients,
  uploadImage,
  type Product,
  type Material,
  type Stats,
  type WhatsappEvent,
  type Client,
} from "@/lib/api";

const EMPTY_FORM = {
  name: "", price: "", description: "", longDescription: "", image: "",
  dimensions: "", colors: "", fabrics: "", disponibilidade: true, prazoEntrega: "",
};

type FormData = typeof EMPTY_FORM;

function toProduct(f: FormData): Omit<Product, "id"> {
  return {
    name: f.name, price: Number(f.price), description: f.description,
    longDescription: f.longDescription, image: f.image || "/images/placeholder.png",
    dimensions: f.dimensions,
    colors: f.colors.split(",").map((s) => s.trim()).filter(Boolean),
    fabrics: f.fabrics.split(",").map((s) => s.trim()).filter(Boolean),
    disponibilidade: f.disponibilidade, prazoEntrega: f.prazoEntrega,
  };
}

function fromProduct(p: Product): FormData {
  return {
    name: p.name, price: String(p.price), description: p.description,
    longDescription: p.longDescription, image: p.image, dimensions: p.dimensions,
    colors: p.colors.join(", "), fabrics: p.fabrics.join(", "),
    disponibilidade: p.disponibilidade, prazoEntrega: p.prazoEntrega,
  };
}

const inputCls = "w-full bg-[#1a1208] border border-[#3d2e1e] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#5a4030] focus:outline-none focus:border-[#c9a96e] transition-colors";
const cardCls = "bg-[#1a1208] border border-[#2d1f10] rounded-xl p-4";
const goldBtn = "bg-[#c9a96e] hover:bg-[#b8954f] text-[#1a1208] font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors";

type Tab = "produtos" | "materiais" | "clientes" | "estatisticas" | "whatsapp";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[#a08060] text-xs font-medium mb-1 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function AdminInner() {
  const [, navigate] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("produtos");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  function flash(type: "ok" | "err", text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  }

  useEffect(() => {
    fetchAdminStatus().then((s) => setIsAdmin(s.isAdmin));
  }, []);

  async function handleLogout() { await signOut({ redirectUrl: "/" }); }

  if (isAdmin === null) {
    return <div className="min-h-screen bg-[#120d06] text-[#a08060] flex items-center justify-center">Verificando acesso...</div>;
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
            <button onClick={() => navigate("/")} className="flex-1 py-2.5 border border-[#3d2e1e] rounded-lg text-[#a08060] hover:text-white text-sm">Voltar ao site</button>
            <button onClick={handleLogout} className="flex-1 py-2.5 bg-[#c9a96e] hover:bg-[#b8954f] text-[#1a1208] font-semibold rounded-lg text-sm">Sair</button>
          </div>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "produtos", label: "Produtos" },
    { key: "materiais", label: "Materiais" },
    { key: "clientes", label: "Clientes" },
    { key: "estatisticas", label: "Estatísticas" },
    { key: "whatsapp", label: "WhatsApp" },
  ];

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
          <button onClick={handleLogout} className="text-[#a08060] hover:text-red-400 text-sm transition-colors">Sair</button>
        </div>
      </header>

      <nav className="bg-[#1a1208] border-b border-[#2d1f10] px-6 overflow-x-auto">
        <div className="max-w-5xl mx-auto flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.key
                  ? "border-[#c9a96e] text-[#c9a96e]"
                  : "border-transparent text-[#a08060] hover:text-white"
              }`}
              data-testid={`tab-${t.key}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {msg && (
          <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${msg.type === "ok" ? "bg-green-900/40 border border-green-700/50 text-green-400" : "bg-red-900/40 border border-red-700/50 text-red-400"}`}>
            {msg.text}
          </div>
        )}

        {tab === "produtos" && <ProdutosTab flash={flash} />}
        {tab === "materiais" && <MateriaisTab flash={flash} />}
        {tab === "clientes" && <ClientesTab />}
        {tab === "estatisticas" && <EstatisticasTab />}
        {tab === "whatsapp" && <WhatsappTab />}
      </main>
    </div>
  );
}

// ---------- PRODUTOS ----------
function ProdutosTab({ flash }: { flash: (t: "ok" | "err", s: string) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    try { setProducts(await fetchProducts()); } finally { setLoading(false); }
  }

  function openNew() { setEditId(null); setForm(EMPTY_FORM); setShowForm(true); }
  function openEdit(p: Product) { setEditId(p.id); setForm(fromProduct(p)); setShowForm(true); }
  function closeForm() { setShowForm(false); setEditId(null); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) { await updateProduct(editId, toProduct(form)); flash("ok", "Produto atualizado!"); }
      else { await createProduct(toProduct(form)); flash("ok", "Produto criado!"); }
      closeForm(); await load();
    } catch (err: any) { flash("err", err.message ?? "Erro ao salvar"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try { await deleteProduct(id); flash("ok", "Produto excluído."); setDeleteId(null); await load(); }
    catch (err: any) { flash("err", err.message ?? "Erro ao excluir"); }
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const { url } = await uploadImage(file);
      setForm((f) => ({ ...f, image: url }));
      flash("ok", "Imagem enviada!");
    } catch (err: any) { flash("err", err.message ?? "Erro no upload"); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Produtos</h1>
          <p className="text-[#a08060] text-sm mt-0.5">{products.length} modelo{products.length !== 1 ? "s" : ""} cadastrado{products.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={openNew} className={goldBtn} data-testid="button-new-product">+ Adicionar Modelo</button>
      </div>

      {loading ? (
        <div className="text-center text-[#a08060] py-16">Carregando...</div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p.id} className={`${cardCls} flex items-center gap-4`}>
              <img src={p.image} alt={p.name} className="w-16 h-16 object-cover rounded-lg bg-[#261a0e] flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium text-white">{p.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.disponibilidade ? "bg-green-900/50 text-green-400 border border-green-800" : "bg-red-900/50 text-red-400 border border-red-800"}`}>
                    {p.disponibilidade ? "Disponível" : "Indisponível"}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-[#a08060] flex-wrap">
                  <span className="text-[#c9a96e] font-semibold">{p.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                  {p.prazoEntrega && <span>🚚 {p.prazoEntrega}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => openEdit(p)} className="px-3 py-1.5 bg-[#261a0e] hover:bg-[#3d2e1e] border border-[#3d2e1e] rounded-lg text-sm text-[#c9a96e]">Editar</button>
                <button onClick={() => setDeleteId(p.id)} className="px-3 py-1.5 bg-red-950/50 hover:bg-red-900/50 border border-red-900/50 rounded-lg text-sm text-red-400">Excluir</button>
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

      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-[#1a1208] border border-[#3d2e1e] rounded-2xl w-full max-w-lg my-8 shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#2d1f10]">
              <h2 className="font-semibold text-lg">{editId ? "Editar Produto" : "Novo Produto"}</h2>
              <button onClick={closeForm} className="text-[#a08060] hover:text-white text-xl leading-none">✕</button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              <Field label="Nome do Modelo *">
                <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Preço (R$) *">
                  <input className={inputCls} type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                </Field>
                <Field label="Prazo de Entrega">
                  <input className={inputCls} value={form.prazoEntrega} onChange={(e) => setForm({ ...form, prazoEntrega: e.target.value })} placeholder="Ex: 15-20 dias" />
                </Field>
              </div>
              <Field label="Disponibilidade">
                <div className="flex items-center gap-3 mt-1">
                  <button type="button" onClick={() => setForm({ ...form, disponibilidade: true })} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${form.disponibilidade ? "bg-green-900/50 border-green-700 text-green-400" : "bg-[#120d06] border-[#2d1f10] text-[#5a4030]"}`}>✓ Disponível</button>
                  <button type="button" onClick={() => setForm({ ...form, disponibilidade: false })} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${!form.disponibilidade ? "bg-red-900/50 border-red-700 text-red-400" : "bg-[#120d06] border-[#2d1f10] text-[#5a4030]"}`}>✗ Indisponível</button>
                </div>
              </Field>
              <Field label="Descrição Curta">
                <input className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </Field>
              <Field label="Descrição Completa">
                <textarea className={`${inputCls} resize-none`} rows={3} value={form.longDescription} onChange={(e) => setForm({ ...form, longDescription: e.target.value })} />
              </Field>
              <Field label="Dimensões">
                <input className={inputCls} value={form.dimensions} onChange={(e) => setForm({ ...form, dimensions: e.target.value })} />
              </Field>
              <Field label="Cores (separadas por vírgula)">
                <input className={inputCls} value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} />
              </Field>
              <Field label="Tecidos (separados por vírgula)">
                <input className={inputCls} value={form.fabrics} onChange={(e) => setForm({ ...form, fabrics: e.target.value })} />
              </Field>
              <Field label="Imagem">
                <div className="flex gap-2">
                  <input className={inputCls} value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="URL ou faça upload" />
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
                  <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className="bg-[#261a0e] hover:bg-[#3d2e1e] border border-[#3d2e1e] rounded-lg px-3 text-sm text-[#c9a96e] disabled:opacity-50 whitespace-nowrap">
                    {uploading ? "Enviando..." : "📷 Upload"}
                  </button>
                </div>
                {form.image && (
                  <img src={form.image} alt="preview" className="mt-2 w-full h-32 object-cover rounded-lg bg-[#261a0e]" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                )}
              </Field>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="flex-1 py-2.5 border border-[#3d2e1e] rounded-lg text-[#a08060] hover:text-white text-sm">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#c9a96e] hover:bg-[#b8954f] disabled:opacity-50 text-[#1a1208] font-semibold rounded-lg text-sm">
                  {saving ? "Salvando..." : editId ? "Salvar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1208] border border-[#3d2e1e] rounded-2xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-lg mb-2">Excluir Produto</h3>
            <p className="text-[#a08060] text-sm mb-6">
              Tem certeza que deseja excluir <strong className="text-white">{products.find((p) => p.id === deleteId)?.name}</strong>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-[#3d2e1e] rounded-lg text-[#a08060] hover:text-white text-sm">Cancelar</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 bg-red-700 hover:bg-red-600 text-white font-semibold rounded-lg text-sm">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ---------- MATERIAIS ----------
const EMPTY_MAT = { type: "tecido" as "tecido" | "espuma", name: "", description: "", priceAdjustment: 0, active: true };

function MateriaisTab({ flash }: { flash: (t: "ok" | "err", s: string) => void }) {
  const [items, setItems] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_MAT);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    try { setItems(await fetchAdminMaterials()); } finally { setLoading(false); }
  }

  function openNew() { setEditId(null); setForm(EMPTY_MAT); setShowForm(true); }
  function openEdit(m: Material) { setEditId(m.id); setForm({ type: m.type, name: m.name, description: m.description, priceAdjustment: m.priceAdjustment, active: m.active }); setShowForm(true); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) { await updateMaterial(editId, form); flash("ok", "Material atualizado!"); }
      else { await createMaterial(form); flash("ok", "Material criado!"); }
      setShowForm(false); await load();
    } catch (err: any) { flash("err", err.message ?? "Erro"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try { await deleteMaterial(id); flash("ok", "Excluído."); setDeleteId(null); await load(); }
    catch (err: any) { flash("err", err.message ?? "Erro"); }
  }

  const tecidos = items.filter((m) => m.type === "tecido");
  const espumas = items.filter((m) => m.type === "espuma");

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Tecidos &amp; Espumas</h1>
          <p className="text-[#a08060] text-sm mt-0.5">{items.length} materiais. Ajuste de preço em % aplicado sobre o preço base.</p>
        </div>
        <button onClick={openNew} className={goldBtn} data-testid="button-new-material">+ Adicionar Material</button>
      </div>

      {loading ? (
        <div className="text-center text-[#a08060] py-16">Carregando...</div>
      ) : (
        <div className="space-y-6">
          {[
            { title: "Tecidos", list: tecidos },
            { title: "Espumas", list: espumas },
          ].map((g) => (
            <div key={g.title}>
              <h2 className="text-sm uppercase tracking-wider text-[#a08060] mb-2 font-semibold">{g.title}</h2>
              <div className="space-y-2">
                {g.list.map((m) => (
                  <div key={m.id} className={`${cardCls} flex items-center gap-4`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-white">{m.name}</h3>
                        {!m.active && <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/50 text-red-400 border border-red-800">inativo</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${m.priceAdjustment === 0 ? "bg-[#261a0e] text-[#a08060] border-[#3d2e1e]" : m.priceAdjustment > 0 ? "bg-amber-900/30 text-amber-400 border-amber-800/50" : "bg-green-900/30 text-green-400 border-green-800/50"}`}>
                          {m.priceAdjustment > 0 ? "+" : ""}{m.priceAdjustment}%
                        </span>
                      </div>
                      <p className="text-sm text-[#a08060] mt-1 truncate">{m.description}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => openEdit(m)} className="px-3 py-1.5 bg-[#261a0e] hover:bg-[#3d2e1e] border border-[#3d2e1e] rounded-lg text-sm text-[#c9a96e]">Editar</button>
                      <button onClick={() => setDeleteId(m.id)} className="px-3 py-1.5 bg-red-950/50 hover:bg-red-900/50 border border-red-900/50 rounded-lg text-sm text-red-400">Excluir</button>
                    </div>
                  </div>
                ))}
                {g.list.length === 0 && (
                  <div className="text-center text-[#a08060] py-6 border border-dashed border-[#2d1f10] rounded-xl text-sm">Nenhum {g.title.toLowerCase()} cadastrado.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-[#1a1208] border border-[#3d2e1e] rounded-2xl w-full max-w-lg my-8 shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#2d1f10]">
              <h2 className="font-semibold text-lg">{editId ? "Editar Material" : "Novo Material"}</h2>
              <button onClick={() => setShowForm(false)} className="text-[#a08060] hover:text-white text-xl leading-none">✕</button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              <Field label="Tipo *">
                <div className="flex gap-3">
                  <button type="button" onClick={() => setForm({ ...form, type: "tecido" })} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${form.type === "tecido" ? "bg-[#c9a96e] border-[#c9a96e] text-[#1a1208]" : "bg-[#120d06] border-[#2d1f10] text-[#a08060]"}`}>Tecido</button>
                  <button type="button" onClick={() => setForm({ ...form, type: "espuma" })} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${form.type === "espuma" ? "bg-[#c9a96e] border-[#c9a96e] text-[#1a1208]" : "bg-[#120d06] border-[#2d1f10] text-[#a08060]"}`}>Espuma</button>
                </div>
              </Field>
              <Field label="Nome *">
                <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </Field>
              <Field label="Descrição">
                <textarea className={`${inputCls} resize-none`} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </Field>
              <Field label="Ajuste de Preço (%)">
                <input className={inputCls} type="number" step="0.1" value={form.priceAdjustment} onChange={(e) => setForm({ ...form, priceAdjustment: Number(e.target.value) })} placeholder="0 = sem alteração; 10 = +10%; -5 = -5%" />
              </Field>
              <Field label="Status">
                <div className="flex gap-3">
                  <button type="button" onClick={() => setForm({ ...form, active: true })} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${form.active ? "bg-green-900/50 border-green-700 text-green-400" : "bg-[#120d06] border-[#2d1f10] text-[#5a4030]"}`}>✓ Ativo</button>
                  <button type="button" onClick={() => setForm({ ...form, active: false })} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${!form.active ? "bg-red-900/50 border-red-700 text-red-400" : "bg-[#120d06] border-[#2d1f10] text-[#5a4030]"}`}>✗ Inativo</button>
                </div>
              </Field>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-[#3d2e1e] rounded-lg text-[#a08060] hover:text-white text-sm">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#c9a96e] hover:bg-[#b8954f] disabled:opacity-50 text-[#1a1208] font-semibold rounded-lg text-sm">{saving ? "Salvando..." : "Salvar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1208] border border-[#3d2e1e] rounded-2xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-lg mb-2">Excluir Material</h3>
            <p className="text-[#a08060] text-sm mb-6">Tem certeza que deseja excluir este material?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-[#3d2e1e] rounded-lg text-[#a08060] hover:text-white text-sm">Cancelar</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 bg-red-700 hover:bg-red-600 text-white font-semibold rounded-lg text-sm">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ---------- CLIENTES ----------
function ClientesTab() {
  const [data, setData] = useState<{ totalCount: number; users: Client[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClients()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-[#a08060] py-16">Carregando...</div>;
  if (error) return <div className="text-center text-red-400 py-16">{error}</div>;
  if (!data) return null;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Clientes Cadastrados</h1>
        <p className="text-[#a08060] text-sm mt-0.5">{data.totalCount} {data.totalCount === 1 ? "cliente" : "clientes"} no total</p>
      </div>
      <div className="space-y-2">
        {data.users.map((u) => {
          const name = `${u.firstName} ${u.lastName}`.trim() || "(sem nome)";
          return (
            <div key={u.id} className={`${cardCls} flex items-center gap-4`}>
              {u.imageUrl ? (
                <img src={u.imageUrl} alt={name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#261a0e] flex items-center justify-center text-[#c9a96e] font-semibold">
                  {(u.email[0] || "?").toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white truncate">{name}</div>
                <div className="text-sm text-[#a08060] truncate">{u.email}</div>
              </div>
              <div className="text-right text-xs text-[#a08060] flex-shrink-0">
                <div>Cadastro: {new Date(u.createdAt).toLocaleDateString("pt-BR")}</div>
                {u.lastSignInAt && <div>Último login: {new Date(u.lastSignInAt).toLocaleDateString("pt-BR")}</div>}
              </div>
            </div>
          );
        })}
        {data.users.length === 0 && (
          <div className="text-center text-[#a08060] py-16 border border-dashed border-[#2d1f10] rounded-xl">Nenhum cliente cadastrado ainda.</div>
        )}
      </div>
    </>
  );
}

// ---------- ESTATÍSTICAS ----------
function EstatisticasTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats().then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-[#a08060] py-16">Carregando...</div>;
  if (!stats) return <div className="text-center text-red-400 py-16">Não foi possível carregar estatísticas</div>;

  const kpis = [
    { label: "Visualizações totais", value: stats.totalViews },
    { label: "Visualizações últimos 7 dias", value: stats.views7d },
    { label: "Visualizações últimos 30 dias", value: stats.views30d },
    { label: "Cliques no WhatsApp", value: stats.totalWhatsapp },
    { label: "WhatsApp últimos 7 dias", value: stats.whatsapp7d },
    { label: "WhatsApp últimos 30 dias", value: stats.whatsapp30d },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Estatísticas</h1>
        <p className="text-[#a08060] text-sm mt-0.5">Visão geral do tráfego e engajamento.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className={cardCls}>
            <div className="text-2xl font-bold text-[#c9a96e]">{k.value}</div>
            <div className="text-xs text-[#a08060] mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className={cardCls}>
          <h3 className="font-semibold mb-3 text-[#c9a96e]">Produtos mais vistos</h3>
          {stats.topViewed.length === 0 ? (
            <p className="text-sm text-[#a08060]">Sem dados ainda.</p>
          ) : (
            <ul className="space-y-2">
              {stats.topViewed.map((p) => (
                <li key={p.id} className="flex justify-between text-sm">
                  <span className="text-white truncate pr-2">{p.name}</span>
                  <span className="text-[#c9a96e] font-semibold flex-shrink-0">{p.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={cardCls}>
          <h3 className="font-semibold mb-3 text-[#c9a96e]">Produtos com mais cliques no WhatsApp</h3>
          {stats.topWhatsapp.length === 0 ? (
            <p className="text-sm text-[#a08060]">Sem dados ainda.</p>
          ) : (
            <ul className="space-y-2">
              {stats.topWhatsapp.map((p) => (
                <li key={p.id} className="flex justify-between text-sm">
                  <span className="text-white truncate pr-2">{p.name}</span>
                  <span className="text-[#c9a96e] font-semibold flex-shrink-0">{p.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

// ---------- WHATSAPP EVENTS ----------
function WhatsappTab() {
  const [events, setEvents] = useState<WhatsappEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWhatsappEvents().then(setEvents).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-[#a08060] py-16">Carregando...</div>;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Cliques no WhatsApp</h1>
        <p className="text-[#a08060] text-sm mt-0.5">Histórico recente de quem clicou para falar conosco. {events.length} {events.length === 1 ? "evento" : "eventos"}.</p>
      </div>

      <div className="space-y-2">
        {events.map((e) => (
          <div key={e.id} className={`${cardCls} flex items-center justify-between gap-4`}>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-white truncate">{e.productName || "Botão geral (rodapé)"}</div>
              {e.productId && <div className="text-xs text-[#a08060] truncate">ID: {e.productId}</div>}
            </div>
            <div className="text-xs text-[#a08060] flex-shrink-0 text-right">
              {new Date(e.ts).toLocaleString("pt-BR")}
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="text-center text-[#a08060] py-16 border border-dashed border-[#2d1f10] rounded-xl">Nenhum clique registrado ainda.</div>
        )}
      </div>
    </>
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
