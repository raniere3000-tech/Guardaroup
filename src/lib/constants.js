// Cole aqui o link do seu Google Forms para o botão "Mandar feedback" aparecer.
export const FEEDBACK_URL = "";

export const CATEGORIES = [
  { id: "blusa", label: "Blusa", slot: "top" },
  { id: "camiseta", label: "Camiseta", slot: "top" },
  { id: "camisa", label: "Camisa", slot: "top" },
  { id: "casaco", label: "Casaco", slot: "top" },
  { id: "calca", label: "Calça", slot: "bottom" },
  { id: "saia", label: "Saia", slot: "bottom" },
  { id: "short", label: "Short", slot: "bottom" },
  { id: "vestido", label: "Vestido", slot: "full" },
  { id: "sapato", label: "Sapato", slot: "shoes" },
  { id: "tenis", label: "Tênis", slot: "shoes" },
  { id: "bolsa", label: "Bolsa", slot: "extra" },
  { id: "acessorio", label: "Acessório", slot: "extra" },
];

export const categoryById = (id) => CATEGORIES.find((c) => c.id === id);

// Espaços do criador de looks. "full" (vestido) ocupa cima + baixo.
export const SLOTS = [
  { id: "top", label: "Parte de cima", short: "Cima" },
  { id: "bottom", label: "Parte de baixo", short: "Baixo" },
  { id: "full", label: "Peça única", short: "Vestido" },
  { id: "shoes", label: "Calçado", short: "Calçado" },
  { id: "extra", label: "Bolsa ou acessório", short: "Extra" },
];

// Posição inicial de cada espaço no quadro (frações da largura/altura)
export const SLOT_LAYOUT = {
  top: { x: 0.2, y: 0.03, w: 0.6, h: 0.36, z: 3 },
  bottom: { x: 0.24, y: 0.37, w: 0.52, h: 0.4, z: 2 },
  full: { x: 0.18, y: 0.03, w: 0.64, h: 0.72, z: 2 },
  shoes: { x: 0.3, y: 0.78, w: 0.4, h: 0.19, z: 4 },
  extra: { x: 0.68, y: 0.42, w: 0.3, h: 0.26, z: 5 },
};

export const COLORS = [
  { id: "preto", label: "Preto", hex: "#1C1A17" },
  { id: "branco", label: "Branco", hex: "#FFFFFF" },
  { id: "cinza", label: "Cinza", hex: "#A3A09A" },
  { id: "bege", label: "Bege", hex: "#D9C3A0" },
  { id: "marrom", label: "Marrom", hex: "#7A5232" },
  { id: "marinho", label: "Azul-marinho", hex: "#22304F" },
  { id: "azul", label: "Azul", hex: "#5B8BD0" },
  { id: "jeans", label: "Jeans", hex: "#4F6F94" },
  { id: "verde", label: "Verde", hex: "#5E8A5A" },
  { id: "vermelho", label: "Vermelho", hex: "#C2413A" },
  { id: "rosa", label: "Rosa", hex: "#EBA6B9" },
  { id: "amarelo", label: "Amarelo", hex: "#F2CF4A" },
  { id: "laranja", label: "Laranja", hex: "#E8873A" },
  { id: "roxo", label: "Roxo", hex: "#7D5BA6" },
  { id: "estampado", label: "Estampado", hex: "conic-gradient(#EBA6B9, #F2CF4A, #5B8BD0, #5E8A5A, #EBA6B9)" },
];

export const colorById = (id) => COLORS.find((c) => c.id === id);

export const OCCASIONS = ["Casual", "Trabalho", "Festa", "Encontro", "Academia", "Viagem"];
export const SEASONS = ["Calor", "Frio", "Meia-estação", "Qualquer"];

export const DEFAULT_LOOK_CATEGORIES = ["Dia a dia", "Trabalho", "Rolê", "Festa"];

// Pop-ups de dica que aparecem na primeira visita a cada tela
export const TIPS = {
  home: {
    title: "Bem-vindo ao seu closet ✨",
    text: "Comece cadastrando algumas peças. Quanto mais roupas, mais looks você consegue montar.",
  },
  add: {
    title: "Foto boa = look bonito 📸",
    text: "Coloque a peça esticada num fundo liso e com boa luz. O Vestí tira o fundo sozinho, sem você fazer nada.",
  },
  wardrobe: {
    title: "Seu guarda-roupa 👀",
    text: "Use os filtros lá em cima pra achar rapidinho. Toque numa peça pra ver detalhes, editar ou excluir.",
  },
  creator: {
    title: "Hora de montar 🎨",
    text: "Escolha uma peça em cada espaço aqui embaixo. Depois arraste e use a bolinha no canto pra mudar o tamanho. Sem ideia? Toque em “Sortear”.",
  },
  outfits: {
    title: "Seus looks salvos 💾",
    text: "Toque num look pra ver, baixar a imagem ou mandar pros amigos.",
  },
};
