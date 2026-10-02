import { categoryById } from "./constants";

/**
 * Gerador de looks do botão "Sortear".
 *
 * Hoje é aleatório, mas sempre diferente do look atual e dos últimos sorteados.
 * Para colocar inteligência depois, basta trocar `scoreLook` (ou a função toda)
 * por regras de cor/ocasião/clima ou por uma chamada de IA — o resto do app
 * só usa `suggestLook`.
 */

const slotOf = (c) => categoryById(c.category)?.slot;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const lookKey = (ids) => [...ids].sort().join("|");
/** Chave só das peças principais: trocar só o acessório não conta como look novo. */
export const mainKey = (pieces) => lookKey(pieces.filter((p) => slotOf(p) !== "extra").map((p) => p.id));

// Ponto de extensão para a futura "IA": quanto maior, melhor o look.
// eslint-disable-next-line no-unused-vars
function scoreLook(pieces, context) {
  return Math.random();
}

function randomCandidate(bySlot) {
  const hasSeparates = bySlot.top?.length && bySlot.bottom?.length;
  const hasDress = bySlot.full?.length;
  const chosen = [];
  if (hasDress && (!hasSeparates || Math.random() < 0.35)) chosen.push(pick(bySlot.full));
  else {
    if (bySlot.top?.length) chosen.push(pick(bySlot.top));
    if (bySlot.bottom?.length) chosen.push(pick(bySlot.bottom));
  }
  if (bySlot.shoes?.length) chosen.push(pick(bySlot.shoes));
  if (bySlot.extra?.length && Math.random() < 0.4) chosen.push(pick(bySlot.extra));
  return chosen;
}

/** Quantas combinações principais (sem contar o extra) existem no closet. */
export function countCombos(bySlot) {
  const t = bySlot.top?.length || 0, b = bySlot.bottom?.length || 0, f = bySlot.full?.length || 0;
  const s = Math.max(1, bySlot.shoes?.length || 0);
  return (t && b ? t * b : t || b) * s + f * s;
}

/**
 * @param clothes todas as peças
 * @param avoid   chaves (lookKey) de looks que não devem se repetir
 * @returns { pieces, isNew } — isNew=false quando não há combinação inédita
 */
export function suggestLook(clothes, { avoid = [], context = {} } = {}) {
  const bySlot = {};
  for (const c of clothes) (bySlot[slotOf(c)] ||= []).push(c);
  const avoidSet = new Set(avoid);

  let best = null;
  for (let tries = 0; tries < 60; tries++) {
    const pieces = randomCandidate(bySlot);
    if (!pieces.length) break;
    const key = mainKey(pieces);
    if (avoidSet.has(key)) continue;
    const score = scoreLook(pieces, context);
    if (!best || score > best.score) best = { pieces, score };
    if (tries > 6) break; // já temos opções suficientes
  }
  if (best) return { pieces: best.pieces, isNew: true };
  return { pieces: randomCandidate(bySlot), isNew: false };
}
