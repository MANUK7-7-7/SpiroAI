import { redirect } from "next/navigation";

/** In-app messaging was replaced by WhatsApp contact from the patient profile. Old links land on the patient list. */
export default async function MessagesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const p = (await searchParams).patient;
  redirect(typeof p === "string" ? `/patients/${p}` : "/patients");
}
