import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { getCurrentUser } from "@/server/auth";

export default async function SignInPage({ searchParams }: PageProps<"/entrar">) {
  const query = await searchParams;
  if (await getCurrentUser()) {
    redirect("/app");
  }

  return (
    <AuthShell description="Entre para organizar seus jogos e acompanhar seus times." title="Bem-vindo de volta">
      <AuthForm mode="sign-in" notice={query.senha === "redefinida" ? "Senha redefinida. Entre com sua nova senha." : undefined} />
    </AuthShell>
  );
}
