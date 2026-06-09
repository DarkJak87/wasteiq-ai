import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Loader2, FileText, ImageIcon, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createUploadRecord, getSignedUploadUrl } from "@/lib/uploads.functions";
import { analyzeUpload } from "@/lib/ai.functions";
import { getDashboardData } from "@/lib/dashboard.functions";

export const Route = createFileRoute("/_authenticated/dashboard/uploads")({
  component: UploadsPage,
});

const MAX = 10 * 1024 * 1024;

function UploadsPage() {
  const qc = useQueryClient();
  const fnGetData = useServerFn(getDashboardData);
  const fnSign = useServerFn(getSignedUploadUrl);
  const fnCreate = useServerFn(createUploadRecord);
  const fnAnalyze = useServerFn(analyzeUpload);

  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => fnGetData() });
  const [busy, setBusy] = useState(false);

  const onDrop = useCallback(async (files: File[]) => {
    if (!files.length) return;
    setBusy(true);
    try {
      for (const file of files) {
        if (file.size > MAX) { toast.error(`${file.name} exceeds 10MB`); continue; }
        const ext = (file.name.split(".").pop() || "bin").toLowerCase();
        const { path, token } = await fnSign({ data: { ext } });
        const { error: upErr } = await (await import("@/integrations/supabase/client")).supabase
          .storage.from("waste-uploads").uploadToSignedUrl(path, token, file, { contentType: file.type });
        if (upErr) { toast.error(upErr.message); continue; }
        const row = await fnCreate({ data: { filePath: path, fileType: file.type || "application/octet-stream", originalName: file.name, sizeBytes: file.size } });
        toast.success(`${file.name} uploaded — analyzing…`);
        try {
          await fnAnalyze({ data: { uploadId: row.id } });
          toast.success(`${file.name} analyzed`);
        } catch (e: any) {
          toast.error(e.message ?? "Analysis failed");
        }
      }
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    } finally {
      setBusy(false);
    }
  }, [fnSign, fnCreate, fnAnalyze, qc]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [], "application/pdf": [] },
    multiple: true,
    disabled: busy,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Uploads</h1>
        <p className="text-sm text-muted-foreground">Drop waste photos, invoices, or PDFs. Our AI does the rest.</p>
      </div>

      <Card {...getRootProps()} className={`cursor-pointer border-2 border-dashed p-10 text-center transition ${isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
        <input {...getInputProps()} />
        <div className="mx-auto flex max-w-md flex-col items-center gap-2">
          {busy ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <UploadCloud className="h-8 w-8 text-primary" />}
          <p className="font-medium">{busy ? "Processing…" : isDragActive ? "Drop files here" : "Drag & drop or click to upload"}</p>
          <p className="text-xs text-muted-foreground">Images or PDFs · max 10MB · multiple files supported</p>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">All uploads</h2>
          <Button variant="ghost" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["dashboard"] })}>
            <RefreshCw className="mr-2 h-3 w-3" /> Refresh
          </Button>
        </div>
        {(!data?.uploads || data.uploads.length === 0) ? (
          <p className="text-sm text-muted-foreground">Nothing here yet.</p>
        ) : (
          <div className="divide-y divide-border/60">
            {data.uploads.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-3 text-sm">
                <div className="flex items-center gap-3">
                  {u.file_type?.startsWith("image/") ? <ImageIcon className="h-4 w-4 text-muted-foreground" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                  <div>
                    <div className="font-medium">{u.original_name}</div>
                    <div className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleString()} · {((u.size_bytes ?? 0) / 1024).toFixed(0)} KB</div>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs ${u.status === "processed" ? "bg-primary/10 text-primary" : u.status === "failed" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>{u.status}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
