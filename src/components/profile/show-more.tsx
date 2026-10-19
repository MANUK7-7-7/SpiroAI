"use client";

import { Children, useState } from "react";
import { Button } from "@/components/ui/button";

/** Shows the first rows and reveals the rest on demand. */
export function ShowMore({ initial, more, less, children }: { initial: number; more: string; less: string; children: React.ReactNode }) {
  const [all, setAll] = useState(false);
  const items = Children.toArray(children);
  return (
    <>
      {(all ? items : items.slice(0, initial)).map((c, i) => <div key={i}>{c}</div>)}
      {items.length > initial && <div><Button size="sm" onClick={() => setAll(!all)}>{all ? less : more}</Button></div>}
    </>
  );
}
