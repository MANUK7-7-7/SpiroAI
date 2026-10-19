import { TwoFactorForm } from "@/components/auth/two-factor-form";
import { PublicShell } from "@/components/public/public-shell";

export default function Page() {
  return (
    <PublicShell>
      <TwoFactorForm />
    </PublicShell>
  );
}
