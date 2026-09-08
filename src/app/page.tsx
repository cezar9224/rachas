import Link from "next/link";
import { ArrowRight, LogIn, Trophy, UserPlus } from "lucide-react";

import { getCurrentUser } from "@/server/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main className="app-background home-background flex min-h-screen justify-center px-4 py-6 sm:items-center sm:py-10">
      <div className="home-panel flex w-full max-w-lg flex-col">
        <div aria-hidden="true" className="home-motion-layer">
          <span className="home-ball home-ball-one">⚽</span>
          <span className="home-ball home-ball-two">⚽</span>
          <span className="home-ball home-ball-three">⚽</span>
          <span className="home-runner">
            <span className="home-runner-head" />
            <span className="home-runner-body" />
            <span className="home-runner-arm home-runner-arm-front" />
            <span className="home-runner-arm home-runner-arm-back" />
            <span className="home-runner-leg home-runner-leg-front" />
            <span className="home-runner-leg home-runner-leg-back" />
          </span>
        </div>
        <header className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <span className="brand-mark"><Trophy aria-hidden="true" size={24} /></span>
            <span className="text-xl font-black text-white">Rachas</span>
          </div>
          {user ? (
            <Link className="inline-flex items-center gap-1.5 text-sm font-bold text-lime-400" href="/app">
              Minha conta <ArrowRight aria-hidden="true" size={17} />
            </Link>
          ) : (
            <Link className="text-sm font-bold text-neutral-300 hover:text-white" href="/entrar">Entrar</Link>
          )}
        </header>

        <section className="flex flex-1 flex-col justify-center py-16 sm:py-20">
          <div className="home-trophy mb-8 flex h-24 w-24 items-center justify-center rounded-lg border border-lime-400/40 bg-lime-400/10 text-lime-400">
            <Trophy aria-hidden="true" size={46} strokeWidth={1.8} />
          </div>
          <h1 className="text-5xl font-black text-white">RACHAS</h1>
          <p className="mt-4 max-w-sm text-xl font-semibold leading-8 text-neutral-400">Seu futebol. Seu time. Seu racha.</p>

          <div className="mt-12 space-y-3">
            {user ? (
              <Link className="primary-button w-full" href="/app">
                Abrir meus rachas <ArrowRight aria-hidden="true" size={20} />
              </Link>
            ) : (
              <>
                <Link className="primary-button w-full" href="/entrar">
                  <LogIn aria-hidden="true" size={20} /> Entrar em um racha
                </Link>
                <Link className="secondary-button w-full" href="/cadastro">
                  <UserPlus aria-hidden="true" size={20} /> Criar meu racha
                </Link>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
