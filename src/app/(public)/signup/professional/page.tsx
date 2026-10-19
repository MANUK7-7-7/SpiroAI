import { PublicShell } from "@/components/public/public-shell";
import { RegistrationLayout } from "@/components/public/registration-layout";
import { ProfessionalForm } from "@/components/signup/professional-form";

export default function Page() {
  return (
    <PublicShell>
      <RegistrationLayout current={2}>
        <ProfessionalForm />
      </RegistrationLayout>
    </PublicShell>
  );
}
