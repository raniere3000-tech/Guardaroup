import { motion } from "framer-motion";

/** Lista de chips roláveis. options: [{ id, label, count? }] */
export default function FilterBar({ options, value, onChange, className = "" }) {
  return (
    <div className={`no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 py-1 ${className}`} role="tablist">
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.id)}
            className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${active ? "text-paper" : "bg-white text-ink-soft ring-1 ring-line"}`}
          >
            {active && <motion.span layoutId={`chip-${options[0]?.id}`} className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", damping: 26, stiffness: 340 }} />}
            <span className="relative">
              {o.label}
              {o.count !== undefined && <span className={`ml-1.5 text-xs ${active ? "text-paper/60" : "text-ink-mute"}`}>{o.count}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
