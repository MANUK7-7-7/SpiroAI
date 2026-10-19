import { PublicShell } from "@/components/public/public-shell";
import { RegistrationLayout } from "@/components/public/registration-layout";
import { TermsForm } from "@/components/signup/terms-form";

export default function Page() {
  return (
    <PublicShell>
      <RegistrationLayout current={3}>
        <TermsForm />
      </RegistrationLayout>
    </PublicShell>
  );
}
