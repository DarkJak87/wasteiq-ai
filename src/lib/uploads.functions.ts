import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
    const { data: member } = await supabase
      .from("company_members").select("company_id").eq("user_id", userId).limit(1).maybeSingle();
    if (!member?.company_id) throw new Error("No company found for user.");

    const { data: row, error } = await supabase.from("uploads").insert({
      company_id: member.company_id,
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
    const { data: member } = await supabase
      .from("company_members").select("company_id").eq("user_id", userId).limit(1).maybeSingle();
    if (!member?.company_id) throw new Error("No company found for user.");
    const path = `${member.company_id}/${crypto.randomUUID()}.${data.ext.replace(/[^a-z0-9]/gi, "")}`;
    const { data: signed, error } = await supabase.storage.from("waste-uploads").createSignedUploadUrl(path);
    if (error || !signed) throw new Error(error?.message || "Could not sign upload");
    return { path: signed.path, token: signed.token, signedUrl: signed.signedUrl };
  });
