import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, Sparkles } from "lucide-react";
import Sheet from "./Sheet";
import ColorDot from "./ColorDot";
import { categoryById, colorById } from "../lib/constants";
import { useStore } from "../store/useStore";
import { useToast } from "./Toast";

export default function ClothDetail({ item, onClose }) {
  const { outfits, deleteCloth } = useStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const usedIn = item ? outfits.filter((o) => o.items.some((i) => i.clothId === item.id)).length : 0;

  const close = () => {
    setConfirm(false);
    onClose();
  };

  return (
    <Sheet open={Boolean(item)} onClose={close} label="Detalhes da peça">
      {item && (
        <div className="px-5 pb-6">
          <div className="checker mt-2 aspect-square overflow-hidden rounded-[24px] ring-1 ring-line">
            <img src={item.image} alt="" className="h-full w-full object-contain p-6" />
          </div>
          <div className="mt-5">
            <p className="text-sm font-semibold text-ink-mute">{categoryById(item.category)?.label}</p>
            <h2 className="font-display text-2xl font-semibold">{item.name || categoryById(item.category)?.label}</h2>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-line"><ColorDot color={item.color} /> {colorById(item.color)?.label}</span>
              {item.season && <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-line">{item.season}</span>}
              {item.occasions?.map((o) => <span key={o} className="rounded-full bg-cream px-3 py-1.5">{o}</span>)}
            </div>
            <p className="mt-3 text-sm text-ink-mute">{usedIn ? `Aparece em ${usedIn} ${usedIn === 1 ? "look" : "looks"}` : "Ainda não está em nenhum look"}</p>
          </div>

          {confirm ? (
            <div className="mt-6 rounded-2xl bg-red-50 p-4">
              <p className="font-semibold">Excluir essa peça?</p>
              <p className="mt-1 text-sm text-ink-soft">{usedIn ? `Ela some dos ${usedIn} looks onde aparece.` : "Não dá pra desfazer."}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button onClick={() => setConfirm(false)} className="rounded-full bg-white py-3 font-semibold ring-1 ring-line">Cancelar</button>
                <button onClick={() => { deleteCloth(item.id); toast("Peça excluída"); close(); }} className="rounded-full bg-red-600 py-3 font-semibold text-white">Excluir</button>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-2">
              <button onClick={() => { close(); navigate(`/criar-look?com=${item.id}`); }} className="flex items-center justify-center gap-2 rounded-full bg-ink py-3.5 font-semibold text-paper">
                <Sparkles size={18} /> Criar look com ela
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { close(); navigate(`/editar/${item.id}`); }} className="flex items-center justify-center gap-2 rounded-full bg-white py-3.5 font-semibold ring-1 ring-line">
                  <Pencil size={17} /> Editar
                </button>
                <button onClick={() => setConfirm(true)} className="flex items-center justify-center gap-2 rounded-full bg-white py-3.5 font-semibold text-red-600 ring-1 ring-line">
                  <Trash2 size={17} /> Excluir
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}
