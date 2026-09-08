import Link from "next/link";
import { ChevronLeft, Trophy } from "lucide-react";

type AuthShellProps = {
  children: React.ReactNode;
  description: string;
  title: string;
};

export function AuthShell({ children, description, title }: AuthShellProps) {
  return (
    <main className="app-background auth-background flex min-h-screen items-center justify-center px-4 py-8">
      <section className="auth-panel w-full max-w-lg">
        <Link className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-neutral-400 hover:text-white" href="/">
          <ChevronLeft aria-hidden="true" size={18} />
          Voltar
        </Link>
        <div className="mb-8 flex items-center gap-3">
          <span className="brand-mark"><Trophy aria-hidden="true" size={24} /></span>
          <span className="text-xl font-black text-white">Rachas</span>
        </div>
        <div className="mb-7">
          <h1 className="text-3xl font-black text-white">{title}</h1>
          <p className="mt-2 text-base leading-6 text-neutral-400">{description}</p>
        </div>
        {children}
        <footer className="auth-credit">
          <a href="mailto:andersonportugaall@gmail.com">Contato do Desenvolvedor</a>
        </footer>
      </section>
    </main>
  );
}
