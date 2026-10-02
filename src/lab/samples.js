// Peças de exemplo (desenhos simples, fundo transparente) para testar o laboratório
// sem precisar cadastrar nada. Cada uma tem slot, categoria e proporção.

const svg = (w, h, body) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${body}</svg>`)}`;

const tee = (fill, extra = "") =>
  `<path d="M70 10 L120 0 Q150 25 180 0 L230 10 L300 80 L255 125 L230 100 L230 330 L70 330 L70 100 L45 125 L0 80 Z" fill="${fill}" stroke="rgba(0,0,0,.18)" stroke-width="3"/>${extra}`;

const stripes = Array.from({ length: 12 }, (_, i) => `<rect x="70" y="${110 + i * 19}" width="160" height="9" fill="#1C1A17"/>`).join("");

export const SAMPLES = [
  { id: "s-tee-rosa", slot: "top", category: "camiseta", name: "Camiseta rosa", aspect: 300 / 330, image: svg(300, 330, tee("#EBA6B9")) },
  { id: "s-tee-listrada", slot: "top", category: "blusa", name: "Blusa listrada", aspect: 300 / 330, image: svg(300, 330, tee("#F7F4EC", stripes)) },
  { id: "s-camisa-azul", slot: "top", category: "camisa", name: "Camisa azul", aspect: 300 / 330, image: svg(300, 330, tee("#5B8BD0", `<path d="M150 25 L150 330" stroke="rgba(255,255,255,.7)" stroke-width="4"/><circle cx="150" cy="120" r="5" fill="#fff"/><circle cx="150" cy="180" r="5" fill="#fff"/><circle cx="150" cy="240" r="5" fill="#fff"/>`)) },
  { id: "s-calca-jeans", slot: "bottom", category: "calca", name: "Calça jeans", aspect: 200 / 380, image: svg(200, 380, `<path d="M15 0 H185 L200 380 H118 L100 120 L82 380 H0 Z" fill="#4F6F94" stroke="rgba(0,0,0,.2)" stroke-width="3"/>`) },
  { id: "s-saia-bege", slot: "bottom", category: "saia", name: "Saia bege", aspect: 260 / 220, image: svg(260, 220, `<path d="M70 0 H190 L260 220 H0 Z" fill="#D9C3A0" stroke="rgba(0,0,0,.18)" stroke-width="3"/>`) },
  { id: "s-short-preto", slot: "bottom", category: "short", name: "Short preto", aspect: 220 / 160, image: svg(220, 160, `<path d="M10 0 H210 L220 160 H128 L110 60 L92 160 H0 Z" fill="#2A2724" stroke="rgba(255,255,255,.15)" stroke-width="3"/>`) },
  { id: "s-vestido", slot: "full", category: "vestido", name: "Vestido vermelho", aspect: 280 / 520, image: svg(280, 520, `<path d="M95 0 L120 30 H160 L185 0 L200 170 L280 520 H0 L80 170 Z" fill="#C2413A" stroke="rgba(0,0,0,.18)" stroke-width="3"/>`) },
  { id: "s-tenis", slot: "shoes", category: "tenis", name: "Tênis branco", aspect: 300 / 120, image: svg(300, 120, `<rect x="0" y="30" width="135" height="70" rx="30" fill="#FFFFFF" stroke="#BDB6A8" stroke-width="4"/><rect x="0" y="92" width="135" height="20" rx="8" fill="#1C1A17"/><rect x="165" y="30" width="135" height="70" rx="30" fill="#FFFFFF" stroke="#BDB6A8" stroke-width="4"/><rect x="165" y="92" width="135" height="20" rx="8" fill="#1C1A17"/>`) },
  { id: "s-sapato", slot: "shoes", category: "sapato", name: "Mocassim preto", aspect: 300 / 110, image: svg(300, 110, `<rect x="0" y="25" width="135" height="70" rx="26" fill="#1C1A17"/><rect x="165" y="25" width="135" height="70" rx="26" fill="#1C1A17"/><path d="M30 50 H105 M195 50 H270" stroke="#8F887C" stroke-width="6" stroke-dasharray="10 6"/>`) },
  { id: "s-bolsa", slot: "extra", category: "bolsa", name: "Bolsa caramelo", aspect: 220 / 220, image: svg(220, 220, `<path d="M60 80 Q60 10 110 10 Q160 10 160 80" fill="none" stroke="#7A5232" stroke-width="12"/><rect x="10" y="80" width="200" height="140" rx="24" fill="#A8743F"/>`) },
];
