import { TeamForm } from "@/components/settings/team-form";
import { parseDemoState } from "@/data/demo-state";
import { getSettings, listMembers } from "@/data/repositories/settings";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const demo = parseDemoState((await searchParams).state);
  return <TeamForm initial={getSettings().team} members={await listMembers(demo)} />;
}
