"use client";

import { useActionState } from "react";

import { LoaderCircle, LogIn } from "lucide-react";

import { joinRacha } from "@/app/actions/rachas";

export function JoinRachaForm() {
  const [state, action, pending] = useActionState(joinRacha, undefined);

  return (
    <form action={action} className="space-y-3">
      <label className="text-sm font-bold text-neutral-200" htmlFor="inviteCode">Entrar com código</label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="input-shell flex-1">
          <input
            aria-describedby={state?.error ? "invite-error" : undefined}
            aria-invalid={Boolean(state?.error)}
            autoCapitalize="characters"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-center font-mono text-lg font-bold uppercase text-white outline-none placeholder:text-neutral-600 sm:text-left"
            id="inviteCode"
            maxLength={6}
            name="inviteCode"
            placeholder="ARB7K2"
          />
        </div>
        <button className="secondary-button sm:min-w-32" disabled={pending} type="submit">
          {pending ? <LoaderCircle aria-hidden="true" className="animate-spin" size={18} /> : <LogIn aria-hidden="true" size={18} />}
          Entrar
        </button>
      </div>
      {state?.error ? <p aria-live="polite" className="form-error" id="invite-error">{state.error}</p> : null}
    </form>
  );
}
