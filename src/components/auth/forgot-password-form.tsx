"use client";

import Link from "next/link";
import { ArrowRight, LoaderCircle, Mail } from "lucide-react";
import { useActionState } from "react";

import { requestPasswordReset } from "@/app/actions/auth";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  return (
    <form action={action} className="space-y-5" noValidate>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-neutral-200" htmlFor="recovery-email">E-mail</label>
        <div className="input-shell">
          <Mail aria-hidden="true" className="text-neutral-500" size={18} />
          <input
            aria-describedby={state?.errors?.email ? "recovery-email-error" : undefined}
            aria-invalid={Boolean(state?.errors?.email)}
            autoComplete="email"
            className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-neutral-500"
            id="recovery-email"
            name="email"
            placeholder="voce@email.com"
            type="email"
          />
        </div>
        {state?.errors?.email?.[0] ? <p className="form-error" id="recovery-email-error">{state.errors.email[0]}</p> : null}
      </div>

      {state?.message ? <p aria-live="polite" className="rounded-md border border-lime-400/30 bg-lime-400/10 px-3 py-2 text-sm text-lime-200">{state.message}</p> : null}
      {state?.resetUrl ? (
        <Link className="secondary-button w-full" href={state.resetUrl}>
          Abrir link de recuperação <ArrowRight aria-hidden="true" size={18} />
        </Link>
      ) : null}

      <button className="primary-button w-full" disabled={pending} type="submit">
        {pending ? <LoaderCircle aria-hidden="true" className="animate-spin" size={19} /> : null}
        {pending ? "Gerando..." : "Recuperar senha"}
      </button>
      <p className="text-center text-sm"><Link className="font-bold text-lime-400 hover:text-lime-300" href="/entrar">Voltar para o login</Link></p>
    </form>
  );
}
