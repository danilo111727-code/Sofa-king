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
  fetchKnownSizes,
  fetchStats,
  fetchWhatsappEvents,
  fetchClients,
  uploadImage,
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

const inputCls = "w-full bg-[#1a1208] border border-[#3d2e1e] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#5a4030] focus:outline-none focus:border-[#c9a96e] transition-colors";
const cardCls = "bg-[#1a1208] border border-[#2d1f10] rounded-xl p-4";
const goldBtn = "bg-[#c9a96e] hover:bg-[#b8954f] text-[#1a1208] font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors";
const ghostBtn = "px-3 py-1.5 bg-[#261a0e] hover:bg-[#3d2e1e] border border-[#3d2e1e] rounded-lg text-sm text-[#c9a96e]";
const dangerBtn = "px-3 py-1.5 bg-red-950/50 hover:bg-red-900/50 border border-red-900/50 rounded-lg text-sm text-red-400";

type Tab = "produtos" | "materiais" | "clientes" | "estatisticas" | "whatsapp";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[#a08060] text-xs font-medium mb-1 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function brl(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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
  sizes: SizeOption[];
}

const EMPTY_PRODUTO: ProdutoForm = {
  name: "", category: "", description: "", longDescription: "", images: [],
  dimensions: "", prazoEntrega: "", disponibilidade: true,
  sizes: [],
};

