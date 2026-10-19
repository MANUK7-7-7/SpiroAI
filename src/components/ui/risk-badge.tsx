import Image from "next/image";

export function RiskBadgeLow({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-[6px] rounded-full bg-surface-sunken px-[10px] py-[5px] text-[12px] font-medium tracking-[-0.01em] text-ink-muted">
      <Image src="/assets/s01/circle-check.svg" alt="" width={14} height={14} />
      {label}
    </span>
  );
}
