import { motion } from "framer-motion";

/** Ilustração de cabide com roupa, usada nos estados vazios. */
export function HangerIllustration({ className = "" }) {
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden="true">
      <ellipse cx="120" cy="182" rx="78" ry="9" fill="#EFE7D6" />
      <line x1="20" y1="34" x2="220" y2="34" stroke="#E8D2AB" strokeWidth="6" strokeLinecap="round" />
      <g fill="none" stroke="#1C1A17" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M110 34c0-9 7-13 12-11 6 2 7 10 2 14-4 3-4 6-4 10v4" />
      </g>
      <path d="M120 51 72 74c-4 2-6 6-5 10l6 24 14-4v62c0 4 3 6 6 6h54c3 0 6-2 6-6v-62l14 4 6-24c1-4-1-8-5-10l-48-23z" fill="#FFF1C9" stroke="#1C1A17" strokeWidth="4" strokeLinejoin="round" />
      <path d="M104 58c4 10 28 10 32 0" fill="none" stroke="#1C1A17" strokeWidth="4" strokeLinecap="round" />
      <circle cx="196" cy="70" r="10" fill="#FFDFBC" />
      <circle cx="44" cy="96" r="7" fill="#E8DEAB" />
      <path d="M190 118l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" fill="#E8D2AB" />
    </svg>
  );
}

export default function EmptyState({ title, text, action }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center px-8 py-10 text-center">
      <motion.div animate={{ rotate: [-3, 3, -3] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} style={{ originY: 0.15 }}>
        <HangerIllustration className="w-52" />
      </motion.div>
      <h2 className="mt-4 font-display text-2xl font-semibold">{title}</h2>
      {text && <p className="mt-2 max-w-xs text-ink-soft">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}
