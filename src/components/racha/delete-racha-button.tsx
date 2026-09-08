"use client";

import { Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { deleteRacha } from "@/app/actions/rachas";

export function DeleteRachaButton({ id, name }: { id: string; name: string }) {
  const deleteCurrentRacha = deleteRacha.bind(null, id);

  return (
    <form
      action={deleteCurrentRacha}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Excluir "${name}" permanentemente? Todos os membros, partidas, avaliações e times deste racha serão apagados. Esta ação não pode ser desfeita.`,
        );
        if (!confirmed) event.preventDefault();
      }}
    >
      <DeleteButton name={name} />
    </form>
  );
}

function DeleteButton({ name }: { name: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-label={`Excluir ${name}`}
      className="icon-button border border-red-500/30 bg-red-500/10 text-red-300 hover:border-red-400 hover:bg-red-500/20 disabled:cursor-wait disabled:opacity-50"
      disabled={pending}
      title={`Excluir ${name}`}
      type="submit"
    >
      <Trash2 aria-hidden="true" size={17} />
    </button>
  );
}
