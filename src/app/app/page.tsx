import Link from "next/link";
import { LogOut, Plus, Trophy } from "lucide-react";

import { signOut } from "@/app/actions/auth";
import { JoinRachaForm } from "@/components/racha/join-racha-form";
import { RachaCard } from "@/components/racha/racha-card";
import type { RachaFormatValue } from "@/modules/rachas/formats";
import { listUserRachas } from "@/modules/rachas/queries";
import { requireUser } from "@/server/auth";

export default async function DashboardPage({ searchParams }: PageProps<"/app">) {
  const query = await searchParams;
  const user = await requireUser();
  const memberships = await listUserRachas(user.id);
  const ownedRachaCount = memberships.filter(({ role }) => role === "OWNER").length;
  const firstName = user.name.trim().split(/\s+/)[0];

  return (
    <main className="app-background min-h-screen px-4 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="brand-mark"><Trophy aria-hidden="true" size={24} /></span>
            <span className="text-xl font-black text-white">Rachas</span>
          </div>
          <form action={signOut}>
            <button aria-label="Sair" className="icon-button border border-neutral-700 bg-neutral-900" title="Sair" type="submit">
              <LogOut aria-hidden="true" size={19} />
            </button>
          </form>
        </header>

        <section className="mt-12">
          <p className="text-sm font-bold uppercase text-lime-400">Área do jogador</p>
          <h1 className="mt-2 text-3xl font-black text-white">Olá, {firstName}</h1>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-sm font-black uppercase text-neutral-300">Meus rachas</h2>
            {ownedRachaCount < 2 ? <Link className="inline-flex items-center gap-1.5 text-sm font-bold text-lime-400 hover:text-lime-300" href="/app/rachas/novo">
              <Plus aria-hidden="true" size={17} /> Criar novo
            </Link> : <span className="text-right text-xs font-bold text-neutral-500">Limite de 2 rachas atingido</span>}
          </div>

          {query.racha === "excluido" ? (
            <p className="mb-4 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-200">Racha excluído permanentemente.</p>
          ) : null}

          {memberships.length ? (
            <div className="space-y-3">
              {memberships.map(({ racha, role }) => (
                <RachaCard
                  canDelete={role === "OWNER"}
                  format={racha.format as RachaFormatValue}
                  id={racha.id}
                  key={racha.id}
                  memberCount={racha._count.members}
                  name={racha.name}
                  nextMatch={racha.matches[0]?.startsAt ?? null}
                  venue={racha.venue}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-neutral-700 px-5 py-10 text-center">
              <p className="font-bold text-white">Você ainda não participa de um racha.</p>
              <p className="mt-2 text-sm text-neutral-400">Crie um novo ou use um código de convite.</p>
            </div>
          )}
        </section>

        <section className="mt-10 border-t border-neutral-800 pt-8">
          <JoinRachaForm />
        </section>
      </div>
    </main>
  );
}
