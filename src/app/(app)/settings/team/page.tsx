import { TeamForm } from "@/components/settings/team-form";
import { parseDemoState } from "@/data/demo-state";
import { getSettings, listMembers } from "@/data/repositories/settings";
import { syncStore } from "@/data/persist";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await syncStore();
  const demo = parseDemoState((await searchParams).state);
  return <TeamForm initial={getSettings().team} members={await listMembers(demo)} />;
}