function ProdutosTab({ flash }: { flash: (t: "ok" | "err", s: string) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ProdutoForm>(EMPTY_PRODUTO);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    try { setProducts(await fetchProducts()); } finally { setLoading(false); }
  }

  function openNew() { setEditId(null); setForm(EMPTY_PRODUTO); setShowForm(true); }
  function openEdit(p: Product) {
    setEditId(p.id);
    const validCats: ProductCategory[] = ["retratil", "canto", "modulos", ""];
    const cat: ProductCategory = validCats.includes(p.category as ProductCategory) ? (p.category as ProductCategory) : "";
    setForm({
      name: p.name,
      category: cat,
      description: p.description, longDescription: p.longDescription,
      images: p.images && p.images.length ? [...p.images] : (p.image ? [p.image] : []),
      dimensions: p.dimensions, prazoEntrega: p.prazoEntrega,
      disponibilidade: p.disponibilidade,
      sizes: p.sizes && p.sizes.length ? p.sizes : [],
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
        sizes: form.sizes,
        colors: [],
        fabrics: [],
        price: Math.min(...form.sizes.map((s) => s.basePrice).filter((n) => n > 0)) || 0,
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
    setForm((f) => ({ ...f, sizes: p.sizes.map((s) => ({ ...s })) }));
    flash("ok", `Metragens copiadas de "${p.name}".`);
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
                            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/70 px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

              {/* SIZES TABLE */}
              <Field label="Tabela de Metragens *">
                <div className="space-y-2">
                  {form.sizes.length === 0 && (
                    <div className="text-center text-[#a08060] text-xs py-4 border border-dashed border-[#3d2e1e] rounded-lg">
                      Nenhuma metragem adicionada ainda.
                    </div>
                  )}
                  {form.sizes.map((s, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        className={inputCls}
                        placeholder='Ex: "2,30 m"'
                        value={s.label}
                        onChange={(e) => updateSize(i, { label: e.target.value })}
                      />
                      <div className="relative flex-shrink-0 w-40">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a4030] text-sm">R$</span>
                        <input
                          className={`${inputCls} pl-9`}
                          type="number" min="0" step="0.01"
                          placeholder="0,00"
                          value={s.basePrice || ""}
                          onChange={(e) => updateSize(i, { basePrice: Number(e.target.value) })}
                        />
                      </div>
                      <button type="button" onClick={() => removeSize(i)} className={dangerBtn + " flex-shrink-0"}>✕</button>
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button type="button" onClick={addSize} className={ghostBtn}>+ Adicionar metragem</button>
                    {products.length > 0 && (
                      <select
                        onChange={(e) => { if (e.target.value) { copyFrom(e.target.value); e.target.value = ""; } }}
                        defaultValue=""
                        className="bg-[#261a0e] hover:bg-[#3d2e1e] border border-[#3d2e1e] rounded-lg px-3 py-1.5 text-sm text-[#c9a96e] cursor-pointer"
                      >
                        <option value="">↓ Copiar metragens de outro modelo</option>
                        {products.filter((p) => p.id !== editId && p.sizes.length > 0).map((p) => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sizes.length} metragens)</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <p className="text-xs text-[#7a6040]">
                    O preço final do sofá = <strong>preço da metragem</strong> + acréscimo do álbum escolhido + acréscimo da espuma escolhida.
                  </p>
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Prazo de Entrega">
                  <input className={inputCls} value={form.prazoEntrega} onChange={(e) => setForm({ ...form, prazoEntrega: e.target.value })} placeholder="Ex: 15-20 dias" />
                </Field>
                <Field label="Disponibilidade">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setForm({ ...form, disponibilidade: true })} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${form.disponibilidade ? "bg-green-900/50 border-green-700 text-green-400" : "bg-[#120d06] border-[#2d1f10] text-[#5a4030]"}`}>✓ Sim</button>
                    <button type="button" onClick={() => setForm({ ...form, disponibilidade: false })} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${!form.disponibilidade ? "bg-red-900/50 border-red-700 text-red-400" : "bg-[#120d06] border-[#2d1f10] text-[#5a4030]"}`}>✗ Não</button>
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
  surcharge: number;
  surchargeBySize: Record<string, number>;
  fabrics: FabricSample[];
  active: boolean;
}
const EMPTY_ALBUM: AlbumForm = { name: "", description: "", surcharge: 0, surchargeBySize: {}, fabrics: [], active: true };

function AlbunsSection({ flash }: { flash: (t: "ok" | "err", s: string) => void }) {
  const [items, setItems] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<AlbumForm>(EMPTY_ALBUM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [knownSizes, setKnownSizes] = useState<string[]>([]);
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => { load(); fetchKnownSizes().then(setKnownSizes).catch(() => {}); }, []);
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
      surcharge: a.surcharge,
      surchargeBySize: { ...(a.surchargeBySize || {}) },
      fabrics: a.fabrics.map((f) => ({ ...f })),
      active: a.active,
    });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) { await updateAlbum(editId, form); flash("ok", "Álbum atualizado!"); }
      else { await createAlbum(form); flash("ok", "Álbum criado!"); }
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
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${a.surcharge === 0 ? "bg-[#261a0e] text-[#a08060] border-[#3d2e1e]" : a.surcharge > 0 ? "bg-amber-900/30 text-amber-400 border-amber-800/50" : "bg-green-900/30 text-green-400 border-green-800/50"}`}>
                      {a.surcharge > 0 ? "+" : ""}{brl(a.surcharge)}
                    </span>
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
              <Field label="Acréscimo padrão (R$)">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a4030] text-sm">R$</span>
                  <input className={`${inputCls} pl-9`} type="number" step="0.01" value={form.surcharge} onChange={(e) => setForm({ ...form, surcharge: Number(e.target.value) })} placeholder="0" />
                </div>
                <p className="text-xs text-[#7a6040] mt-1">Usado para qualquer metragem que não tenha valor específico abaixo.</p>
              </Field>
              <Field label="Acréscimo por metragem (opcional)">
                <SurchargeBySizeEditor
                  knownSizes={knownSizes}
                  value={form.surchargeBySize}
                  onChange={(next) => setForm({ ...form, surchargeBySize: next })}
                  defaultValue={form.surcharge}
                  helpLabel="Defina um acréscimo específico para cada metragem."
                />
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
  priceAdjustment: number;
  priceAdjustmentBySize: Record<string, number>;
  imageUrl: string;
  active: boolean;
}
const EMPTY_ESP: FoamForm = { type: "espuma", name: "", description: "", priceAdjustment: 0, priceAdjustmentBySize: {}, imageUrl: "", active: true };

function EspumasSection({ flash }: { flash: (t: "ok" | "err", s: string) => void }) {
  const [items, setItems] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FoamForm>(EMPTY_ESP);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [knownSizes, setKnownSizes] = useState<string[]>([]);

  useEffect(() => { load(); fetchKnownSizes().then(setKnownSizes).catch(() => {}); }, []);
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
      priceAdjustment: m.priceAdjustment,
      priceAdjustmentBySize: { ...(m.priceAdjustmentBySize || {}) },
      imageUrl: m.imageUrl || "",
      active: m.active,
    });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) { await updateMaterial(editId, form); flash("ok", "Espuma atualizada!"); }
      else { await createMaterial(form); flash("ok", "Espuma criada!"); }
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
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${m.priceAdjustment === 0 ? "bg-[#261a0e] text-[#a08060] border-[#3d2e1e]" : m.priceAdjustment > 0 ? "bg-amber-900/30 text-amber-400 border-amber-800/50" : "bg-green-900/30 text-green-400 border-green-800/50"}`}>
                    {m.priceAdjustment > 0 ? "+" : ""}{brl(m.priceAdjustment)}
                  </span>
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
              <Field label="Acréscimo padrão (R$)">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a4030] text-sm">R$</span>
                  <input className={`${inputCls} pl-9`} type="number" step="0.01" value={form.priceAdjustment} onChange={(e) => setForm({ ...form, priceAdjustment: Number(e.target.value) })} placeholder="0 = padrão" />
                </div>
                <p className="text-xs text-[#7a6040] mt-1">Usado para qualquer metragem que não tenha valor específico abaixo.</p>
              </Field>
              <Field label="Acréscimo por metragem (opcional)">
                <SurchargeBySizeEditor
                  knownSizes={knownSizes}
                  value={form.priceAdjustmentBySize}
                  onChange={(next) => setForm({ ...form, priceAdjustmentBySize: next })}
                  defaultValue={form.priceAdjustment}
                  helpLabel="Defina um acréscimo específico para cada metragem."
                />
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
