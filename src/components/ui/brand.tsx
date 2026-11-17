import Image from "next/image";

/** The SpiroAI logo (lungs, sound bars and wordmark), from public/brand/spiroai-logo.svg. */
export function Brand({ height = 56, className }: { height?: number; className?: string }) {
  return <Image src="/brand/spiroai-logo.svg" alt="SpiroAI" width={Math.round((height * 294) / 233)} height={height} priority className={className} />;
}
