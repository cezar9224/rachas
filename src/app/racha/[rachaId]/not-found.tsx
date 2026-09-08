import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, House } from "lucide-react";

export default function RachaNotFound() {
  return (
    <main className="app-background min-h-screen px-4 py-8 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col justify-center">
        <div className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950">
          <div className="relative aspect-[3/2] min-h-64 w-full overflow-hidden sm:aspect-[16/9]">
            <Image
              alt="Cristiano Ronaldo lamentando em campo"
              className="object-cover object-center"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              src="/images/cristiano-ronaldo-triste.jpg"
            />
            <div className="absolute inset-0 bg-black/10" />
            <span className="absolute top-4 left-4 rounded-md border border-white/20 bg-black/70 px-3 py-1 text-xs font-black text-lime-300">
              ERRO 404
            </span>
          </div>

          <div className="px-5 py-7 text-center sm:px-10 sm:py-9">
            <p className="text-xs font-black uppercase text-lime-400">A partida acabou antes do esperado</p>
            <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">Ops... Racha não encontrado</h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-neutral-400 sm:text-base">
              Este racha pode ter sido excluído pelo administrador ou o endereço acessado não existe mais.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link className="primary-button" href="/app"><House aria-hidden="true" size={18} /> Meus rachas</Link>
              <Link className="secondary-button" href="/"><ArrowLeft aria-hidden="true" size={18} /> Página inicial</Link>
            </div>
          </div>
        </div>

        <p className="mt-3 text-center text-[11px] text-neutral-600">
          Foto: Jan S0L0, via Wikimedia Commons, CC BY-SA 2.0.
        </p>
      </div>
    </main>
  );
}
