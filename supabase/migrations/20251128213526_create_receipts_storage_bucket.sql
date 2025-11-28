/*
  # Create receipts storage bucket with RLS policies
  
  1. Storage Setup
    - Create 'receipts' bucket if not exists
    - Enable public access for viewing receipts
    
  2. Security Policies
    - Allow authenticated users to upload their own receipts
    - Allow authenticated users to view their own receipts
    - Allow admins to view all receipts
*/

-- Create the receipts bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all receipts" ON storage.objects;
DROP POLICY IF EXISTS "Public can view receipts" ON storage.objects;

-- Allow authenticated users to upload receipts
CREATE POLICY "Users can upload receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own receipts
CREATE POLICY "Users can update own receipts"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public to view receipts (since bucket is public)
CREATE POLICY "Public can view receipts"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'receipts');

-- Allow users to delete their own receipts
CREATE POLICY "Users can delete own receipts"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
