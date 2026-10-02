import { useEffect, useRef, useState } from "react";

/**
 * Mede o espaço livre de um container e devolve a maior largura
 * que cabe nele mantendo a proporção (altura = largura × ratio).
 * Assim o quadro nunca fica escondido atrás da bandeja ou da barra de baixo.
 */
export function useFitWidth(ratio, { max = 448, min = 180 } = {}) {
  const ref = useRef(null);
  const [width, setWidth] = useState(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width: w, height: h } = e.contentRect;
      setWidth(Math.max(min, Math.floor(Math.min(w, h / ratio, max))));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ratio, max, min]);
  return [ref, width];
}
