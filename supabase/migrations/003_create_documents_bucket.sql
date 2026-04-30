-- Create the documents storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: authenticated users can upload documents
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

-- RLS policy: authenticated users can read documents
CREATE POLICY "Authenticated users can read documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');

-- RLS policy: service role can download documents (for serverless function)
CREATE POLICY "Service role can download documents"
  ON storage.objects FOR SELECT
  TO service_role
  USING (bucket_id = 'documents');
