"use client";

import { useActionState, useState } from "react";

import Link from "next/link";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, UserRound } from "lucide-react";

import { signIn, signUp } from "@/app/actions/auth";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
  notice?: string;
};

export function AuthForm({ mode, notice }: AuthFormProps) {
  const isSignUp = mode === "sign-up";
  const [showPassword, setShowPassword] = useState(false);
  const [state, action, pending] = useActionState(isSignUp ? signUp : signIn, undefined);

  return (
    <form action={action} className="space-y-5" noValidate>
      {isSignUp ? (
        <Field
          autoComplete="name"
          error={state?.errors?.name?.[0]}
          icon={<UserRound aria-hidden="true" size={18} />}
          label="Nome"
          name="name"
          placeholder="Seu nome"
        />
      ) : null}

      <Field
        autoComplete="email"
        error={state?.errors?.email?.[0]}
        icon={<Mail aria-hidden="true" size={18} />}
        label="E-mail"
        name="email"
        placeholder="voce@email.com"
        type="email"
      />

      <div className="space-y-2">
        <label className="text-sm font-semibold text-neutral-200" htmlFor="password">
          Senha
        </label>
        <div className="input-shell">
          <LockKeyhole aria-hidden="true" className="text-neutral-500" size={18} />
          <input
            aria-describedby={state?.errors?.password ? "password-error" : undefined}
            aria-invalid={Boolean(state?.errors?.password)}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-neutral-500"
            id="password"
            name="password"
            placeholder={isSignUp ? "Mínimo de 8 caracteres" : "Sua senha"}
            type={showPassword ? "text" : "password"}
          />
          <button
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="icon-button"
            onClick={() => setShowPassword((visible) => !visible)}
            title={showPassword ? "Ocultar senha" : "Mostrar senha"}
            type="button"
          >
            {showPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
          </button>
        </div>
        {state?.errors?.password ? (
          <div className="space-y-1" id="password-error">
            {state.errors.password.map((error) => (
              <p className="form-error" key={error}>{error}</p>
            ))}
          </div>
        ) : null}
      </div>

      {!isSignUp ? (
        <div className="-mt-3 text-right">
          <Link className="text-sm font-bold text-lime-400 hover:text-lime-300" href="/esqueci-senha">Esqueci minha senha</Link>
        </div>
      ) : null}

      {notice ? <p className="rounded-md border border-lime-400/30 bg-lime-400/10 px-3 py-2 text-sm text-lime-200">{notice}</p> : null}

      {state?.message ? (
        <p aria-live="polite" className="rounded-md border border-red-500/40 bg-red-950/70 px-3 py-2 text-sm text-red-200">
          {state.message}
        </p>
      ) : null}

      <button className="primary-button w-full" disabled={pending} type="submit">
        {pending ? <LoaderCircle aria-hidden="true" className="animate-spin" size={19} /> : null}
        {pending ? "Aguarde" : isSignUp ? "Criar conta" : "Entrar"}
      </button>

      <p className="text-center text-sm text-neutral-400">
        {isSignUp ? "Já tem uma conta?" : "Ainda não tem conta?"}{" "}
        <Link className="font-bold text-lime-400 hover:text-lime-300" href={isSignUp ? "/entrar" : "/cadastro"}>
          {isSignUp ? "Entrar" : "Criar conta"}
        </Link>
      </p>
    </form>
  );
}

type FieldProps = {
  autoComplete: string;
  error?: string;
  icon: React.ReactNode;
  label: string;
  name: string;
  placeholder: string;
  type?: "email" | "text";
};

function Field({ autoComplete, error, icon, label, name, placeholder, type = "text" }: FieldProps) {
  const errorId = `${name}-error`;

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-neutral-200" htmlFor={name}>{label}</label>
      <div className="input-shell">
        <span className="text-neutral-500">{icon}</span>
        <input
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          autoComplete={autoComplete}
          className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-neutral-500"
          id={name}
          name={name}
          placeholder={placeholder}
          type={type}
        />
      </div>
      {error ? <p className="form-error" id={errorId}>{error}</p> : null}
    </div>
  );
}
