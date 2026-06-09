import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getDashboardData } from "@/lib/dashboard.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import Papa from "papaparse";
import jsPDF from "jspdf";

export const Route = createFileRoute("/_authenticated/dashboard/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const fn = useServerFn(getDashboardData);
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => fn() });

  function downloadCSV() {
    const rows = (data?.insights ?? []).map((i) => ({
      date: new Date(i.created_at).toISOString(),
      summary: i.summary ?? "",
      recyclable_pct: i.recyclable_pct,
      total_waste_kg: i.total_waste_kg,
      savings_zar: i.estimated_savings_zar,
      carbon_kg: i.carbon_kg,
    }));
    const csv = Papa.unparse(rows);
    triggerDownload(new Blob([csv], { type: "text/csv" }), "wasteiq-insights.csv");
  }

  function downloadPDF() {
    const doc = new jsPDF();
    const k = data?.kpis;
    doc.setFontSize(20); doc.text("WasteIQ AI — Sustainability Report", 14, 20);
    doc.setFontSize(11); doc.setTextColor(100);
    doc.text(`Generated ${new Date().toLocaleString("en-ZA")}`, 14, 28);
    doc.setTextColor(0); doc.setFontSize(13); doc.text("Executive summary", 14, 42);
    doc.setFontSize(11);
    const lines = [
      `Total uploads analyzed: ${k?.totalUploads ?? 0}`,
      `Insights generated: ${k?.totalInsights ?? 0}`,
      `Total waste analyzed: ${(k?.totalWasteKg ?? 0).toFixed(0)} kg`,
      `Average recyclable: ${(k?.recyclablePct ?? 0).toFixed(0)}%`,
      `Estimated cost savings: R ${(k?.savingsZar ?? 0).toFixed(0)}`,
      `Carbon avoided: ${(k?.carbonKg ?? 0).toFixed(0)} kg CO2e`,
    ];
    lines.forEach((l, i) => doc.text(l, 14, 52 + i * 7));
    doc.setFontSize(13); doc.text("Recent insights", 14, 100);
    doc.setFontSize(10);
    (data?.insights ?? []).slice(0, 12).forEach((ins, idx) => {
      const y = 108 + idx * 14;
      doc.text(`${new Date(ins.created_at).toLocaleDateString()}  ${(ins.summary ?? "").slice(0, 90)}`, 14, y);
    });
    doc.save("wasteiq-report.pdf");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">Generate investor- and audit-ready reports.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <FileText className="h-6 w-6 text-primary" />
          <h2 className="mt-3 font-semibold">Sustainability PDF</h2>
          <p className="mt-1 text-sm text-muted-foreground">Branded summary of KPIs, insights and recommendations.</p>
          <Button className="mt-4" onClick={downloadPDF}><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
        </Card>
        <Card className="p-6">
          <FileText className="h-6 w-6 text-primary" />
          <h2 className="mt-3 font-semibold">Insights CSV</h2>
          <p className="mt-1 text-sm text-muted-foreground">Raw insight rows for spreadsheets and BI tools.</p>
          <Button className="mt-4" variant="outline" onClick={downloadCSV}><Download className="mr-2 h-4 w-4" /> Download CSV</Button>
        </Card>
      </div>
    </div>
  );
}

function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}