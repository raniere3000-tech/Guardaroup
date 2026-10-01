import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import PageHeader from "../components/PageHeader";
import UploadForm from "../components/UploadForm";
import TipPopup from "../components/TipPopup";
import Sheet from "../components/Sheet";
import EmptyState from "../components/EmptyState";
import { useStore } from "../store/useStore";
import { useToast } from "../components/Toast";

export default function AddCloth() {
  const { id } = useParams();
  const { clothesById, addCloth, updateCloth, deleteCloth, clothes } = useStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [askDelete, setAskDelete] = useState(false);
  const editing = id ? clothesById[id] : null;

  if (id && !editing) return <><PageHeader title="Editar peça" back /><EmptyState title="Peça não encontrada" /></>;

  const save = (data) => {
    if (editing) {
      updateCloth(editing.id, data);
      toast("Alterações salvas!");
      navigate(-1);
    } else {
      addCloth(data);
      const n = clothes.length + 1;
      toast(n === 1 ? "Primeira peça no closet! 🎉" : n === 3 ? "3 peças! Já dá pra montar um look 👀" : "Peça salva no closet!");
      navigate("/guarda-roupa", { replace: true });
    }
  };

  return (
    <>
      <PageHeader title={editing ? "Editar peça" : "Nova peça"} back />
      <UploadForm key={id || "new"} initial={editing} onSave={save} onDelete={editing ? () => setAskDelete(true) : undefined} />
      {!editing && <TipPopup id="add" />}
      <Sheet open={askDelete} onClose={() => setAskDelete(false)} label="Confirmar exclusão">
        <div className="px-6 pb-6 pt-2">
          <h2 className="font-display text-2xl font-semibold">Excluir essa peça?</h2>
          <p className="mt-2 text-ink-soft">Ela também some dos looks onde aparece. Não dá pra desfazer.</p>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <button onClick={() => setAskDelete(false)} className="rounded-full bg-white py-3.5 font-semibold ring-1 ring-line">Cancelar</button>
            <button onClick={() => { deleteCloth(editing.id); toast("Peça excluída"); navigate("/guarda-roupa", { replace: true }); }} className="rounded-full bg-red-600 py-3.5 font-semibold text-white">Excluir</button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
