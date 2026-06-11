
-- Reads: any authenticated user can read these buckets (used with signed URLs)
CREATE POLICY "Read salon images" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id IN ('package-images','stylist-photos','avatars'));

-- Admin can write package-images and stylist-photos
CREATE POLICY "Admins upload package-images" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'package-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update package-images" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'package-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete package-images" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'package-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins upload stylist-photos" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'stylist-photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update stylist-photos" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'stylist-photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete stylist-photos" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'stylist-photos' AND public.has_role(auth.uid(), 'admin'));

-- Each user can manage own avatar: object name must start with their uid
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
