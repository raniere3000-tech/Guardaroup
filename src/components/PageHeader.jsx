import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PageHeader({ title, subtitle, back = false, right }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur-md pt-safe">
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-5 py-3.5">
        {back && (
          <button onClick={() => navigate(-1)} aria-label="Voltar" className="-ml-2 grid size-10 place-items-center rounded-full hover:bg-cream active:scale-95 transition">
            <ChevronLeft size={24} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[26px] leading-tight font-semibold tracking-tight truncate">{title}</h1>
          {subtitle && <p className="text-sm text-ink-mute truncate">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}
