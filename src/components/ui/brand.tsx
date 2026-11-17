import Image from "next/image";

/** The SpiroAI logo, horizontal: the lungs mark beside the wordmark (public/brand/spiroai-logo-horizontal.svg). */
export function Brand({ height = 40, className }: { height?: number; className?: string }) {
  return <Image src="/brand/spiroai-logo-horizontal.svg" alt="SpiroAI" width={Math.round((height * 572) / 151)} height={height} priority className={className} />;
}
