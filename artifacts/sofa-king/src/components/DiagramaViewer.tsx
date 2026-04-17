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
          <marker id="vw-arr-s" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <polygon points="6,1 6,5 1,3" fill="#c9a96e" />
          </marker>
          <marker id="vw-arr-e" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <polygon points="0,1 0,5 5,3" fill="#c9a96e" />
          </marker>
          <filter id="vw-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0.3" stdDeviation="0.5" floodColor="#000" floodOpacity="0.5" />
          </filter>
        </defs>

        {anotacoes.map((ann) => {
          const mx = (ann.x1 + ann.x2) / 2;
          const my = (ann.y1 + ann.y2) / 2;
          const chars = Math.max(ann.label.length, (ann.sublabel || "").length);
          const lw = chars * 1.5 + 4;
          const lh = ann.sublabel ? 7 : 5;

          return (
            <g key={ann.id}>
              <line
                x1={ann.x1} y1={ann.y1} x2={ann.x2} y2={ann.y2}
                stroke="#c9a96e" strokeWidth="0.6"
                markerStart="url(#vw-arr-s)" markerEnd="url(#vw-arr-e)"
              />
              {(ann.label || ann.sublabel) && (
                <>
                  <rect
                    x={mx - lw / 2} y={my - lh / 2}
                    width={lw} height={lh}
                    rx="1.2"
                    fill="#1a1208" fillOpacity="0.82"
                    stroke="#c9a96e" strokeWidth="0.3" strokeOpacity="0.7"
                    filter="url(#vw-shadow)"
                  />
                  {ann.label && (
                    <text
                      x={mx} y={my + (ann.sublabel ? -0.6 : 1)}
                      textAnchor="middle" fontSize="3" fill="#f0dca8"
                      fontWeight="700" fontFamily="system-ui, sans-serif"
                    >
                      {ann.label}
                    </text>
                  )}
                  {ann.sublabel && (
                    <text
                      x={mx} y={my + 3.2}
                      textAnchor="middle" fontSize="2.2" fill="#c9a96e"
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
