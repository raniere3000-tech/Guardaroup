import { colorById } from "../lib/constants";

export default function ColorDot({ color, size = 14, className = "" }) {
  const c = colorById(color);
  if (!c) return null;
  return (
    <span
      title={c.label}
      className={`inline-block shrink-0 rounded-full ring-1 ring-ink/15 ${className}`}
      style={{ width: size, height: size, background: c.hex }}
    />
  );
}
