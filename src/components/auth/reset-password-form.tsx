"use client";

import { Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { useActionState, useState } from "react";

import { resetPassword } from "@/app/actions/auth";

export function ResetPasswordForm({ token }: { token: string }) {
  const resetWithToken = resetPassword.bind(null, token);
  const [state, action, pending] = useActionState(resetWithToken, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="space-y-5" noValidate>
      <PasswordField error={state?.errors?.password} label="Nova senha" name="password" show={showPassword} />
      <PasswordField error={state?.errors?.confirmPassword} label="Confirmar nova senha" name="confirmPassword" show={showPassword} />

      <button className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-neutral-400 hover:text-white" onClick={() => setShowPassword((current) => !current)} type="button">
        {showPassword ? <EyeOff aria-hidden="true" size={17} /> : <Eye aria-hidden="true" size={17} />}
        {showPassword ? "Ocultar senhas" : "Mostrar senhas"}
      </button>

      {state?.message ? <p aria-live="polite" className="rounded-md border border-red-500/40 bg-red-950/70 px-3 py-2 text-sm text-red-200">{state.message}</p> : null}
      <button className="primary-button w-full" disabled={pending} type="submit">
        {pending ? <LoaderCircle aria-hidden="true" className="animate-spin" size={19} /> : null}
        {pending ? "Salvando..." : "Redefinir senha"}
      </button>
    </form>
  );
}

function PasswordField({ error, label, name, show }: { error?: string[]; label: string; name: string; show: boolean }) {
  const errorId = `${name}-error`;
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-neutral-200" htmlFor={name}>{label}</label>
      <div className="input-shell">
        <LockKeyhole aria-hidden="true" className="text-neutral-500" size={18} />
        <input
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          autoComplete="new-password"
          className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-neutral-500"
          id={name}
          name={name}
          placeholder="Mínimo de 8 caracteres"
          type={show ? "text" : "password"}
        />
      </div>
      {error ? <div className="space-y-1" id={errorId}>{error.map((message) => <p className="form-error" key={message}>{message}</p>)}</div> : null}
    </div>
  );
}
