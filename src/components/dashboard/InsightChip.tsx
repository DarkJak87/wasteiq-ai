import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function InsightChip({ icon: Icon, label, value, tone = "primary" }: {
  icon: LucideIcon; label: string; value: string; tone?: "primary" | "amber" | "rose";
}) {
  const tones: Record<string, string> = {
    primary: "from-primary/10 to-primary/5 text-primary",
    amber: "from-amber-500/10 to-amber-500/5 text-amber-600",
    rose: "from-rose-500/10 to-rose-500/5 text-rose-600",
  };
  return (
    <div className={cn("flex items-start gap-3 rounded-xl border border-border/60 bg-gradient-to-br p-3", tones[tone])}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] font-medium uppercase tracking-wider opacity-80">{label}</div>
        <div className="mt-0.5 text-sm font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
}