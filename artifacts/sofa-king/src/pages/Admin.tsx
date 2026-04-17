import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useUser, useClerk } from "@clerk/react";
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
  fetchAdminAlbums,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  fetchStats,
  fetchWhatsappEvents,
  fetchClients,
  uploadImage,
  fetchSiteSettings,
  updateSiteSettings,
  type Product,
  type Material,
  type Album,
  type FabricSample,
  type SizeOption,
  type Stats,
  type WhatsappEvent,
  type Client,
} from "@/lib/api";
import { CATEGORIES, displayName, type ProductCategory } from "@/lib/categories";
import { DiagramaEditor } from "@/components/DiagramaEditor";

const inputCls = "w-full bg-[#1a1208] border border-[#3d2e1e] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#5a4030] focus:outline-none focus:border-[#c9a96e] transition-colors";
const cardCls = "bg-[#1a1208] border border-[#2d1f10] rounded-xl p-4";
const goldBtn = "bg-[#c9a96e] hover:bg-[#b8954f] text-[#1a1208] font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors";
const ghostBtn = "px-3 py-1.5 bg-[#261a0e] hover:bg-[#3d2e1e] border border-[#3d2e1e] rounded-lg text-sm text-[#c9a96e]";
const dangerBtn = "px-3 py-1.5 bg-red-950/50 hover:bg-red-900/50 border border-red-900/50 rounded-lg text-sm text-red-400";

