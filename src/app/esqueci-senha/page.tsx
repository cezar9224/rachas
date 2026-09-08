import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { AuthShell } from "@/components/auth/auth-shell";

export default function ForgotPasswordPage() {
  return (
    <AuthShell description="Informe seu e-mail para gerar um link seguro de recuperação." title="Esqueci minha senha">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
