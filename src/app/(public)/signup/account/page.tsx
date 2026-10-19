import { PublicShell } from "@/components/public/public-shell";
import { RegistrationLayout } from "@/components/public/registration-layout";
import { AccountForm } from "@/components/signup/account-form";

export default function Page() {
  return (
    <PublicShell>
      <RegistrationLayout current={1}>
        <AccountForm />
      </RegistrationLayout>
    </PublicShell>
  );
}
