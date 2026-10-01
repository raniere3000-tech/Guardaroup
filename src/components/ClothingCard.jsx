import { motion } from "framer-motion";
import { categoryById, colorById } from "../lib/constants";
import ColorDot from "./ColorDot";

export default function ClothingCard({ item, onClick, compact = false, selected = false }) {
  const cat = categoryById(item.category);
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`group w-full text-left rounded-3xl bg-white p-2 ring-1 transition-shadow ${selected ? "ring-2 ring-ink" : "ring-line hover:shadow-md"}`}
    >
      <div className={`checker relative overflow-hidden rounded-[18px] ${compact ? "aspect-square" : "aspect-[4/5]"}`}>
        <img src={item.image} alt={item.name || cat?.label || "Peça"} loading="lazy" className="absolute inset-0 h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105" />
      </div>
      {!compact && (
        <div className="flex items-center gap-1.5 px-1.5 pt-2 pb-0.5">
          <ColorDot color={item.color} />
          <span className="truncate text-sm font-semibold">{item.name || cat?.label}</span>
          {item.name && <span className="ml-auto shrink-0 text-xs text-ink-mute">{cat?.label}</span>}
          {!item.name && <span className="ml-auto shrink-0 text-xs text-ink-mute">{colorById(item.color)?.label}</span>}
        </div>
      )}
    </motion.button>
  );
}
