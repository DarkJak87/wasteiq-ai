import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureCompanyId(supabase: any, userId: string): Promise<string> {
  const { data: member } = await supabase
    .from("company_members").select("company_id").eq("user_id", userId).limit(1).maybeSingle();
  if (member?.company_id) return member.company_id as string;

  // Lazily provision a company for users whose signup trigger didn't run.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: profile } = await supabaseAdmin
    .from("profiles").select("full_name, email").eq("id", userId).maybeSingle();
  const name = (profile?.full_name || profile?.email?.split("@")[0] || "My") + "'s Company";

  const { data: company, error: cErr } = await supabaseAdmin
    .from("companies").insert({ owner_id: userId, name }).select("id").single();
  if (cErr || !company) throw new Error(cErr?.message || "Could not create company");

  const { error: mErr } = await supabaseAdmin
    .from("company_members").insert({ company_id: company.id, user_id: userId, role: "owner" });
  if (mErr) throw new Error(mErr.message);

  await supabaseAdmin.from("subscriptions").insert({ company_id: company.id, plan: "starter", status: "trialing" });
  return company.id;
}

const CreateInput = z.object({
  filePath: z.string().min(1),
  fileType: z.string().min(1),
  originalName: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
});

export const createUploadRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const companyId = await ensureCompanyId(supabase, userId);

    const { data: row, error } = await supabase.from("uploads").insert({
      company_id: companyId,
      user_id: userId,
      file_path: data.filePath,
      file_type: data.fileType,
      original_name: data.originalName,
      size_bytes: data.sizeBytes,
      status: "pending",
    }).select("id, company_id").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const getSignedUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ ext: z.string().max(10) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const companyId = await ensureCompanyId(supabase, userId);
    const path = `${companyId}/${crypto.randomUUID()}.${data.ext.replace(/[^a-z0-9]/gi, "")}`;
    const { data: signed, error } = await supabase.storage.from("waste-uploads").createSignedUploadUrl(path);
    if (error || !signed) throw new Error(error?.message || "Could not sign upload");
    return { path: signed.path, token: signed.token, signedUrl: signed.signedUrl };
  });
