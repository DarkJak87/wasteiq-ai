
CREATE POLICY "waste_uploads_member_read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'waste-uploads' AND public.is_company_member((storage.foldername(name))[1]::uuid, auth.uid()));

CREATE POLICY "waste_uploads_member_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'waste-uploads' AND public.is_company_member((storage.foldername(name))[1]::uuid, auth.uid()));

CREATE POLICY "waste_uploads_member_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'waste-uploads' AND public.is_company_member((storage.foldername(name))[1]::uuid, auth.uid()));
