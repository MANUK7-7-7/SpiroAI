import Image from "next/image";

export function Brand({ label = "SpiroAI", shape = "circle" }: { label?: string; shape?: "circle" | "pill" }) {
  return (
    <div className="flex h-[34px] items-center gap-[10px]">
      <div className={`flex h-[34px] shrink-0 items-center justify-center rounded-full bg-cobalt ${shape === "pill" ? "w-[22px]" : "w-[34px]"}`}>
        <Image src="/assets/s01/audio-lines.svg" alt="" width={22} height={22} />
      </div>
      <div className="flex items-center gap-[3px]">
        <span className="whitespace-nowrap font-display text-[23px] font-medium leading-[1.45] tracking-[-0.04em] text-ink">{label}</span>
        <Image src="/assets/s01/accent-dot.svg" alt="" width={7} height={7} />
      </div>
    </div>
  );
}
