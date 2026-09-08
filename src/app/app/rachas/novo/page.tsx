import Link from "next/link";
import { ChevronLeft, Trophy } from "lucide-react";

import { CreateRachaForm } from "@/components/racha/create-racha-form";
import { requireUser } from "@/server/auth";
import { db } from "@/server/db";

export default async function NewRachaPage() {
  const user = await requireUser();
  const ownedRachaCount = await db.rachaMember.count({ where: { userId: user.id, role: "OWNER" } });

  return (
    <main className="app-background min-h-screen px-4 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <Link className="mb-7 inline-flex items-center gap-1 text-sm font-semibold text-neutral-400 hover:text-white" href="/app">
          <ChevronLeft aria-hidden="true" size={18} /> Voltar
        </Link>
        <div className="mb-8 flex items-center gap-3">
          <span className="brand-mark"><Trophy aria-hidden="true" size={24} /></span>
          <span className="text-xl font-black text-white">Rachas</span>
        </div>
        <div className="mb-8">
          <p className="text-sm font-bold uppercase text-lime-400">Novo racha</p>
          <h1 className="mt-2 text-3xl font-black text-white">Monte seu jogo</h1>
        </div>
        {ownedRachaCount < 2 ? <CreateRachaForm /> : <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-5 py-6">
          <h2 className="font-black text-white">Limite de rachas atingido</h2>
          <p className="mt-2 text-sm text-neutral-300">Você pode criar no máximo 2 rachas. Exclua um dos seus rachas para liberar uma nova criação.</p>
          <Link className="secondary-button mt-5 w-full" href="/app">Voltar para meus rachas</Link>
        </div>}
      </div>
    </main>
  );
}
