"use client";

import { Save, Star } from "lucide-react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { saveInitialRating, savePlayerRating } from "@/app/actions/ratings";

type RatingFormProps = {
  initialValue: number | null;
  mode: "initial" | "peer";
  rachaId: string;
  targetMemberId: string;
};

export function RatingForm({ initialValue, mode, rachaId, targetMemberId }: RatingFormProps) {
  const action = mode === "peer"
    ? savePlayerRating.bind(null, rachaId, targetMemberId)
    : saveInitialRating.bind(null, rachaId, targetMemberId);
  const [state, formAction] = useActionState(action, undefined);
  const [value, setValue] = useState(initialValue ?? 7.5);

  return (
    <form action={formAction} className="mt-4">
      <div className="flex items-center gap-4">
        <input
          aria-label={mode === "peer" ? "Sua avaliação" : "Nota inicial"}
          className="h-2 min-w-0 flex-1 cursor-pointer accent-lime-400"
          max="10"
          min="0"
          name="value"
          onChange={(event) => setValue(Number(event.target.value))}
          step="0.5"
          type="range"
          value={value}
        />
        <output className="inline-flex w-14 flex-none items-center justify-center gap-1 text-lg font-black text-yellow-300">
          <Star aria-hidden="true" fill="currentColor" size={16} /> {value.toFixed(1)}
        </output>
      </div>
      {state?.error ? <p className="mt-3 text-sm font-semibold text-red-300">{state.error}</p> : null}
      {state?.message ? <p className="mt-3 text-sm font-semibold text-lime-300">{state.message}</p> : null}
      <SubmitButton label={mode === "peer" ? "Salvar avaliação" : "Salvar nota inicial"} />
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button className="secondary-button mt-4 w-full" disabled={pending} type="submit">
      <Save aria-hidden="true" size={17} /> {pending ? "Salvando..." : label}
    </button>
  );
}
