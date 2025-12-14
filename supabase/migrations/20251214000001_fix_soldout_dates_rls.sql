-- Allow authenticated users to insert sold-out dates
CREATE POLICY "Enable insert for authenticated users only" ON "public"."package_soldout_dates"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to delete sold-out dates
CREATE POLICY "Enable delete for authenticated users only" ON "public"."package_soldout_dates"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (true);
