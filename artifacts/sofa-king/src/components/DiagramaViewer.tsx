import type { DiagramaAnotacao } from "@/lib/api";

interface Props {
  imageUrl: string;
  anotacoes: DiagramaAnotacao[];
}

export function DiagramaViewer({ imageUrl, anotacoes }: Props) {
  return (
    <div className="w-full h-full relative">
      <img
        src={imageUrl}
        alt="Diagrama de medidas"
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
          <marker id="vw-arr-s" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M8,2 L2,4 L8,6" fill="none" stroke="#1a1a1a" strokeWidth="1.2" />
          </marker>
          <marker id="vw-arr-e" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M2,2 L8,4 L2,6" fill="none" stroke="#1a1a1a" strokeWidth="1.2" />
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
                stroke="#1a1a1a" strokeWidth="0.8" strokeDasharray="2,1.2"
                markerStart="url(#vw-arr-s)" markerEnd="url(#vw-arr-e)"
              />
              {(ann.label || ann.sublabel) && (
                <>
                  <rect
                    x={mx - lw / 2} y={my - lh / 2}
                    width={lw} height={lh}
                    rx="1" fill="white" fillOpacity="0.92"
                  />
                  {ann.label && (
                    <text
                      x={mx} y={my + (ann.sublabel ? -0.5 : 0.8)}
                      textAnchor="middle" fontSize="3" fill="#1a1a1a"
                      fontWeight="700" fontFamily="system-ui, sans-serif"
                    >
                      {ann.label}
                    </text>
                  )}
                  {ann.sublabel && (
                    <text
                      x={mx} y={my + 3.2}
                      textAnchor="middle" fontSize="2.2" fill="#555"
                      fontFamily="system-ui, sans-serif"
                    >
                      {ann.sublabel}
                    </text>
                  )}
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