type Tab = "produtos" | "materiais" | "clientes" | "estatisticas" | "whatsapp" | "configuracoes";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[#a08060] text-xs font-medium mb-1 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function brl(v: number | null | undefined): string {
  const n = (v == null || !isFinite(v as number)) ? 0 : (v as number);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Per-size surcharge editor. Empty input = use default (baseLabel) value. */
function SurchargeBySizeEditor({
  knownSizes,
  value,
  onChange,
  defaultValue,
  helpLabel,
}: {
  knownSizes: string[];
  value: Record<string, number>;
  onChange: (next: Record<string, number>) => void;
  defaultValue: number;
  helpLabel: string;
}) {
  if (knownSizes.length === 0) {
    return (
      <p className="text-xs text-[#7a6040]">
        Nenhuma metragem cadastrada nos produtos ainda. Cadastre metragens nos produtos para poder definir acréscimos específicos aqui.
      </p>
    );
  }
  const setOne = (label: string, raw: string) => {
    const next = { ...value };
    if (raw.trim() === "") { delete next[label]; }
    else { const n = Number(raw); if (Number.isFinite(n)) next[label] = n; }
    onChange(next);
  };
  return (
    <div className="space-y-2">
      <p className="text-xs text-[#7a6040]">
        {helpLabel} Deixe em branco para usar o valor padrão (<strong>{brl(defaultValue)}</strong>).
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {knownSizes.map((label) => {
          const has = value[label] !== undefined;
          return (
            <div key={label} className="flex items-center gap-2 bg-[#120d06] border border-[#2d1f10] rounded-lg px-3 py-2">
              <span className="text-sm text-[#d9c9a0] w-20 flex-shrink-0">{label}</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a4030] text-sm">R$</span>
                <input
                  type="number" step="0.01"
                  className={`${inputCls} pl-9`}
                  value={has ? String(value[label]) : ""}
                  placeholder={String(defaultValue)}
                  onChange={(e) => setOne(label, e.target.value)}
                  data-testid={`input-surcharge-${label.replace(/\s+/g, "")}`}
                />
              </div>
              {has && (
                <button type="button" onClick={() => setOne(label, "")} className="text-xs text-[#a08060] hover:text-white flex-shrink-0" title="Voltar ao padrão">✕</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Admin() {
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
    { key: "configuracoes", label: "Configurações" },
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
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
        {tab === "configuracoes" && <ConfiguracoesTab flash={flash} />}
      </main>
    </div>
  );
}

// ======================================================================
// PRODUTOS
// ======================================================================

interface ProdutoForm {
  name: string;
  category: ProductCategory;
  description: string;
  longDescription: string;
  images: string[];
  dimensions: string;
  prazoEntrega: string;
  disponibilidade: boolean;
  bestseller: boolean;
  sizes: SizeOption[];
  diagramaUrl: string;
  diagramaAnotacoes: import("@/lib/api").DiagramaAnotacao[];
}

const EMPTY_PRODUTO: ProdutoForm = {
  name: "", category: "", description: "", longDescription: "", images: [],
  dimensions: "", prazoEntrega: "", disponibilidade: true, bestseller: false,
  sizes: [], diagramaUrl: "", diagramaAnotacoes: [],
};

function ProdutosTab({ flash }: { flash: (t: "ok" | "err", s: string) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [foams, setFoams] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ProdutoForm>(EMPTY_PRODUTO);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [expandedSizes, setExpandedSizes] = useState<Set<number>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    try {
      const [prods, als, fos] = await Promise.all([fetchProducts(), fetchAdminAlbums(), fetchAdminMaterials()]);
      setProducts(prods.map((p) => ({ ...p, price: (p.price == null || !isFinite(p.price)) ? 0 : p.price })));
      setAlbums(als.filter((a) => a.active));
      setFoams(fos.filter((m) => m.active));
    } catch { /* silently ignore load errors — form stays open */ }
    finally { setLoading(false); }
  }

  function toggleSizeExpand(i: number) {
    setExpandedSizes((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }
  function updateAlbumSurcharge(sizeIdx: number, albumId: string, value: number) {
    setForm((f) => {
      const sizes = [...f.sizes];
      sizes[sizeIdx] = {
        ...sizes[sizeIdx],
        albumSurcharges: { ...(sizes[sizeIdx].albumSurcharges ?? {}), [albumId]: value },
      };
      return { ...f, sizes };
    });
  }
  function updateFoamSurcharge(sizeIdx: number, foamId: string, value: number) {
    setForm((f) => {
      const sizes = [...f.sizes];
      sizes[sizeIdx] = {
        ...sizes[sizeIdx],
        foamSurcharges: { ...(sizes[sizeIdx].foamSurcharges ?? {}), [foamId]: value },
      };
      return { ...f, sizes };
    });
  }

  function openNew() { setEditId(null); setForm(EMPTY_PRODUTO); setShowForm(true); }
  function openEdit(p: Product) {
    setEditId(p.id);
    const validCats: ProductCategory[] = CATEGORIES.map((c) => c.id);
    const cat: ProductCategory = validCats.includes(p.category as ProductCategory) ? (p.category as ProductCategory) : "";
    setForm({
      name: p.name,
      category: cat,
      description: p.description, longDescription: p.longDescription,
      images: p.images && p.images.length ? [...p.images] : (p.image ? [p.image] : []),
      dimensions: p.dimensions, prazoEntrega: p.prazoEntrega,
      disponibilidade: p.disponibilidade,
      bestseller: Boolean((p as any).bestseller),
      sizes: p.sizes && p.sizes.length ? p.sizes : [],
      diagramaUrl: p.diagramaUrl ?? "",
      diagramaAnotacoes: p.diagramaAnotacoes ?? [],
    });
    setShowForm(true);
  }
  function closeForm() { setShowForm(false); setEditId(null); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (form.sizes.length === 0) {
      flash("err", "Adicione pelo menos uma metragem.");
      return;
    }
    setSaving(true);
    try {
      const payload: Omit<Product, "id"> = {
        name: form.name,
        category: form.category,
        description: form.description,
        longDescription: form.longDescription,
        images: form.images,
        image: form.images[0] || "/images/placeholder.png",
        dimensions: form.dimensions,
        prazoEntrega: form.prazoEntrega || "A consultar",
        disponibilidade: form.disponibilidade,
        bestseller: form.bestseller,
        sizes: form.sizes,
        colors: [],
        fabrics: [],
        price: Math.min(...form.sizes.map((s) => s.basePrice).filter((n) => n > 0)) || 0,
        diagramaUrl: form.diagramaUrl || undefined,
        diagramaAnotacoes: form.diagramaAnotacoes.length > 0 ? form.diagramaAnotacoes : undefined,
      };
      if (editId) { await updateProduct(editId, payload); flash("ok", "Produto atualizado!"); }
      else { await createProduct(payload); flash("ok", "Produto criado!"); }
      closeForm(); await load();
    } catch (err: any) { flash("err", err.message ?? "Erro ao salvar"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try { await deleteProduct(id); flash("ok", "Produto excluído."); setDeleteId(null); await load(); }
    catch (err: any) { flash("err", err.message ?? "Erro ao excluir"); }
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const f of arr) {
        const { url } = await uploadImage(f);
        uploaded.push(url);
      }
      setForm((f) => ({ ...f, images: [...f.images, ...uploaded] }));
      flash("ok", `${uploaded.length} imagem${uploaded.length !== 1 ? "s" : ""} enviada${uploaded.length !== 1 ? "s" : ""}!`);
    } catch (err: any) { flash("err", err.message ?? "Erro no upload"); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  function moveImage(idx: number, dir: -1 | 1) {
    setForm((f) => {
      const arr = [...f.images];
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= arr.length) return f;
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return { ...f, images: arr };
    });
  }
  function removeImage(idx: number) {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  }

  function updateSize(i: number, patch: Partial<SizeOption>) {
    setForm((f) => {
      const sizes = [...f.sizes];
      sizes[i] = { ...sizes[i], ...patch };
      return { ...f, sizes };
    });
  }
  function addSize() {
    setForm((f) => ({ ...f, sizes: [...f.sizes, { label: "", basePrice: 0 }] }));
  }
  function removeSize(i: number) {
    setForm((f) => ({ ...f, sizes: f.sizes.filter((_, idx) => idx !== i) }));
  }
  function copyFrom(id: string) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    setForm((f) => ({
      ...f,
      sizes: p.sizes.map((s) => ({
        ...s,
        albumSurcharges: s.albumSurcharges ? { ...s.albumSurcharges } : {},
        foamSurcharges: s.foamSurcharges ? { ...s.foamSurcharges } : {},
      })),
    }));
    setExpandedSizes(new Set());
    flash("ok", `Metragens e acréscimos copiados de "${p.name}".`);
  }
  function fillStandardSizes() {
    const labels = ["1,60 m","1,80 m","2,00 m","2,20 m","2,40 m","2,60 m","2,80 m","3,00 m","3,20 m","3,40 m","3,60 m","3,80 m","4,00 m"];
    setForm((f) => ({ ...f, sizes: labels.map((label) => ({ label, basePrice: 0, albumSurcharges: {}, foamSurcharges: {} })) }));
    setExpandedSizes(new Set());
    flash("ok", "Metragens padrão preenchidas — agora é só colocar o preço de cada uma.");
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
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
                  <h3 className="font-medium text-white">{displayName(p.name, p.category)}</h3>
                  {p.category && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#c9a96e]/20 text-[#c9a96e] border border-[#c9a96e]/30 uppercase tracking-wider">
                      {CATEGORIES.find(c => c.id === p.category)?.label}
                    </span>
                  )}
                  {p.images && p.images.length > 1 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#261a0e] text-[#a08060] border border-[#3d2e1e]">
                      {p.images.length} fotos
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.disponibilidade ? "bg-green-900/50 text-green-400 border border-green-800" : "bg-red-900/50 text-red-400 border border-red-800"}`}>
                    {p.disponibilidade ? "Disponível" : "Indisponível"}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-[#a08060] flex-wrap">
                  <span className="text-[#c9a96e] font-semibold">A partir de {brl(p.price)}</span>
                  <span>{p.sizes.length} metragem{p.sizes.length !== 1 ? "s" : ""}</span>
                  {p.prazoEntrega && <span>🚚 {p.prazoEntrega}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => openEdit(p)} className={ghostBtn}>Editar</button>
                <button onClick={() => setDeleteId(p.id)} className={dangerBtn}>Excluir</button>
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
          <div className="bg-[#1a1208] border border-[#3d2e1e] rounded-2xl w-full max-w-2xl my-8 shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#2d1f10] sticky top-0 bg-[#1a1208] z-10">
              <h2 className="font-semibold text-lg">{editId ? "Editar Produto" : "Novo Produto"}</h2>
              <button onClick={closeForm} className="text-[#a08060] hover:text-white text-xl leading-none">✕</button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nome do Modelo *">
                  <input
                    className={inputCls}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: Istambul"
                    required
                  />
                </Field>
                <Field label="Categoria">
                  <select
                    className={inputCls}
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as ProductCategory })}
                    data-testid="select-category"
                  >
                    <option value="">— Sem categoria —</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {form.name && (
                <div className="text-xs text-[#a08060] -mt-2">
                  Nome no site: <strong className="text-[#c9a96e]">{displayName(form.name, form.category)}</strong>
                </div>
              )}

              <Field label="Galeria de Fotos">
                <div className="space-y-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files)}
                  />
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                    className="w-full bg-[#261a0e] hover:bg-[#3d2e1e] border border-dashed border-[#3d2e1e] rounded-lg py-4 text-sm text-[#c9a96e] disabled:opacity-50"
                    data-testid="button-upload-images"
                  >
                    {uploading ? "Enviando..." : "📷 Adicionar fotos (pode selecionar várias)"}
                  </button>
                  {form.images.length === 0 ? (
                    <p className="text-xs text-[#7a6040] text-center py-2">
                      Nenhuma foto ainda. A primeira foto enviada vira a capa.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-[#7a6040]">
                        A primeira foto é a <strong className="text-[#c9a96e]">capa</strong>. Use ↑ ↓ para reordenar.
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {form.images.map((url, i) => (
                          <div
                            key={`${url}-${i}`}
                            className="relative border border-[#3d2e1e] rounded-lg overflow-hidden bg-[#261a0e] group"
                            data-testid={`gallery-item-${i}`}
                          >
                            <img
                              src={url}
                              alt={`Foto ${i + 1}`}
                              className="w-full h-28 object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.2"; }}
                            />
                            {i === 0 && (
                              <span className="absolute top-1 left-1 text-[10px] bg-[#c9a96e] text-[#1a1208] font-bold px-2 py-0.5 rounded-full">
                                CAPA
                              </span>
                            )}
                            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/70 px-1.5 py-1">
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => moveImage(i, -1)}
                                  disabled={i === 0}
                                  className="text-white disabled:opacity-30 hover:text-[#c9a96e] px-1 text-sm leading-none"
                                  aria-label="Mover para cima"
                                  data-testid={`button-image-up-${i}`}
                                >↑</button>
                                <button
                                  type="button"
                                  onClick={() => moveImage(i, 1)}
                                  disabled={i === form.images.length - 1}
                                  className="text-white disabled:opacity-30 hover:text-[#c9a96e] px-1 text-sm leading-none"
                                  aria-label="Mover para baixo"
                                  data-testid={`button-image-down-${i}`}
                                >↓</button>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeImage(i)}
                                className="text-red-400 hover:text-red-300 text-xs"
                                aria-label="Remover foto"
                                data-testid={`button-image-remove-${i}`}
                              >✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Field>

              {/* DIAGRAMA DE MEDIDAS */}
              <Field label="Diagrama de Medidas (opcional)">
                <p className="text-xs text-[#7a6040] mb-2">
                  Suba uma foto e adicione setas para indicar as medidas. O diagrama aparece na galeria de fotos do produto.
                </p>
                <DiagramaEditor
                  imageUrl={form.diagramaUrl}
                  anotacoes={form.diagramaAnotacoes}
                  onImageChange={(url) => setForm((f) => ({ ...f, diagramaUrl: url }))}
                  onChange={(ann) => setForm((f) => ({ ...f, diagramaAnotacoes: ann }))}
                />
              </Field>

              {/* SIZES TABLE */}
              <Field label="Tabela de Metragens *">
                <div className="space-y-2">
                  {form.sizes.length === 0 && (
                    <div className="text-center text-[#a08060] text-xs py-4 border border-dashed border-[#3d2e1e] rounded-lg">
                      Nenhuma metragem adicionada ainda.
                    </div>
                  )}
                  {form.sizes.map((s, i) => {
                    const isExpanded = expandedSizes.has(i);
                    return (
                      <div key={i} className="border border-[#2d1f10] rounded-lg overflow-hidden">
                        <div className="flex flex-col gap-2 p-2 bg-[#120d06]">
                          <input
                            className={inputCls}
                            placeholder='Ex: "2,30 m"'
                            value={s.label}
                            onChange={(e) => updateSize(i, { label: e.target.value })}
                          />
                          <div className="flex gap-2 items-center">
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a4030] text-sm">R$</span>
                              <input
                                className={`${inputCls} pl-9`}
                                type="number" min="0" step="0.01"
                                placeholder="0,00"
                                value={s.basePrice || ""}
                                onChange={(e) => updateSize(i, { basePrice: Number(e.target.value) })}
                              />
                            </div>
                            {(albums.length > 0 || foams.length > 0) && (
                              <button
                                type="button"
                                onClick={() => toggleSizeExpand(i)}
                                className={`flex-shrink-0 px-2 py-1.5 rounded-lg text-xs border transition-colors ${isExpanded ? "bg-[#c9a96e]/20 border-[#c9a96e]/50 text-[#c9a96e]" : "bg-[#261a0e] border-[#3d2e1e] text-[#a08060] hover:text-[#c9a96e]"}`}
                                title="Acréscimos por álbum e espuma"
                              >
                                {isExpanded ? "▲" : "▼"} Acréscimos
                              </button>
                            )}
                            <button type="button" onClick={() => removeSize(i)} className={dangerBtn + " flex-shrink-0"}>✕</button>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="px-3 py-3 bg-[#0e0a04] border-t border-[#2d1f10] space-y-3">
                            {albums.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-[#c9a96e] mb-2">Acréscimo por Álbum <span className="text-[#7a6040] font-normal">(0 = incluso)</span></p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {albums.map((al) => (
                                    <div key={al.id} className="flex items-center gap-2">
                                      <span className="text-xs text-[#a08060] flex-1 truncate">{al.name}</span>
                                      <div className="relative w-28 flex-shrink-0">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#5a4030] text-xs">R$</span>
                                        <input
                                          className="bg-[#1a1208] border border-[#3d2e1e] rounded-lg pl-7 pr-2 py-1 text-xs text-white w-full focus:outline-none focus:border-[#c9a96e]/50"
                                          type="number" min="0" step="0.01"
                                          placeholder="0"
                                          value={s.albumSurcharges?.[al.id] ?? 0}
                                          onChange={(e) => updateAlbumSurcharge(i, al.id, Number(e.target.value))}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {foams.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-[#c9a96e] mb-2">Acréscimo por Espuma <span className="text-[#7a6040] font-normal">(0 = incluso)</span></p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {foams.map((fm) => (
                                    <div key={fm.id} className="flex items-center gap-2">
                                      <span className="text-xs text-[#a08060] flex-1 truncate">{fm.name}</span>
                                      <div className="relative w-28 flex-shrink-0">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#5a4030] text-xs">R$</span>
                                        <input
                                          className="bg-[#1a1208] border border-[#3d2e1e] rounded-lg pl-7 pr-2 py-1 text-xs text-white w-full focus:outline-none focus:border-[#c9a96e]/50"
                                          type="number" min="0" step="0.01"
                                          placeholder="0"
                                          value={s.foamSurcharges?.[fm.id] ?? 0}
                                          onChange={(e) => updateFoamSurcharge(i, fm.id, Number(e.target.value))}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button type="button" onClick={addSize} className={ghostBtn}>+ Adicionar metragem</button>
                    <button type="button" onClick={fillStandardSizes} className={ghostBtn}>📐 Metragens padrão (1,60 – 4,00 m)</button>
                    {products.length > 0 && (
                      <select
                        onChange={(e) => { if (e.target.value) { copyFrom(e.target.value); e.target.value = ""; } }}
                        defaultValue=""
                        className="bg-[#261a0e] hover:bg-[#3d2e1e] border border-[#3d2e1e] rounded-lg px-3 py-1.5 text-sm text-[#c9a96e] cursor-pointer"
                      >
                        <option value="">↓ Copiar de outro modelo (metragens + acréscimos)</option>
                        {products.filter((p) => p.id !== editId && p.sizes.length > 0).map((p) => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sizes.length} metragens)</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <p className="text-xs text-[#7a6040]">
                    Preço final = <strong>preço da metragem</strong> + acréscimo do álbum + acréscimo da espuma. Use "▼ Acréscimos" para definir cada combinação.
                  </p>
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Prazo de Entrega">
                  <input className={inputCls} value={form.prazoEntrega} onChange={(e) => setForm({ ...form, prazoEntrega: e.target.value })} placeholder="Ex: A consultar" />
                </Field>
                <Field label="Disponibilidade">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setForm({ ...form, disponibilidade: true })} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${form.disponibilidade ? "bg-green-900/50 border-green-700 text-green-400" : "bg-[#120d06] border-[#2d1f10] text-[#5a4030]"}`}>✓ Sim</button>
                    <button type="button" onClick={() => setForm({ ...form, disponibilidade: false })} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${!form.disponibilidade ? "bg-red-900/50 border-red-700 text-red-400" : "bg-[#120d06] border-[#2d1f10] text-[#5a4030]"}`}>✗ Não</button>
                  </div>
                </Field>
                <Field label="Bestseller (aparece na faixa de destaque)">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setForm({ ...form, bestseller: true })} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${form.bestseller ? "bg-yellow-900/50 border-yellow-600 text-yellow-300" : "bg-[#120d06] border-[#2d1f10] text-[#5a4030]"}`} data-testid="button-bestseller-yes">⭐ Sim</button>
                    <button type="button" onClick={() => setForm({ ...form, bestseller: false })} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${!form.bestseller ? "bg-[#1a1208] border-[#3d2b18] text-[#c9a96e]" : "bg-[#120d06] border-[#2d1f10] text-[#5a4030]"}`} data-testid="button-bestseller-no">Não</button>
                  </div>
                </Field>
              </div>

              <Field label="Descrição Curta">
                <input className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </Field>
              <Field label="Descrição Completa">
                <textarea className={`${inputCls} resize-none`} rows={3} value={form.longDescription} onChange={(e) => setForm({ ...form, longDescription: e.target.value })} />
              </Field>
              <Field label="Dimensões (informativo)">
                <input className={inputCls} value={form.dimensions} onChange={(e) => setForm({ ...form, dimensions: e.target.value })} placeholder="Ex: 2,30 x 0,95 x 0,90 m" />
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

// ======================================================================
// MATERIAIS (Álbuns + Espumas)
// ======================================================================

function MateriaisTab({ flash }: { flash: (t: "ok" | "err", s: string) => void }) {
  const [sub, setSub] = useState<"albuns" | "espumas">("albuns");
  return (
    <>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Materiais</h1>
          <p className="text-[#a08060] text-sm mt-0.5">
            Organize os tecidos em álbuns (mesmo preço dentro do álbum) e cadastre as espumas.
          </p>
        </div>
      </div>
      <div className="flex gap-1 mb-6 border-b border-[#2d1f10]">
        <button
          onClick={() => setSub("albuns")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${sub === "albuns" ? "border-[#c9a96e] text-[#c9a96e]" : "border-transparent text-[#a08060] hover:text-white"}`}
          data-testid="subtab-albuns"
        >Álbuns de Tecidos</button>
        <button
          onClick={() => setSub("espumas")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${sub === "espumas" ? "border-[#c9a96e] text-[#c9a96e]" : "border-transparent text-[#a08060] hover:text-white"}`}
          data-testid="subtab-espumas"
        >Espumas</button>
      </div>
      {sub === "albuns" ? <AlbunsSection flash={flash} /> : <EspumasSection flash={flash} />}
    </>
  );
}

// ---------- ÁLBUNS ----------
interface AlbumForm {
  name: string;
  description: string;
  fabrics: FabricSample[];
  active: boolean;
}
const EMPTY_ALBUM: AlbumForm = { name: "", description: "", fabrics: [], active: true };

function AlbunsSection({ flash }: { flash: (t: "ok" | "err", s: string) => void }) {
  const [items, setItems] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<AlbumForm>(EMPTY_ALBUM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    try { setItems(await fetchAdminAlbums()); } finally { setLoading(false); }
  }

  function openNew() { setEditId(null); setForm(EMPTY_ALBUM); setShowForm(true); }
  function openEdit(a: Album) {
    setEditId(a.id);
    setForm({
      name: a.name,
      description: a.description,
      fabrics: a.fabrics.map((f) => ({ ...f })),
      active: a.active,
    });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, surcharge: 0, surchargeBySize: {} };
      if (editId) { await updateAlbum(editId, payload); flash("ok", "Álbum atualizado!"); }
      else { await createAlbum(payload); flash("ok", "Álbum criado!"); }
      setShowForm(false); await load();
    } catch (err: any) { flash("err", err.message ?? "Erro"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try { await deleteAlbum(id); flash("ok", "Excluído."); setDeleteId(null); await load(); }
    catch (err: any) { flash("err", err.message ?? "Erro"); }
  }

  function updateFabric(i: number, patch: Partial<FabricSample>) {
    setForm((f) => {
      const fabrics = [...f.fabrics];
      fabrics[i] = { ...fabrics[i], ...patch };
      return { ...f, fabrics };
    });
  }
  function addFabric() {
    setForm((f) => ({ ...f, fabrics: [...f.fabrics, { id: "", name: "", imageUrl: "" }] }));
  }
  function removeFabric(i: number) {
    setForm((f) => ({ ...f, fabrics: f.fabrics.filter((_, idx) => idx !== i) }));
  }
  async function handleFabricUpload(i: number, file: File) {
    setUploadingIdx(i);
    try {
      const { url } = await uploadImage(file);
      updateFabric(i, { imageUrl: url });
    } catch (err: any) { flash("err", err.message ?? "Erro no upload"); }
    finally { setUploadingIdx(null); }
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={openNew} className={goldBtn} data-testid="button-new-album">+ Novo Álbum</button>
      </div>

      {loading ? (
        <div className="text-center text-[#a08060] py-16">Carregando...</div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className={cardCls}>
              <div className="flex items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-white">{a.name}</h3>
                    {!a.active && <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/50 text-red-400 border border-red-800">inativo</span>}
                  </div>
                  {a.description && <p className="text-sm text-[#a08060] mt-1">{a.description}</p>}
                  <p className="text-xs text-[#7a6040] mt-1">{a.fabrics.length} cor{a.fabrics.length !== 1 ? "es" : ""} no álbum</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(a)} className={ghostBtn}>Editar</button>
                  <button onClick={() => setDeleteId(a.id)} className={dangerBtn}>Excluir</button>
                </div>
              </div>
              {a.fabrics.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {a.fabrics.map((f) => (
                    <div key={f.id} className="flex items-center gap-2 bg-[#120d06] border border-[#2d1f10] rounded-lg px-2 py-1">
                      {f.imageUrl ? (
                        <img src={f.imageUrl} alt={f.name} className="w-6 h-6 rounded object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded bg-[#261a0e] border border-[#3d2e1e]" />
                      )}
                      <span className="text-xs text-[#d9c9a0]">{f.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center text-[#a08060] py-10 border border-dashed border-[#2d1f10] rounded-xl text-sm">
              Nenhum álbum cadastrado.
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-[#1a1208] border border-[#3d2e1e] rounded-2xl w-full max-w-2xl my-8 shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#2d1f10] sticky top-0 bg-[#1a1208] z-10">
              <h2 className="font-semibold text-lg">{editId ? "Editar Álbum" : "Novo Álbum"}</h2>
              <button onClick={() => setShowForm(false)} className="text-[#a08060] hover:text-white text-xl leading-none">✕</button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              <Field label="Nome do Álbum *">
                <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Ex: Álbum Lisboa" />
              </Field>
              <Field label="Descrição">
                <textarea className={`${inputCls} resize-none`} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: Linhos nacionais respiráveis" />
              </Field>
              <Field label="Cores/tecidos do álbum">
                <div className="space-y-2">
                  {form.fabrics.map((f, i) => (
                    <div key={i} className="flex gap-2 items-center bg-[#120d06] border border-[#2d1f10] rounded-lg p-2">
                      <div className="w-14 h-14 rounded bg-[#261a0e] border border-[#3d2e1e] flex-shrink-0 overflow-hidden">
                        {f.imageUrl && <img src={f.imageUrl} alt={f.name} className="w-full h-full object-cover" />}
                      </div>
                      <input
                        className={inputCls}
                        placeholder="Nome da cor (ex: Linho Cru)"
                        value={f.name}
                        onChange={(e) => updateFabric(i, { name: e.target.value })}
                      />
                      <input
                        ref={(el) => { fileRefs.current[i] = el; }}
                        type="file" accept="image/*" className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFabricUpload(i, e.target.files[0])}
                      />
                      <button
                        type="button"
                        disabled={uploadingIdx === i}
                        onClick={() => fileRefs.current[i]?.click()}
                        className={ghostBtn + " flex-shrink-0 disabled:opacity-50"}
                      >
                        {uploadingIdx === i ? "..." : "📷"}
                      </button>
                      <button type="button" onClick={() => removeFabric(i)} className={dangerBtn + " flex-shrink-0"}>✕</button>
                    </div>
                  ))}
                  <button type="button" onClick={addFabric} className={ghostBtn}>+ Adicionar cor</button>
                </div>
              </Field>
              <Field label="Status">
                <div className="flex gap-3">
                  <button type="button" onClick={() => setForm({ ...form, active: true })} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${form.active ? "bg-green-900/50 border-green-700 text-green-400" : "bg-[#120d06] border-[#2d1f10] text-[#5a4030]"}`}>✓ Ativo</button>
                  <button type="button" onClick={() => setForm({ ...form, active: false })} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${!form.active ? "bg-red-900/50 border-red-700 text-red-400" : "bg-[#120d06] border-[#2d1f10] text-[#5a4030]"}`}>✗ Inativo</button>
                </div>
              </Field>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-[#3d2e1e] rounded-lg text-[#a08060] hover:text-white text-sm">Cancelar</button>
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
            <h3 className="font-semibold text-lg mb-2">Excluir Álbum</h3>
            <p className="text-[#a08060] text-sm mb-6">Confirma a exclusão?</p>
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

// ---------- ESPUMAS ----------
interface FoamForm {
  type: "espuma";
  name: string;
  description: string;
  weightSupport: string;
  comfortLevel: string;
  useIndication: string;
  longTermBehavior: string;
  imageUrl: string;
  active: boolean;
}
const EMPTY_ESP: FoamForm = { type: "espuma", name: "", description: "", weightSupport: "", comfortLevel: "", useIndication: "", longTermBehavior: "", imageUrl: "", active: true };

function EspumasSection({ flash }: { flash: (t: "ok" | "err", s: string) => void }) {
  const [items, setItems] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FoamForm>(EMPTY_ESP);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    try { setItems(await fetchAdminMaterials()); } finally { setLoading(false); }
  }

  function openNew() { setEditId(null); setForm(EMPTY_ESP); setShowForm(true); }
  function openEdit(m: Material) {
    setEditId(m.id);
    setForm({
      type: "espuma",
      name: m.name,
      description: m.description,
      weightSupport: m.weightSupport || "",
      comfortLevel: m.comfortLevel || "",
      useIndication: m.useIndication || "",
      longTermBehavior: m.longTermBehavior || "",
      imageUrl: m.imageUrl || "",
      active: m.active,
    });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, priceAdjustment: 0, priceAdjustmentBySize: {} };
      if (editId) { await updateMaterial(editId, payload); flash("ok", "Espuma atualizada!"); }
      else { await createMaterial(payload); flash("ok", "Espuma criada!"); }
      setShowForm(false); await load();
    } catch (err: any) { flash("err", err.message ?? "Erro"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try { await deleteMaterial(id); flash("ok", "Excluída."); setDeleteId(null); await load(); }
    catch (err: any) { flash("err", err.message ?? "Erro"); }
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={openNew} className={goldBtn} data-testid="button-new-espuma">+ Nova Espuma</button>
      </div>
      {loading ? (
        <div className="text-center text-[#a08060] py-16">Carregando...</div>
      ) : (
        <div className="space-y-2">
          {items.map((m) => (
            <div key={m.id} className={`${cardCls} flex items-center gap-4`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium text-white">{m.name}</h3>
                  {!m.active && <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/50 text-red-400 border border-red-800">inativo</span>}
                </div>
                <p className="text-sm text-[#a08060] mt-1 truncate">{m.description}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(m)} className={ghostBtn}>Editar</button>
                <button onClick={() => setDeleteId(m.id)} className={dangerBtn}>Excluir</button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center text-[#a08060] py-10 border border-dashed border-[#2d1f10] rounded-xl text-sm">Nenhuma espuma cadastrada.</div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-[#1a1208] border border-[#3d2e1e] rounded-2xl w-full max-w-lg my-8 shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#2d1f10]">
              <h2 className="font-semibold text-lg">{editId ? "Editar Espuma" : "Nova Espuma"}</h2>
              <button onClick={() => setShowForm(false)} className="text-[#a08060] hover:text-white text-xl leading-none">✕</button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              <Field label="Nome *">
                <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Ex: Espuma D23" />
              </Field>
              <Field label="Descrição">
                <textarea className={`${inputCls} resize-none`} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </Field>
              <div className="border-t border-[#2d1f10] pt-4">
                <h3 className="text-sm font-semibold text-white mb-3">Ficha técnica (opcional)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Peso suportado">
                    <input className={inputCls} value={form.weightSupport} onChange={(e) => setForm({ ...form, weightSupport: e.target.value })} placeholder="Ex: 90–120kg" />
                  </Field>
                  <Field label="Nível de conforto">
                    <input className={inputCls} value={form.comfortLevel} onChange={(e) => setForm({ ...form, comfortLevel: e.target.value })} placeholder="Ex: Firme" />
                  </Field>
                  <Field label="Indicação de uso">
                    <input className={inputCls} value={form.useIndication} onChange={(e) => setForm({ ...form, useIndication: e.target.value })} placeholder="Ex: Uso diário" />
                  </Field>
                  <Field label="Comportamento a longo prazo">
                    <input className={inputCls} value={form.longTermBehavior} onChange={(e) => setForm({ ...form, longTermBehavior: e.target.value })} placeholder="Ex: Amacia e estabiliza" />
                  </Field>
                </div>
              </div>
              <Field label="Status">
                <div className="flex gap-3">
                  <button type="button" onClick={() => setForm({ ...form, active: true })} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${form.active ? "bg-green-900/50 border-green-700 text-green-400" : "bg-[#120d06] border-[#2d1f10] text-[#5a4030]"}`}>✓ Ativo</button>
                  <button type="button" onClick={() => setForm({ ...form, active: false })} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${!form.active ? "bg-red-900/50 border-red-700 text-red-400" : "bg-[#120d06] border-[#2d1f10] text-[#5a4030]"}`}>✗ Inativo</button>
                </div>
              </Field>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-[#3d2e1e] rounded-lg text-[#a08060] hover:text-white text-sm">Cancelar</button>
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
            <h3 className="font-semibold text-lg mb-2">Excluir Espuma</h3>
            <p className="text-[#a08060] text-sm mb-6">Confirma a exclusão?</p>
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

// ======================================================================
// CLIENTES
// ======================================================================

function ClientesTab() {
  const [data, setData] = useState<{ totalCount: number; users: Client[] } | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchClients().then(setData).catch(() => setData({ totalCount: 0, users: [] })).finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="text-center text-[#a08060] py-16">Carregando...</div>;
  if (!data || data.users.length === 0) return (
    <div className="text-center text-[#a08060] py-16 border border-dashed border-[#2d1f10] rounded-xl">
      Nenhum cliente cadastrado ainda.
    </div>
  );
  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Clientes</h1>
        <p className="text-[#a08060] text-sm mt-0.5">{data.totalCount} cadastrado{data.totalCount !== 1 ? "s" : ""}</p>
      </div>
      <div className="space-y-2">
        {data.users.map((u) => (
          <div key={u.id} className={`${cardCls} flex items-center gap-4`}>
            {u.imageUrl ? <img src={u.imageUrl} alt="" className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-[#261a0e]" />}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">{[u.firstName, u.lastName].filter(Boolean).join(" ") || u.email}</p>
              <p className="text-xs text-[#a08060] truncate">{u.email}</p>
            </div>
            <div className="text-right text-xs text-[#a08060]">
              <p>Cadastro: {new Date(u.createdAt).toLocaleDateString("pt-BR")}</p>
              {u.lastSignInAt && <p>Último acesso: {new Date(u.lastSignInAt).toLocaleDateString("pt-BR")}</p>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ======================================================================
// ESTATÍSTICAS
// ======================================================================

function EstatisticasTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchStats().then(setStats).catch(() => setStats(null)).finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="text-center text-[#a08060] py-16">Carregando...</div>;
  if (!stats) return <div className="text-center text-red-400 py-16">Erro ao carregar estatísticas.</div>;

  const kpis = [
    { label: "Visualizações (total)", value: stats.totalViews },
    { label: "Visualizações (7 dias)", value: stats.views7d },
    { label: "Visualizações (30 dias)", value: stats.views30d },
    { label: "Cliques WhatsApp (total)", value: stats.totalWhatsapp },
    { label: "Cliques WhatsApp (7d)", value: stats.whatsapp7d },
    { label: "Cliques WhatsApp (30d)", value: stats.whatsapp30d },
  ];

  return (
    <>
      <h1 className="text-xl font-semibold mb-6">Estatísticas</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className={cardCls}>
            <p className="text-xs text-[#a08060] uppercase tracking-wider">{k.label}</p>
            <p className="text-2xl font-semibold text-[#c9a96e] mt-1">{k.value}</p>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className={cardCls}>
          <h3 className="font-semibold text-white mb-3">Produtos mais vistos</h3>
          {stats.topViewed.length === 0 ? <p className="text-sm text-[#a08060]">Sem dados ainda.</p> : (
            <ol className="space-y-2">
              {stats.topViewed.map((t, i) => (
                <li key={t.id} className="flex items-center justify-between text-sm">
                  <span className="text-white"><span className="text-[#c9a96e] font-semibold mr-2">{i + 1}.</span>{t.name}</span>
                  <span className="text-[#a08060]">{t.count} views</span>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className={cardCls}>
          <h3 className="font-semibold text-white mb-3">Produtos com mais cliques no WhatsApp</h3>
          {stats.topWhatsapp.length === 0 ? <p className="text-sm text-[#a08060]">Sem dados ainda.</p> : (
            <ol className="space-y-2">
              {stats.topWhatsapp.map((t, i) => (
                <li key={t.id} className="flex items-center justify-between text-sm">
                  <span className="text-white"><span className="text-[#c9a96e] font-semibold mr-2">{i + 1}.</span>{t.name}</span>
                  <span className="text-[#a08060]">{t.count} cliques</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </>
  );
}

// ======================================================================
// WHATSAPP
// ======================================================================

function WhatsappTab() {
  const [events, setEvents] = useState<WhatsappEvent[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchWhatsappEvents().then(setEvents).catch(() => setEvents([])).finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="text-center text-[#a08060] py-16">Carregando...</div>;
  return (
    <>
      <h1 className="text-xl font-semibold mb-6">Histórico de Cliques no WhatsApp</h1>
      {events.length === 0 ? (
        <div className="text-center text-[#a08060] py-16 border border-dashed border-[#2d1f10] rounded-xl">Nenhum clique registrado ainda.</div>
      ) : (
        <div className="space-y-2">
          {events.map((e) => (
            <div key={e.id} className={`${cardCls} flex items-center justify-between gap-4`}>
              <div>
                <p className="font-medium text-white">{e.productName || "Botão flutuante (sem produto)"}</p>
                {e.productId && <p className="text-xs text-[#a08060]">{e.productId}</p>}
              </div>
              <p className="text-sm text-[#a08060] whitespace-nowrap">{new Date(e.ts).toLocaleString("pt-BR")}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ======================================================================
// CONFIGURAÇÕES
// ======================================================================

function ConfiguracoesTab({ flash }: { flash: (t: "ok" | "err", s: string) => void }) {
  const [heroImage, setHeroImage] = useState("/images/hero.png");
  const [pixDiscountPct, setPixDiscountPct] = useState(10);
  const [maxInstallments, setMaxInstallments] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSiteSettings()
      .then((s) => {
        setHeroImage(s.heroImage);
        setPixDiscountPct(s.pixDiscountPct ?? 10);
        setMaxInstallments(s.maxInstallments ?? 10);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const { url } = await uploadImage(files[0]);
      setHeroImage(url);
      flash("ok", "Imagem carregada! Clique em Salvar para aplicar.");
    } catch (err: any) {
      flash("err", err.message ?? "Erro no upload");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateSiteSettings({ heroImage, pixDiscountPct, maxInstallments });
      flash("ok", "Configurações salvas com sucesso!");
    } catch (err: any) {
      flash("err", err.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  const examplePix = 1000;
  const exampleCard = pixDiscountPct > 0 && pixDiscountPct < 100
    ? examplePix / (1 - pixDiscountPct / 100)
    : examplePix;
  const exampleInstallment = exampleCard / (maxInstallments || 1);

  if (loading) {
    return <div className="text-center text-[#a08060] py-16">Carregando...</div>;
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Configurações do Site</h1>
        <p className="text-[#a08060] text-sm mt-0.5">Personalize a aparência e preços do site</p>
      </div>

      {/* Precificação */}
      <div className={`${cardCls} mb-6`}>
        <h2 className="font-semibold text-white mb-1">Precificação</h2>
        <p className="text-[#a08060] text-sm mb-4">
          No admin, cadastre sempre o preço <strong className="text-white">à vista (PIX)</strong>.
          O site calculará automaticamente o preço no cartão com o acréscimo abaixo.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-[#c8a87a] mb-1">
              Desconto PIX (%)
            </label>
            <input
              type="number"
              min={0}
              max={99}
              step={0.5}
              value={pixDiscountPct}
              onChange={(e) => setPixDiscountPct(Number(e.target.value))}
              className="w-full rounded-md bg-[#1e1208] border border-[#3d2e1e] text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a87a]"
            />
            <p className="text-xs text-[#7a6040] mt-1">
              Percentual de desconto que o cliente recebe ao pagar no PIX em relação ao cartão.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#c8a87a] mb-1">
              Parcelas máximas no cartão
            </label>
            <input
              type="number"
              min={1}
              max={24}
              step={1}
              value={maxInstallments}
              onChange={(e) => setMaxInstallments(Math.max(1, Math.round(Number(e.target.value))))}
              className="w-full rounded-md bg-[#1e1208] border border-[#3d2e1e] text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a87a]"
            />
            <p className="text-xs text-[#7a6040] mt-1">
              Número máximo de parcelas exibidas no site.
            </p>
          </div>
        </div>

        {/* Preview de exemplo */}
        <div className="mt-4 rounded-lg bg-[#1a1005] border border-[#3d2e1e] p-4">
          <p className="text-xs text-[#7a6040] uppercase tracking-wider mb-2">Exemplo com produto de R$ 1.000,00 à vista</p>
          <div className="space-y-1">
            <p className="text-sm font-bold text-green-400">
              PIX / À vista: R$ {examplePix.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-[#a08060]">
              Cartão: {maxInstallments}x de R$ {exampleInstallment.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} sem juros
              <span className="text-[#7a6040] ml-1">(total R$ {exampleCard.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})</span>
            </p>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className={cardCls}>
        <h2 className="font-semibold text-white mb-1">Foto de Capa (Hero)</h2>
        <p className="text-[#a08060] text-sm mb-4">Imagem exibida em destaque na página inicial.</p>

        <div className="space-y-4">
          <div className="w-full aspect-[21/9] max-h-72 overflow-hidden rounded-xl bg-[#261a0e] border border-[#3d2e1e]">
            <img
              src={heroImage}
              alt="Capa atual do home"
              className="w-full h-full object-cover object-center"
              onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.2"; }}
            />
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className={`${ghostBtn} disabled:opacity-50`}
            >
              {uploading ? "Enviando..." : "📷 Trocar imagem"}
            </button>
          </div>

          <p className="text-xs text-[#7a6040]">
            Proporção ideal: <strong className="text-[#a08060]">21:9</strong> (panorâmica). Formatos aceitos: JPG, PNG, WebP.
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          disabled={saving || uploading}
          onClick={handleSave}
          className={`${goldBtn} disabled:opacity-50`}
        >
          {saving ? "Salvando..." : "✓ Salvar configurações"}
        </button>
      </div>
    </>
  );
}
