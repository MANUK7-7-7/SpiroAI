"use client";

import { Button } from "@/components/ui/button";

export function PrintButton({ label }: { label: string }) {
  return <div className="print:hidden"><Button variant="primary" onClick={() => window.print()}>{label}</Button></div>;
}
