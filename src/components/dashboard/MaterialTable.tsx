import { Check, X } from "lucide-react";

export type MaterialRow = {
  name: string;
  weight_kg: number;
  composition_pct?: number;
  recyclable: boolean;
  confidence?: number;
  recoverable_value_zar?: number;
};

export function MaterialTable({ rows, compact = false }: { rows: MaterialRow[]; compact?: boolean }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground">No material breakdown available.</p>;
  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left">Material</th>
            <th className="px-3 py-2 text-right">Weight</th>
            {!compact && <th className="px-3 py-2 text-right">%</th>}
            <th className="px-3 py-2 text-center">Recyclable</th>
            {!compact && <th className="px-3 py-2 text-right">Confidence</th>}
            <th className="px-3 py-2 text-right">Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((m) => (
            <tr key={m.name} className="hover:bg-muted/30">
              <td className="px-3 py-2 font-medium">{m.name}</td>
              <td className="px-3 py-2 text-right tabular-nums">{m.weight_kg.toFixed(1)} kg</td>
              {!compact && <td className="px-3 py-2 text-right tabular-nums">{(m.composition_pct ?? 0).toFixed(0)}%</td>}
              <td className="px-3 py-2 text-center">
                {m.recyclable
                  ? <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"><Check className="h-3 w-3" /> Yes</span>
                  : <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"><X className="h-3 w-3" /> No</span>}
              </td>
              {!compact && <td className="px-3 py-2 text-right tabular-nums">{(m.confidence ?? 0).toFixed(0)}%</td>}
              <td className="px-3 py-2 text-right tabular-nums">R {(m.recoverable_value_zar ?? 0).toFixed(0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}