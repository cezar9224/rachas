import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage({ params }: PageProps<"/redefinir-senha/[token]">) {
  const { token } = await params;
  return (
    <AuthShell description="Escolha uma nova senha para acessar sua conta." title="Redefinir senha">
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
