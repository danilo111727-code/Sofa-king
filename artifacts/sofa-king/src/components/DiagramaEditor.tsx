import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { uploadImage } from "@/lib/api";
import type { DiagramaAnotacao } from "@/lib/api";

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

interface Props {
  imageUrl: string;
  anotacoes: DiagramaAnotacao[];
  onImageChange: (url: string) => void;
  onChange: (ann: DiagramaAnotacao[]) => void;
}

export function DiagramaEditor({ imageUrl, anotacoes, onImageChange, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState<{ id: string; pt: "a" | "b" } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  const hasImage = Boolean(imageUrl);

  function svgCoords(e: React.PointerEvent) {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100),
    };
  }

  function addArrow() {
    onChange([
      ...anotacoes,
      { id: uid(), x1: 20, y1: 50, x2: 80, y2: 50, label: "", sublabel: "" },
    ]);
  }

  function removeArrow(id: string) {
    onChange(anotacoes.filter((a) => a.id !== id));
  }

  function updateArrow(id: string, patch: Partial<DiagramaAnotacao>) {
    onChange(anotacoes.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  function onPointerDown(id: string, pt: "a" | "b", e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setDragging({ id, pt });
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging || !svgRef.current) return;
    const { x, y } = svgCoords(e);
    updateArrow(
      dragging.id,
      dragging.pt === "a" ? { x1: x, y1: y } : { x2: x, y2: y }
    );
  }

  function onPointerUp() {
    setDragging(null);
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const { url } = await uploadImage(files[0]);
      onImageChange(url);
    } catch {
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
      if (camRef.current) camRef.current.value = "";
    }
  }

  const inp = "w-full rounded bg-[#261a0e] border border-[#3d2e1e] text-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#c8a87a]";
  const btn = "px-3 py-1.5 rounded-lg border border-[#3d2e1e] bg-[#261a0e] text-[#c8a87a] text-xs hover:bg-[#3d2e1e] transition-colors disabled:opacity-50";

  return (
    <div className="space-y-3">
      {/* Upload buttons */}
      <div className="flex flex-wrap gap-2">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files)} />
        <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleUpload(e.target.files)} />

        <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className={btn}>
          {uploading ? "Enviando..." : hasImage ? "🖼 Trocar foto" : "🖼 Subir foto base"}
        </button>

        <button type="button" disabled={uploading} onClick={() => camRef.current?.click()} className={btn}>
          📷 Câmera
        </button>

        {hasImage && (
          <button type="button" onClick={addArrow} className={`${btn} bg-[#c8a87a]/10 border-[#c8a87a]/40 text-[#c8a87a]`}>
            + Adicionar seta
          </button>
        )}
      </div>

      {/* Canvas */}
      {hasImage ? (
        <div
          className="relative w-full rounded-xl overflow-hidden border border-[#3d2e1e] bg-[#0e0a04]"
          style={{ aspectRatio: "1 / 1" }}
        >
          <img
            src={imageUrl}
            alt="Base do diagrama"
            className="absolute inset-0 w-full h-full object-contain"
            draggable={false}
          />
          <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            style={{ touchAction: "none" }}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <defs>
              <marker id="ed-s" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                <path d="M8,2 L2,4 L8,6" fill="none" stroke="#ff8c00" strokeWidth="1.2" />
              </marker>
              <marker id="ed-e" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                <path d="M2,2 L8,4 L2,6" fill="none" stroke="#ff8c00" strokeWidth="1.2" />
              </marker>
            </defs>

            {anotacoes.map((ann) => {
              const mx = (ann.x1 + ann.x2) / 2;
              const my = (ann.y1 + ann.y2) / 2;
              const chars = Math.max(ann.label.length, (ann.sublabel || "").length);
              const lw = chars * 1.5 + 4;
              const lh = ann.sublabel ? 7 : 4.5;

              return (
                <g key={ann.id}>
                  <line
                    x1={ann.x1} y1={ann.y1} x2={ann.x2} y2={ann.y2}
                    stroke="#ff8c00" strokeWidth="0.9" strokeDasharray="2,1.2"
                    markerStart="url(#ed-s)" markerEnd="url(#ed-e)"
                  />
                  {(ann.label || ann.sublabel) && (
                    <>
                      <rect x={mx - lw / 2} y={my - lh / 2} width={lw} height={lh} rx="1" fill="white" fillOpacity="0.92" />
                      {ann.label && (
                        <text x={mx} y={my + (ann.sublabel ? -0.5 : 0.8)} textAnchor="middle" fontSize="3" fill="#1a1a1a" fontWeight="700" fontFamily="system-ui, sans-serif">
                          {ann.label}
                        </text>
                      )}
                      {ann.sublabel && (
                        <text x={mx} y={my + 3.2} textAnchor="middle" fontSize="2.2" fill="#555" fontFamily="system-ui, sans-serif">
                          {ann.sublabel}
                        </text>
                      )}
                    </>
                  )}
                  {/* Draggable handles */}
                  <circle
                    cx={ann.x1} cy={ann.y1} r="3"
                    fill="#ff8c00" stroke="white" strokeWidth="0.8"
                    style={{ cursor: "grab", touchAction: "none" }}
                    onPointerDown={(e) => onPointerDown(ann.id, "a", e)}
                  />
                  <circle
                    cx={ann.x2} cy={ann.y2} r="3"
                    fill="#ff8c00" stroke="white" strokeWidth="0.8"
                    style={{ cursor: "grab", touchAction: "none" }}
                    onPointerDown={(e) => onPointerDown(ann.id, "b", e)}
                  />
                </g>
              );
            })}
          </svg>
        </div>
      ) : (
        <div className="w-full rounded-xl border-2 border-dashed border-[#3d2e1e] flex items-center justify-center py-12">
          <p className="text-[#7a6040] text-sm text-center px-4">
            Suba uma foto para começar a editar o diagrama
          </p>
        </div>
      )}

      {/* Annotation inputs */}
      {anotacoes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-[#7a6040]">Arraste os pontos laranja na imagem para posicionar cada seta.</p>
          {anotacoes.map((ann, i) => (
            <div key={ann.id} className="flex items-start gap-2 bg-[#1a1005] border border-[#3d2e1e] rounded-lg p-3">
              <span className="text-[#7a6040] text-xs mt-2 w-5 shrink-0">{i + 1}.</span>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[#a08060] block mb-0.5">Medida</label>
                  <input
                    type="text"
                    value={ann.label}
                    onChange={(e) => updateArrow(ann.id, { label: e.target.value })}
                    placeholder="ex: 45 cm"
                    className={inp}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#a08060] block mb-0.5">Descrição</label>
                  <input
                    type="text"
                    value={ann.sublabel}
                    onChange={(e) => updateArrow(ann.id, { sublabel: e.target.value })}
                    placeholder="ex: Altura do assento"
                    className={inp}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeArrow(ann.id)}
                className="text-red-400 hover:text-red-300 mt-6 shrink-0"
                title="Remover seta"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
