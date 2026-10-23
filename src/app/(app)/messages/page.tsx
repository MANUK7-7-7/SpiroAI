import { redirect } from "next/navigation";
import { syncStore } from "@/data/persist";

/** In-app messaging was replaced by WhatsApp contact from the patient profile. Old links land on the patient list. */
export default async function MessagesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await syncStore();
  const p = (await searchParams).patient;
  redirect(typeof p === "string" ? `/patients/${p}` : "/patients");
}
