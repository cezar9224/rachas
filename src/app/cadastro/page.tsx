import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { getCurrentUser } from "@/server/auth";

export default async function SignUpPage() {
  if (await getCurrentUser()) {
    redirect("/app");
  }

  return (
    <AuthShell description="Crie sua conta única para participar de todos os seus rachas." title="Criar conta">
      <AuthForm mode="sign-up" />
    </AuthShell>
  );
}
