import { LoadingPanel } from "@/components/app/data-state";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6" aria-busy>
      <div className="grid grid-cols-4 gap-4">{[0, 1, 2, 3].map((i) => <LoadingPanel key={i} screen="S05" />)}</div>
      <div className="grid grid-cols-[1fr_320px] gap-6"><LoadingPanel screen="S05" /><LoadingPanel screen="S05" /></div>
    </div>
  );
}
