import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Brand } from "@/components/ui/brand";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, SelectField } from "@/components/ui/field";
import { RiskBadge } from "@/components/ui/risk-badge";
import { Step } from "@/components/ui/step";
import { StateCard } from "@/components/ui/state-card";
import { Title } from "@/components/ui/title";
import { getT } from "@/lib/i18n/server";
import { DemoControls } from "./demo-controls";

const colors = ["canvas", "surface", "surface-soft", "surface-sunken", "ink", "ink-muted", "line", "cobalt", "cobalt-deep", "cobalt-tint", "cobalt-tint-strong", "cobalt-faint", "risk-high", "risk-high-tint", "risk-moderate", "risk-moderate-tint", "scrim", "on-accent"];
const radii = ["shell", "panel", "card", "item", "input"];
const libraries = [["states", "Flow A · Registration and login"], ["states/patients", "Flow B · Patients and results"], ["states/alerts", "Flow C · Alerts, actions, export, messages"], ["states/settings", "Flow D · Settings"]] as const;

/** Design system reference. Everything here renders from the token layer and the same primitives the product uses. */
export default async function DesignSystem() {
  const { t } = await getT();
  const section = (title: string, children: React.ReactNode) => (
    <section className="flex flex-col gap-4"><h2 className="text-[18px] font-medium tracking-[-0.01em]">{title}</h2>{children}</section>
  );
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-10 rounded-shell bg-surface-sunken p-10">
      <Brand shape="pill" />
      <div className="flex flex-col gap-2"><Title size={40}>Design system</Title><p className="text-[14px] text-ink-muted">Tokens, type, primitives and the four screen states. Fictional sample data. {t("common.disclaimer")}</p></div>

      {section("Colour tokens", (
        <ul className="grid grid-cols-6 gap-3 max-lg:grid-cols-3">
          {colors.map((c) => (
            <li key={c} className="flex flex-col gap-2 rounded-[16px] bg-surface p-3 shadow-[inset_0_0_0_1px_var(--line)]">
              <span className="h-12 rounded-[10px] shadow-[inset_0_0_0_1px_var(--line)]" style={{ background: `var(--${c})` }} />
              <code className="font-mono text-[11px]">--{c}</code>
            </li>
          ))}
        </ul>
      ))}

      {section("Radii", <ul className="flex flex-wrap gap-4">{radii.map((r) => <li key={r} className="flex flex-col items-center gap-2"><span className="size-20 bg-surface shadow-[inset_0_0_0_1px_var(--line)]" style={{ borderRadius: `var(--radius-${r})` }} /><code className="font-mono text-[11px]">--radius-{r}</code></li>)}</ul>)}

      {section("Type", (
        <Card className="gap-3 p-6">
          <p className="font-display text-[40px] font-medium leading-[1.1] tracking-[-0.035em]">Familjen Grotesk · Display 40</p>
          <p className="font-display text-[28px] font-medium tracking-[-0.035em]">Display 28 · Headings</p>
          <p className="text-[16px] tracking-[-0.01em]">Geist · Body 16 · Voice screening support for respiratory care</p>
          <p className="text-[13px] tracking-[-0.005em]">Geist · Body 13 · Used for most interface text</p>
          <p className="text-[11px] uppercase tracking-[0.06em] text-ink-muted">Geist · Label 11 · Uppercase</p>
          <p className="font-mono text-[13px]">Geist Mono · 0.72 % · 23.1 dB · SP-1042</p>
        </Card>
      ))}

      {section("Buttons", (
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button><Button>Secondary</Button><Button variant="primary" size="sm">Primary small</Button><Button size="sm" radius="lg">Secondary small</Button><Button disabled>Disabled</Button>
        </div>
      ))}

      {section("Fields and controls", (
        <div className="grid grid-cols-2 gap-6 max-lg:grid-cols-1">
          <Card className="gap-4 p-6">
            <Field label="Text field" placeholder="Placeholder" />
            <Field label="With error" defaultValue="invalid" error="This field is required" />
            <SelectField label="Select" options={["One", "Two"]} />
          </Card>
          <Card className="gap-4 p-6"><DemoControls labels={{ check: "Checkbox", switch: "Switch", switchDesc: "Description text", chips: ["ALL", "HIGH", "MODERATE"], tabs: [{ id: "a", label: "Tab one" }, { id: "b", label: "Tab two" }], tablist: "Demo tabs" }} /></Card>
        </div>
      ))}

      {section("Risk, never by colour alone", (
        <div className="flex flex-wrap items-center gap-3"><RiskBadge band="low" label={t("risk.low")} /><RiskBadge band="moderate" label={t("risk.moderate")} /><RiskBadge band="high" label={t("risk.high")} /><Avatar initials="EM" /></div>
      ))}

      {section("Alerts", (
        <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
          <Alert state="info" title="Info">Neutral guidance.</Alert><Alert state="success" title="Success">Saved and recorded.</Alert>
          <Alert state="warning" title="Warning">Clinical validation needed.</Alert><Alert state="error" title="Error">Something could not save.</Alert>
        </div>
      ))}

      {section("Steps", <ol className="grid grid-cols-3 gap-3 max-lg:grid-cols-1"><Step index={1} label="Done step" state="done" /><Step index={2} label="Current step" state="current" /><Step index={3} label="Next step" state="default" /></ol>)}

      {section("Screen states", (
        <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2">
          <StateCard kind="loading" tag={t("states.loading")} loadingLabel={t("states.loadingSecurely", { screen: "S00" })} />
          <StateCard kind="empty" tag={t("states.empty")} message="Nothing here yet." action="Primary action" />
          <StateCard kind="error" tag={t("states.error")} message="Could not load. Data is safe." action={t("states.retry")} />
          <StateCard kind="success" tag={t("states.success")} message="Saved." note={t("states.recorded")} />
        </div>
      ))}

      {section("State libraries by flow", <ul className="flex flex-wrap gap-3">{libraries.map(([href, label]) => <li key={href}><Link className="inline-flex h-11 items-center rounded-input border border-line bg-surface px-[18px] text-[14px] font-medium hover:bg-surface-soft" href={`/design/${href}`}>{label}</Link></li>)}</ul>)}
      <p className="text-[11px] leading-[1.45] text-ink-muted">{t("states.sampleFooter")}</p>
    </div>
  );
}
