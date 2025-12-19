-- =====================================================
-- Customer Documents Storage Policies
-- =====================================================
-- Created: 2024-12-04
-- Purpose: customer-documents bucket policies
-- 
-- NOT: Bucket'ı önce manuel oluşturun:
-- Supabase Dashboard → Storage → Create bucket
-- Bucket name: customer-documents
-- Public: false (Private)
-- =====================================================

-- Storage Policies
-- =====================================================

-- SELECT Policy (Authenticated users can read)
CREATE POLICY "Allow authenticated users to read documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'customer-documents');

-- INSERT Policy (Authenticated users can upload)
CREATE POLICY "Allow authenticated users to upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'customer-documents');

-- UPDATE Policy (Authenticated users can update)
CREATE POLICY "Allow authenticated users to update documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'customer-documents')
  WITH CHECK (bucket_id = 'customer-documents');

-- DELETE Policy (Authenticated users can delete)
CREATE POLICY "Allow authenticated users to delete documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'customer-documents');