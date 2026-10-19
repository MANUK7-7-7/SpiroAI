import { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "className">;

const inputBase =
  "w-full min-h-[46px] rounded-input border bg-surface-soft p-[13px] text-[14px] leading-[1.45] tracking-[-0.005em] text-ink outline-none placeholder:text-ink-muted focus:border-cobalt focus:bg-surface";

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field({ label, hint, error, className, id, ...props }, ref) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <div className={cn("flex flex-col gap-[7px]", className)}>
      <label htmlFor={fieldId} className="text-[12px] font-medium leading-[1.45] tracking-[-0.01em] text-ink">{label}</label>
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${fieldId}-note` : undefined}
        className={cn(inputBase, error ? "border-risk-high" : "border-line")}
        {...props}
      />
      {(error || hint) && (
        <p id={`${fieldId}-note`} className={cn("text-[11px] leading-[1.45]", error ? "text-risk-high" : "text-ink-muted")}>{error ?? hint}</p>
      )}
    </div>
  );
});

type SelectProps = { label: string; options: string[]; error?: string; className?: string } & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "className">;

export const SelectField = forwardRef<HTMLSelectElement, SelectProps>(function SelectField({ label, options, error, className, id, ...props }, ref) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <div className={cn("flex flex-col gap-[7px]", className)}>
      <label htmlFor={fieldId} className="text-[12px] font-medium leading-[1.45] tracking-[-0.01em] text-ink">{label}</label>
      <div className="relative">
        <select ref={ref} id={fieldId} aria-invalid={!!error} className={cn(inputBase, "appearance-none pr-10", error ? "border-risk-high" : "border-line")} {...props}>
          {options.map((o) => <option key={o}>{o}</option>)}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-[13px] top-[15px] text-ink-muted" aria-hidden />
      </div>
      {error && <p className="text-[11px] text-risk-high">{error}</p>}
    </div>
  );
});
