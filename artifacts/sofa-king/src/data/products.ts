export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  longDescription: string;
  image: string;
  dimensions: string;
  colors: string[];
  fabrics: string[];
}

export const products: Product[] = [
  {
    id: "sofa-retratil",
    name: "Sofá Retrátil Milano",
    price: 3299,
    description: "Elegante e funcional, 3 lugares, retrátil e reclinável.",
    longDescription: "O Sofá Milano foi desenhado para quem não abre mão do conforto sem perder a sofisticação. Seus assentos retráteis e encostos reclináveis oferecem a ergonomia perfeita para longas sessões de cinema em casa ou para receber amigos com elegância.",
    image: "/images/sofa-retratil.png",
    dimensions: "2.40m (L) x 1.10m (P fechado) / 1.60m (P aberto) x 0.95m (A)",
    colors: ["Bege Claro", "Cinza Chumbo", "Terracota"],
    fabrics: ["Linho Premium", "Veludo Soft"]
  },
  {
    id: "sofa-canto",
    name: "Sofá de Canto Venezia",
    price: 4599,
    description: "Sofá em L, 5 lugares, espuma D33 e design minimalista.",
    longDescription: "Aproveite ao máximo o espaço da sua sala com o Sofá Venezia. Seu formato em L convida à socialização, criando um ambiente acolhedor. Estruturado com madeira de reflorestamento e assentos com espuma D33 para máxima durabilidade.",
    image: "/images/sofa-canto.png",
    dimensions: "2.90m x 2.20m (L) x 0.90m (P) x 0.85m (A)",
    colors: ["Areia", "Verde Musgo", "Azul Marinho"],
    fabrics: ["Sarja", "Suede"]
  },
  {
    id: "sofa-namoradeira",
    name: "Namoradeira Florença",
    price: 1899,
    description: "2 lugares, perfeito para varandas e espaços compactos.",
    longDescription: "Compacta, charmosa e extremamente confortável. A Namoradeira Florença é a peça que faltava no seu quarto, escritório ou varanda coberta. Suas curvas orgânicas trazem um toque contemporâneo para qualquer ambiente.",
    image: "/images/sofa-namoradeira.png",
    dimensions: "1.50m (L) x 0.85m (P) x 0.80m (A)",
    colors: ["Rose", "Mostarda", "Off-White"],
    fabrics: ["Bouclé", "Lona"]
  },
  {
    id: "sofa-modular",
    name: "Sofá Modular Berlim",
    price: 5999,
    description: "Totalmente configurável, até 7 lugares, tecido veludo de luxo.",
    longDescription: "Liberdade para criar. O Sofá Berlim é composto por módulos independentes que se adaptam perfeitamente ao seu estilo de vida. Mude a configuração sempre que quiser, transformando sua sala para diferentes ocasiões.",
    image: "/images/sofa-modular.png",
    dimensions: "Módulo base: 0.90m x 0.90m",
    colors: ["Preto", "Vinho", "Caramelo"],
    fabrics: ["Veludo Cotelê", "Couro Sintético"]
  }
];
