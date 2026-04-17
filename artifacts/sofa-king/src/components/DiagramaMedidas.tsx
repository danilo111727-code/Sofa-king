export function DiagramaMedidas() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative w-full select-none" style={{ aspectRatio: "1 / 1" }}>
        <img
          src="/images/diagrama-medidas.png"
          alt="Diagrama de medidas do sofá"
          className="w-full h-full object-contain"
          draggable={false}
        />

        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <marker id="arrow-start" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M6,1 L1,3 L6,5" fill="none" stroke="#1a1a1a" strokeWidth="1" />
            </marker>
            <marker id="arrow-end" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M1,1 L6,3 L1,5" fill="none" stroke="#1a1a1a" strokeWidth="1" />
            </marker>
            <marker id="arrow-start-v" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M1,6 L3,1 L5,6" fill="none" stroke="#1a1a1a" strokeWidth="1" />
            </marker>
            <marker id="arrow-end-v" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M1,1 L3,6 L5,1" fill="none" stroke="#1a1a1a" strokeWidth="1" />
            </marker>
          </defs>

          {/* ── Profundidade total: 1,40 m ── horizontal na base */}
          {/* linha guia esquerda */}
          <line x1="14" y1="84" x2="14" y2="92" stroke="#1a1a1a" strokeWidth="0.4" strokeDasharray="1,0.8" />
          {/* linha guia direita */}
          <line x1="70" y1="84" x2="70" y2="92" stroke="#1a1a1a" strokeWidth="0.4" strokeDasharray="1,0.8" />
          {/* seta dupla horizontal */}
          <line
            x1="14" y1="90" x2="70" y2="90"
            stroke="#1a1a1a" strokeWidth="0.7"
            markerStart="url(#arrow-start)"
            markerEnd="url(#arrow-end)"
          />
          {/* etiqueta */}
          <rect x="34" y="87" width="18" height="6" rx="1" fill="white" fillOpacity="0.92" />
          <text x="43" y="91.2" textAnchor="middle" fontSize="3.2" fill="#1a1a1a" fontWeight="600" fontFamily="system-ui, sans-serif">
            1,40 m
          </text>
          <text x="43" y="94.8" textAnchor="middle" fontSize="2.4" fill="#444" fontFamily="system-ui, sans-serif">
            Profundidade total
          </text>

          {/* ── Profundidade do braço: 95 cm ── horizontal no braço */}
          {/* linha guia traseira */}
          <line x1="12" y1="41" x2="6" y2="41" stroke="#1a1a1a" strokeWidth="0.4" strokeDasharray="1,0.8" />
          {/* linha guia frontal */}
          <line x1="32" y1="65" x2="6" y2="65" stroke="#1a1a1a" strokeWidth="0.4" strokeDasharray="1,0.8" />
          {/* seta dupla vertical (no eixo Y, pois perspectiva) */}
          <line
            x1="7" y1="41" x2="7" y2="65"
            stroke="#1a1a1a" strokeWidth="0.7"
            markerStart="url(#arrow-start-v)"
            markerEnd="url(#arrow-end-v)"
          />
          {/* etiqueta */}
          <rect x="0.5" y="49.5" width="15" height="6" rx="1" fill="white" fillOpacity="0.92" />
          <text x="8" y="53.7" textAnchor="middle" fontSize="3.2" fill="#1a1a1a" fontWeight="600" fontFamily="system-ui, sans-serif">
            95 cm
          </text>
          <text x="8" y="57.2" textAnchor="middle" fontSize="2.4" fill="#444" fontFamily="system-ui, sans-serif">
            Prof. braço
          </text>

          {/* ── Altura do assento: 45 cm ── vertical lado esquerdo */}
          {/* linha guia chão */}
          <line x1="28" y1="80" x2="22" y2="80" stroke="#1a1a1a" strokeWidth="0.4" strokeDasharray="1,0.8" />
          {/* linha guia assento */}
          <line x1="28" y1="62" x2="22" y2="62" stroke="#1a1a1a" strokeWidth="0.4" strokeDasharray="1,0.8" />
          {/* seta dupla vertical */}
          <line
            x1="23" y1="80" x2="23" y2="62"
            stroke="#1a1a1a" strokeWidth="0.7"
            markerStart="url(#arrow-end-v)"
            markerEnd="url(#arrow-start-v)"
          />
          {/* etiqueta */}
          <rect x="14.5" y="67.5" width="15" height="6" rx="1" fill="white" fillOpacity="0.92" />
          <text x="22" y="71.7" textAnchor="middle" fontSize="3.2" fill="#1a1a1a" fontWeight="600" fontFamily="system-ui, sans-serif">
            45 cm
          </text>
          <text x="22" y="75.2" textAnchor="middle" fontSize="2.4" fill="#444" fontFamily="system-ui, sans-serif">
            Alt. assento
          </text>
        </svg>
      </div>

      {/* Legenda em tabela abaixo */}
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-secondary/40 border border-border px-3 py-2">
          <p className="text-xs text-muted-foreground">Altura do assento</p>
          <p className="text-base font-bold text-foreground">45 cm</p>
        </div>
        <div className="rounded-lg bg-secondary/40 border border-border px-3 py-2">
          <p className="text-xs text-muted-foreground">Prof. do braço</p>
          <p className="text-base font-bold text-foreground">95 cm</p>
        </div>
        <div className="rounded-lg bg-secondary/40 border border-border px-3 py-2">
          <p className="text-xs text-muted-foreground">Prof. total</p>
          <p className="text-base font-bold text-foreground">1,40 m</p>
        </div>
      </div>
    </div>
  );
}
