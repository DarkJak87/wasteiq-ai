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
import { WASTE_FACTORS, confidenceBand, buildRecommendations, computeEquivalences, normaliseMaterialName, type ComputedMaterial } from "@/lib/waste-factors";
import bannerAsset from "@/assets/report-banner.jpg.asset.json";

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
      confidence_score: i.confidence_score ?? "",
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

  async function downloadPDF() {
    const doc = new jsPDF();
    const k = data?.kpis;
    const company = (data?.company as any)?.name ?? "Your Company";
    const PRIMARY: [number, number, number] = [0, 152, 121];
    const DARK: [number, number, number] = [15, 23, 42];
    const GREY: [number, number, number] = [100, 116, 139];
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    // ===== COVER PAGE =====
    // Banner image at the top
    try {
      const bannerData = await loadImageAsDataUrl(bannerAsset.url);
      doc.addImage(bannerData, "JPEG", 0, 0, W, 70);
    } catch {
      doc.setFillColor(...PRIMARY); doc.rect(0, 0, W, 70, "F");
    }
    // Title overlay band
    doc.setFillColor(15, 23, 42); doc.rect(0, 70, W, 22, "F");
    doc.setTextColor(255); doc.setFontSize(22); doc.text("WasteIQ AI", 14, 84);
    doc.setFontSize(11); doc.text("Sustainability & Circular Economy Report", W - 14, 84, { align: "right" });

    doc.setTextColor(...DARK);
    doc.setFontSize(18); doc.text(company, 14, 112);
    doc.setFontSize(11); doc.setTextColor(...GREY);
    doc.text(`Reporting period: ${reportingPeriod(data?.insights ?? [])}`, 14, 120);
    doc.text(`Generated: ${new Date().toLocaleString("en-ZA")}`, 14, 126);

    // Cover key stats panel
    const ceBand = scoreBand(k?.circularScore ?? 0);
    const cBand = confidenceBand(k?.confidenceScore ?? 0);
    doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3);
    doc.roundedRect(14, 145, W - 28, 70, 3, 3, "S");
    doc.setTextColor(...PRIMARY); doc.setFontSize(10);
    doc.text("AT A GLANCE", 22, 156);
    doc.setTextColor(...DARK); doc.setFontSize(11);
    const stats = [
      [`Total waste analysed`, `${(k?.totalWasteKg ?? 0).toFixed(0)} kg`],
      [`Circular Economy Score`, `${(k?.circularScore ?? 0).toFixed(0)} / 100 (${ceBand.label})`],
      [`Recoverable value`, `R ${(k?.recoverableValueZar ?? 0).toFixed(0)}`],
      [`Carbon avoided`, `${(k?.carbonKg ?? 0).toFixed(1)} kg CO\u2082e`],
      [`Estimated annual savings`, `R ${(k?.savingsZar ?? 0).toFixed(0)}`],
      [`AI Confidence`, `${(k?.confidenceScore ?? 0).toFixed(0)}% (${cBand.label})`],
    ];
    stats.forEach((row, idx) => {
      const col = idx % 2;
      const r = Math.floor(idx / 2);
      const x = 22 + col * ((W - 44) / 2);
      const y = 168 + r * 14;
      doc.setTextColor(...GREY); doc.setFontSize(8); doc.text(row[0].toUpperCase(), x, y);
      doc.setTextColor(...DARK); doc.setFontSize(11); doc.text(row[1], x, y + 6);
    });

    doc.setTextColor(...GREY); doc.setFontSize(8);
    doc.text("Prepared by WasteIQ AI — South African circular-economy benchmarks", 14, H - 14);

    // ===== BODY PAGES =====
    doc.addPage();
    let y = 20;
    const section = (title: string) => {
      if (y > H - 40) { doc.addPage(); y = 20; }
      doc.setTextColor(...PRIMARY); doc.setFontSize(13); doc.text(title, 14, y); y += 2;
      doc.setDrawColor(...PRIMARY); doc.setLineWidth(0.4); doc.line(14, y, W - 14, y); y += 6;
      doc.setTextColor(...DARK); doc.setFontSize(11);
    };

    const dv = scoreBand(k?.diversionScore ?? 0);
    const exec = `Across ${k?.totalInsights ?? 0} analysed sample(s) totalling ${(k?.totalWasteKg ?? 0).toFixed(0)} kg, ` +
      `${(k?.recyclingPotentialPct ?? 0).toFixed(0)}% is recoverable. Circular Economy Score is ${(k?.circularScore ?? 0).toFixed(0)}/100 (${ceBand.label}) ` +
      `and Landfill Diversion Score is ${(k?.diversionScore ?? 0).toFixed(0)}/100 (${dv.label}). Adopting the recommendations below could save ` +
      `approximately R ${(k?.savingsZar ?? 0).toFixed(0)} in annual disposal costs and avoid ${(k?.carbonKg ?? 0).toFixed(1)} kg CO\u2082e. ` +
      `Analysis confidence: ${(k?.confidenceScore ?? 0).toFixed(0)}% (${cBand.label}).`;
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
        ["Circular Economy Score", `${(k?.circularScore ?? 0).toFixed(0)} / 100 — ${ceBand.label}`],
        ["Landfill Diversion Score", `${(k?.diversionScore ?? 0).toFixed(0)} / 100 — ${dv.label}`],
        ["Recycling potential", `${(k?.recyclingPotentialPct ?? 0).toFixed(0)}%`],
        ["Estimated annual cost savings", `R ${(k?.savingsZar ?? 0).toFixed(0)}`],
        ["Recoverable material value", `R ${(k?.recoverableValueZar ?? 0).toFixed(0)}`],
        ["Carbon avoided", `${(k?.carbonKg ?? 0).toFixed(1)} kg CO\u2082e`],
        ["AI Confidence", `${(k?.confidenceScore ?? 0).toFixed(0)}% — ${cBand.label}`],
      ],
      theme: "grid",
      headStyles: { fillColor: PRIMARY, textColor: 255 },
      styles: { fontSize: 10 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // Material breakdown (full per-material table)
    section("Material Breakdown");
    autoTable(doc, {
      startY: y,
      head: [["Material", "Weight (kg)", "%", "Recyclable", "Value (R)", "Carbon (kg CO\u2082e)"]],
      body: (data?.materials ?? []).map((m) => [
        m.name,
        m.weight_kg.toFixed(1),
        `${(m as any).composition_pct ?? 0}%`,
        m.recyclable ? "Yes" : "No",
        m.value_zar.toFixed(0),
        ((m as any).carbon_kg ?? 0).toFixed(1),
      ]),
      theme: "striped",
      headStyles: { fillColor: PRIMARY, textColor: 255 },
      styles: { fontSize: 9 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // Waste Composition by stream
    if (y > H - 60) { doc.addPage(); y = 20; }
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

    // Recoverable Material Value
    if (y > H - 60) { doc.addPage(); y = 20; }
    section("Recoverable Material Value");
    const valueText = `Total recoverable value: R ${(k?.recoverableValueZar ?? 0).toFixed(0)} — calculated as material weight \u00D7 South African buy-back rate per kg.`;
    doc.setFontSize(10); doc.text(doc.splitTextToSize(valueText, W - 28), 14, y); y += 10;
    autoTable(doc, {
      startY: y,
      head: [["Material", "Weight (kg)", "Rate (R/kg)", "Value (R)"]],
      body: (data?.materials ?? []).filter((m: any) => m.value_zar > 0).map((m: any) => {
        const f = (WASTE_FACTORS as any)[m.name];
        return [m.name, m.weight_kg.toFixed(1), f ? f.value_per_kg.toString() : "—", m.value_zar.toFixed(0)];
      }),
      theme: "grid",
      headStyles: { fillColor: PRIMARY, textColor: 255 },
      styles: { fontSize: 9 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // Carbon Impact
    if (y > H - 60) { doc.addPage(); y = 20; }
    section("Carbon Impact");
    const divertedPlastic = (data?.materials ?? []).filter((m: any) => (WASTE_FACTORS as any)[m.name]?.stream === "plastic").reduce((s: number, m: any) => s + m.weight_kg, 0);
    const eq = computeEquivalences(k?.carbonKg ?? 0, divertedPlastic);
    autoTable(doc, {
      startY: y,
      head: [["Metric", "Value"]],
      body: [
        ["Total carbon avoided", `${(k?.carbonKg ?? 0).toFixed(1)} kg CO\u2082e`],
        ["Equivalent trees planted (annual)", `${eq.trees_planted}`],
        ["Equivalent km not driven", `${eq.km_not_driven} km`],
        ["Equivalent plastic bottles recycled", `${eq.bottles_recycled}`],
      ],
      theme: "grid",
      headStyles: { fillColor: PRIMARY, textColor: 255 },
      styles: { fontSize: 10 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // Recommendations — deterministic from detected materials
    if (y > H - 60) { doc.addPage(); y = 20; }
    section("Recommendations");
    const aggregated: ComputedMaterial[] = (data?.materials ?? []).map((m: any) => {
      const name = normaliseMaterialName(m.name);
      const f = (WASTE_FACTORS as any)[name];
      return {
        name,
        weight_kg: m.weight_kg,
        composition_pct: m.composition_pct ?? 0,
        recyclable: f?.recyclable ?? m.recyclable,
        confidence: 90,
        unit_value_zar_per_kg: f?.value_per_kg ?? 0,
        recoverable_value_zar: m.value_zar,
        carbon_kg: m.carbon_kg ?? 0,
        stream: f?.stream ?? "general",
      };
    });
    const recs = buildRecommendations(aggregated);
    doc.setFontSize(10);
    recs.forEach((r, idx) => {
      const wrapped = doc.splitTextToSize(`${idx + 1}. ${r}`, W - 28);
      if (y + wrapped.length * 5 > H - 20) { doc.addPage(); y = 20; }
      doc.text(wrapped, 14, y); y += wrapped.length * 5 + 2;
    });
    y += 4;

    // Future improvement opportunities
    if (y > H - 60) { doc.addPage(); y = 20; }
    section("Future Improvement Opportunities");
    const opp: string[] = [];
    const nonRecMat = (data?.materials ?? []).filter((m: any) => !m.recyclable && m.weight_kg > 0).sort((a: any, b: any) => b.weight_kg - a.weight_kg)[0];
    if (nonRecMat) opp.push(`${nonRecMat.name} (${nonRecMat.weight_kg.toFixed(1)} kg) is currently landfill-bound — explore alternative material substitution or specialist processors.`);
    if ((k?.circularScore ?? 0) < 61) opp.push(`Lift Circular Economy Score above 61 by introducing source separation and a buy-back partnership.`);
    if ((k?.recoverableValueZar ?? 0) > 0) opp.push(`Negotiate offtake contracts to capture the R ${(k?.recoverableValueZar ?? 0).toFixed(0)} recoverable material value identified.`);
    if ((k?.confidenceScore ?? 0) < 80) opp.push(`Increase analysis confidence (currently ${(k?.confidenceScore ?? 0).toFixed(0)}%) by uploading clearer, well-lit photos of separated material piles.`);
    if (opp.length === 0) opp.push("Maintain current diversion practices and continue monitoring monthly.");
    doc.setFontSize(10);
    opp.forEach((r, idx) => {
      const wrapped = doc.splitTextToSize(`• ${r}`, W - 28);
      if (y + wrapped.length * 5 > H - 20) { doc.addPage(); y = 20; }
      doc.text(wrapped, 14, y); y += wrapped.length * 5 + 2;
    });
    y += 6;

    // Methodology
    if (y > H - 80) { doc.addPage(); y = 20; }
    section("Methodology");
    const method = [
      "Material composition is estimated using AI image analysis (Google Gemini 2.5 Flash multimodal vision).",
      "Carbon impacts and economic values are calculated using deterministic South African benchmark factors — not generated by the AI model.",
      "Annual savings are based on avoided landfill disposal costs (R1.20/kg gate fee, annualised) and material recovery opportunities at SA buy-back rates.",
      "Equivalences use IPCC defaults: 21 kg CO\u2082/year per mature tree, 180 g CO\u2082/km passenger car, 25 g per PET bottle.",
      "Results are directional estimates and should be validated through physical waste audits before being used in regulated ESG submissions.",
    ];
    doc.setFontSize(10);
    method.forEach((m) => {
      const wrapped = doc.splitTextToSize(`• ${m}`, W - 28);
      if (y + wrapped.length * 5 > H - 20) { doc.addPage(); y = 20; }
      doc.text(wrapped, 14, y); y += wrapped.length * 5 + 2;
    });
    y += 6;

    // Confidence Score panel
    if (y > H - 60) { doc.addPage(); y = 20; }
    section("AI Confidence Score");
    const cConf = k?.confidenceScore ?? 0;
    doc.setFontSize(36); doc.setTextColor(cBand.color === "#009879" ? 0 : cBand.color === "#F59E0B" ? 245 : 239,
                                          cBand.color === "#009879" ? 152 : cBand.color === "#F59E0B" ? 158 : 68,
                                          cBand.color === "#009879" ? 121 : cBand.color === "#F59E0B" ? 11 : 68);
    doc.text(`${cConf.toFixed(0)}%`, 14, y + 14);
    doc.setFontSize(12); doc.setTextColor(...DARK);
    doc.text(`${cBand.label} confidence`, 60, y + 14);
    doc.setFontSize(9); doc.setTextColor(...GREY);
    const bandText = "Confidence bands: High (90-100), Medium (70-89), Low (below 70). Low scores indicate the AI is uncertain about material identification — a physical audit is recommended before acting on the figures.";
    doc.text(doc.splitTextToSize(bandText, W - 28), 14, y + 24);

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setFontSize(8); doc.setTextColor(...GREY);
      doc.text(`WasteIQ AI · ${company} · Page ${p}/${pageCount}`, 14, H - 6);
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

async function loadImageAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function reportingPeriod(insights: any[]): string {
  if (!insights.length) return new Date().toLocaleString("en-ZA", { month: "long", year: "numeric" });
  const dates = insights.map((i) => new Date(i.created_at).getTime()).sort();
  const start = new Date(dates[0]);
  const end = new Date(dates[dates.length - 1]);
  const fmt = (d: Date) => d.toLocaleString("en-ZA", { month: "short", year: "numeric" });
  return fmt(start) === fmt(end) ? fmt(start) : `${fmt(start)} – ${fmt(end)}`;
}