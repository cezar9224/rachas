"use client";

import { Dices } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { generateTeams } from "@/app/actions/teams";

const TEAM_STYLES = [
  { color: "#38bdf8", name: "Time Azul" },
  { color: "#f87171", name: "Time Vermelho" },
  { color: "#4ade80", name: "Time Verde" },
  { color: "#facc15", name: "Time Amarelo" },
  { color: "#fb923c", name: "Time Laranja" },
  { color: "#c084fc", name: "Time Roxo" },
  { color: "#22d3ee", name: "Time Ciano" },
  { color: "#e5e7eb", name: "Time Branco" },
  { color: "#171717", name: "Time Preto" },
] as const;

export function DrawTeamsButton({ hasTeams, matchId, rachaId }: { hasTeams: boolean; matchId: string; rachaId: string }) {
  const action = generateTeams.bind(null, rachaId, matchId);
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form
      action={formAction}
      className="mt-7"
      onSubmit={(event) => {
        if (hasTeams && !window.confirm("Sortear novamente? A formação atual será substituída.")) event.preventDefault();
      }}
    >
      <details className="mb-4 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
        <summary className="cursor-pointer font-bold text-white">Personalizar times</summary>
        <p className="mt-2 text-sm text-neutral-400">Escolha as cores e, se quiser, altere os nomes.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {TEAM_STYLES.map((style, index) => <label className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 rounded-lg border border-neutral-800 p-3" key={style.color}>
            <input className="peer size-4 accent-lime-400" defaultChecked name="teamStyle" type="checkbox" value={index} />
            <span className="flex items-center gap-2 text-sm font-bold text-neutral-200">
              <span className="size-4 rounded-full border border-neutral-500" style={{ backgroundColor: style.color }} /> {style.name}
            </span>
            <input aria-label={`Nome para ${style.name}`} className="form-control col-span-2 disabled:cursor-not-allowed disabled:opacity-40" maxLength={30} name={`teamName_${index}`} placeholder="Nome personalizado (opcional)" />
          </label>)}
        </div>
      </details>
      <SubmitButton hasTeams={hasTeams} />
      {state?.error ? <p className="mt-3 text-sm font-semibold text-red-300">{state.error}</p> : null}
      {state?.message ? <p className="mt-3 text-sm font-semibold text-lime-300">{state.message}</p> : null}
    </form>
  );
}

function SubmitButton({ hasTeams }: { hasTeams: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="primary-button w-full" disabled={pending} type="submit">
      <Dices aria-hidden="true" size={19} />
      {pending ? "Equilibrando..." : hasTeams ? "Sortear novamente" : "Sortear times"}
    </button>
  );
}
