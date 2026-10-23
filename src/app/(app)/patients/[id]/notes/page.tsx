import { EmptyPanel } from "@/components/app/data-state";
import { NoteForm } from "@/components/profile/forms";
import { ProfileFrame } from "@/components/profile/profile-frame";
import { formatDateTime } from "@/lib/format";
import { getT } from "@/lib/i18n/server";
import { loadProfile } from "@/lib/profile-data";
import { syncStore } from "@/data/persist";

export default async function NotesTab({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await syncStore();
  const { id } = await params;
  const { t, locale } = await getT();
  const p = await loadProfile(id, searchParams);
  return (
    <ProfileFrame patient={p.patient} tab="notes" alertCount={p.alerts.length}>
      <div className="flex items-start gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {p.notes.length === 0 && <EmptyPanel message={t("notes.empty")} />}
          {p.notes.map((n) => (
            <article key={n.id} className="flex flex-col gap-4 rounded-panel bg-surface p-6 shadow-[inset_0_0_0_1px_var(--line)]">
              <div className="flex flex-col gap-1 leading-[1.45]">
                <h2 className="text-[22px] font-medium tracking-[-0.01em]">{formatDateTime(n.at, locale).replace(/^(\d+ \w+) (\d{4})/, "$1 $2")}</h2>
                <p className="text-[12px] text-ink-muted">{t("notes.meta", { author: n.author })}</p>
              </div>
              <p className="text-[15px] leading-[1.45] tracking-[-0.005em]">{n.text}</p>
              <p className="text-[11px] leading-[1.45] text-ink-muted">{t("notes.footer")}</p>
            </article>
          ))}
        </div>
        <NoteForm patientId={id} />
      </div>
    </ProfileFrame>
  );
}
