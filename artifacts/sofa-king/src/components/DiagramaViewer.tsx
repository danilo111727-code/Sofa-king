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
          <marker id="vw-arr-s" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto">
            <polygon points="5,0 5,5 0,2.5" fill="#1a1a1a" />
          </marker>
          <marker id="vw-arr-e" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto">
            <polygon points="0,0 0,5 5,2.5" fill="#1a1a1a" />
          </marker>
        </defs>

        {anotacoes.map((ann) => {
          const mx = (ann.x1 + ann.x2) / 2;
          const my = (ann.y1 + ann.y2) / 2;

          return (
            <g key={ann.id}>
              <line
                x1={ann.x1} y1={ann.y1} x2={ann.x2} y2={ann.y2}
                stroke="#1a1a1a" strokeWidth="0.5"
                markerStart="url(#vw-arr-s)" markerEnd="url(#vw-arr-e)"
              />
              {ann.label && (
                <text
                  x={mx} y={my - 1}
                  textAnchor="middle" fontSize="3.2" fill="#1a1a1a"
                  fontWeight="700" fontFamily="system-ui, sans-serif"
                >
                  {ann.label}
                </text>
              )}
              {ann.sublabel && (
                <text
                  x={mx} y={my + 3}
                  textAnchor="middle" fontSize="2.3" fill="#333"
                  fontFamily="system-ui, sans-serif"
                >
                  {ann.sublabel}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
