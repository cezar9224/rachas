"use client";

import { Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { deleteMatch } from "@/app/actions/matches";

type DeleteMatchButtonProps = {
  matchId: string;
  rachaId: string;
};

export function DeleteMatchButton({ matchId, rachaId }: DeleteMatchButtonProps) {
  const deleteCurrentMatch = deleteMatch.bind(null, rachaId, matchId);

  return (
    <form
      action={deleteCurrentMatch}
      className="mt-4 border-t border-neutral-800 pt-4"
      onSubmit={(event) => {
        const confirmed = window.confirm(
          "Cancelar esta partida? O evento, as confirmações e a lista de espera serão apagados permanentemente.",
        );

        if (!confirmed) event.preventDefault();
      }}
    >
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-red-500/50 bg-red-500/10 px-4 text-sm font-bold text-red-300 transition-colors hover:border-red-400 hover:bg-red-500/20 disabled:cursor-wait disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      <Trash2 aria-hidden="true" size={17} />
      {pending ? "Cancelando..." : "Cancelar partida"}
    </button>
  );
}
