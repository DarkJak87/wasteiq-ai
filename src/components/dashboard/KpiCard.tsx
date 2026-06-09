import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label, value, icon: Icon, sub, accent = false, className,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  sub?: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <Card className={cn(
      "relative overflow-hidden border-border/60 p-5 backdrop-blur-xl",
      "bg-[linear-gradient(180deg,rgba(255,255,255,0.85),rgba(255,255,255,0.6))]",
      "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(0,152,121,0.18)]",
      "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(15,23,42,0.05),0_16px_32px_-12px_rgba(0,152,121,0.25)]",
      accent && "ring-1 ring-primary/20",
      className,
    )}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{label}</span>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 text-[28px] font-semibold leading-none tracking-tight text-foreground">{value}</div>
      {sub && <div className="mt-1.5 text-xs text-muted-foreground">{sub}</div>}
      <div className="pointer-events-none absolute inset-x-0 -bottom-12 h-24 bg-gradient-to-t from-primary/5 to-transparent" />
    </Card>
  );
}