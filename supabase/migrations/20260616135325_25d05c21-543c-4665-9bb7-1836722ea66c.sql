
-- product-media: public read, admin write
CREATE POLICY "product-media public read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-media');
CREATE POLICY "product-media admin write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "product-media admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "product-media admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-media' AND public.has_role(auth.uid(), 'admin'));

-- site-assets: public read, admin write
CREATE POLICY "site-assets public read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'site-assets');
CREATE POLICY "site-assets admin write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "site-assets admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "site-assets admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));

-- payment-proofs: anyone can upload, admin-only read/delete
CREATE POLICY "payment-proofs anyone upload" ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'payment-proofs');
CREATE POLICY "payment-proofs admin read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "payment-proofs admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(), 'admin'));
