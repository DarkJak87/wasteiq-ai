import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getDashboardData } from "@/lib/dashboard.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { scoreBand } from "@/components/dashboard/RadialGauge";

export const Route = createFileRoute("/_authenticated/dashboard/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const fn = useServerFn(getDashboardData);
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => fn() });

  function downloadCSV() {
    const rows = (data?.insights ?? []).map((i: any) => ({
      date: new Date(i.created_at).toISOString(),
      highlight: i.highlight ?? "",
      summary: i.summary ?? "",
      recyclable_pct: i.recyclable_pct,
      circular_economy_score: i.circular_economy_score,
      landfill_diversion_score: i.landfill_diversion_score,
      total_waste_kg: i.total_waste_kg,
      savings_zar: i.estimated_savings_zar,
      recoverable_value_zar: i.recoverable_value_zar,
      carbon_kg: i.carbon_kg,
      materials: JSON.stringify(i.materials ?? []),
    }));
    const csv = Papa.unparse(rows);
    triggerDownload(new Blob([csv], { type: "text/csv" }), "wasteiq-insights.csv");
  }

  function downloadPDF() {
    const doc = new jsPDF();
    const k = data?.kpis;
    const company = (data?.company as any)?.name ?? "Your Company";
    const PRIMARY: [number, number, number] = [0, 152, 121];
    const DARK: [number, number, number] = [15, 23, 42];
    const GREY: [number, number, number] = [100, 116, 139];
    const W = doc.internal.pageSize.getWidth();

    // Cover band
    doc.setFillColor(...PRIMARY); doc.rect(0, 0, W, 38, "F");
    doc.setTextColor(255); doc.setFontSize(22); doc.text("WasteIQ AI", 14, 18);
    doc.setFontSize(12); doc.text("Circular Economy Sustainability Report", 14, 28);
    doc.setTextColor(...DARK);
    doc.setFontSize(11); doc.text(company, 14, 48);
    doc.setFontSize(10); doc.setTextColor(...GREY);
    doc.text(`Generated ${new Date().toLocaleString("en-ZA")}`, 14, 54);

    let y = 66;
    const section = (title: string) => {
      doc.setTextColor(...PRIMARY); doc.setFontSize(13); doc.text(title, 14, y); y += 2;
      doc.setDrawColor(...PRIMARY); doc.setLineWidth(0.4); doc.line(14, y, W - 14, y); y += 6;
      doc.setTextColor(...DARK); doc.setFontSize(11);
    };

    const ce = scoreBand(k?.circularScore ?? 0);
    const dv = scoreBand(k?.diversionScore ?? 0);
    const exec = `Across ${k?.totalInsights ?? 0} analysed sample(s) totalling ${(k?.totalWasteKg ?? 0).toFixed(0)} kg, ` +
      `${(k?.recyclingPotentialPct ?? 0).toFixed(0)}% is recoverable. Circular Economy Score is ${(k?.circularScore ?? 0).toFixed(0)}/100 (${ce.label}) ` +
      `and Landfill Diversion Score is ${(k?.diversionScore ?? 0).toFixed(0)}/100 (${dv.label}). Adopting the recommendations below could save ` +
      `approximately R ${(k?.savingsZar ?? 0).toFixed(0)} in annual disposal costs and avoid ${(k?.carbonKg ?? 0).toFixed(0)} kg CO₂e.`;
    section("Executive Summary");
    const lines = doc.splitTextToSize(exec, W - 28);
    doc.text(lines, 14, y); y += lines.length * 5 + 4;

    // KPIs table
    section("Key Metrics");
    autoTable(doc, {
      startY: y,
      head: [["Metric", "Value"]],
      body: [
        ["Total waste analyzed", `${(k?.totalWasteKg ?? 0).toFixed(0)} kg`],
        ["Circular Economy Score", `${(k?.circularScore ?? 0).toFixed(0)} / 100 — ${ce.label}`],
        ["Landfill Diversion Score", `${(k?.diversionScore ?? 0).toFixed(0)} / 100 — ${dv.label}`],
        ["Recycling potential", `${(k?.recyclingPotentialPct ?? 0).toFixed(0)}%`],
        ["Estimated annual cost savings", `R ${(k?.savingsZar ?? 0).toFixed(0)}`],
        ["Recoverable material value", `R ${(k?.recoverableValueZar ?? 0).toFixed(0)}`],
        ["Carbon avoided", `${(k?.carbonKg ?? 0).toFixed(0)} kg CO₂e`],
        ["Equivalent trees planted", `${(k?.trees ?? 0).toFixed(0)}`],
        ["Equivalent km not driven", `${(k?.km ?? 0).toFixed(0)} km`],
        ["Plastic bottles removed", `${(k?.bottles ?? 0).toFixed(0)}`],
      ],
      theme: "grid",
      headStyles: { fillColor: PRIMARY, textColor: 255 },
      styles: { fontSize: 10 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // Material breakdown
    section("Material Breakdown & Recoverable Value");
    autoTable(doc, {
      startY: y,
      head: [["Material", "Weight (kg)", "Recyclable", "Value (R)"]],
      body: (data?.materials ?? []).map((m) => [
        m.name,
        m.weight_kg.toFixed(1),
        m.recyclable ? "Yes" : "No",
        m.value_zar.toFixed(0),
      ]),
      theme: "striped",
      headStyles: { fillColor: PRIMARY, textColor: 255 },
      styles: { fontSize: 10 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // Composition
    if (y > 230) { doc.addPage(); y = 20; }
    section("Waste Composition");
    autoTable(doc, {
      startY: y,
      head: [["Stream", "Share"]],
      body: (data?.classification ?? []).map((c) => [c.name, `${c.value}%`]),
      theme: "grid",
      headStyles: { fillColor: PRIMARY, textColor: 255 },
      styles: { fontSize: 10 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // Recommendations (gathered from insights)
    if (y > 230) { doc.addPage(); y = 20; }
    section("Recommendations");
    const recs: string[] = [];
    for (const i of (data?.insights ?? []) as any[]) {
      if (Array.isArray(i.recommendations)) for (const r of i.recommendations) if (recs.length < 10 && !recs.includes(r)) recs.push(r);
    }
    if (recs.length === 0) recs.push("Upload more waste samples to generate consultant-grade recommendations.");
    doc.setFontSize(10);
    recs.forEach((r, idx) => {
      const wrapped = doc.splitTextToSize(`${idx + 1}. ${r}`, W - 28);
      if (y + wrapped.length * 5 > 280) { doc.addPage(); y = 20; }
      doc.text(wrapped, 14, y); y += wrapped.length * 5 + 2;
    });
    y += 4;

    // Future improvement opportunities (low confidence / non-recyclable bias)
    if (y > 250) { doc.addPage(); y = 20; }
    section("Future Improvement Opportunities");
    const opp: string[] = [];
    const nonRecMat = (data?.materials ?? []).filter((m) => !m.recyclable && m.weight_kg > 0).sort((a, b) => b.weight_kg - a.weight_kg)[0];
    if (nonRecMat) opp.push(`${nonRecMat.name} (${nonRecMat.weight_kg.toFixed(1)} kg) is currently landfill-bound — explore alternative material substitution or specialist processors.`);
    if ((k?.circularScore ?? 0) < 61) opp.push(`Lift Circular Economy Score above 61 by introducing source separation and a buy-back partnership.`);
    if ((k?.recoverableValueZar ?? 0) > 0) opp.push(`Negotiate offtake contracts to capture the R ${(k?.recoverableValueZar ?? 0).toFixed(0)} recoverable material value identified.`);
    if (opp.length === 0) opp.push("Maintain current diversion practices and continue monitoring monthly.");
    doc.setFontSize(10);
    opp.forEach((r, idx) => {
      const wrapped = doc.splitTextToSize(`• ${r}`, W - 28);
      if (y + wrapped.length * 5 > 285) { doc.addPage(); y = 20; }
      doc.text(wrapped, 14, y); y += wrapped.length * 5 + 2;
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setFontSize(8); doc.setTextColor(...GREY);
      doc.text(`WasteIQ AI · ${company} · Page ${p}/${pageCount}`, 14, 290);
    }

    doc.save("wasteiq-sustainability-report.pdf");
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