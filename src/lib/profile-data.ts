import { notFound } from "next/navigation";
import { parseDemoState } from "@/data/demo-state";
import { getProfile } from "@/data/repositories/results";

export async function loadProfile(id: string, searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const profile = await getProfile(id, parseDemoState((await searchParams).state));
  if (!profile) notFound();
  return profile;
}
