-- FIX: Add missing columns to 'packages' table
-- The frontend assumes these columns exist, causing errors if they don't.
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- FIX: Add missing RLS policies for 'packages'
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts or duplication
DROP POLICY IF EXISTS "Public read access for packages" ON public.packages;
DROP POLICY IF EXISTS "Authenticated users can manage packages" ON public.packages;
DROP POLICY IF EXISTS "Admins can insert packages" ON public.packages;
DROP POLICY IF EXISTS "Admins can update packages" ON public.packages;
DROP POLICY IF EXISTS "Admins can delete packages" ON public.packages;

-- Policy 1: Everyone (public) can READ packages
CREATE POLICY "Public read access for packages"
ON public.packages FOR SELECT
TO public
USING (true);

-- Policy 2: Authenticated users can INSERT/UPDATE/DELETE packages
-- (In a real app, you might restrict this to 'admin' role, but for now we allow any logged-in user)
CREATE POLICY "Authenticated users can manage packages"
ON public.packages FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- FIX: Add missing RLS policies for 'package_dates'
-- First, ensure the table exists
CREATE TABLE IF NOT EXISTS public.package_dates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID REFERENCES public.packages(id) ON DELETE CASCADE,
  available_date DATE NOT NULL,
  seats INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.package_dates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public read access for package_dates" ON public.package_dates;
DROP POLICY IF EXISTS "Authenticated users can manage package_dates" ON public.package_dates;

-- Policy 1: Everyone can READ dates
CREATE POLICY "Public read access for package_dates"
ON public.package_dates FOR SELECT
TO public
USING (true);

-- Policy 2: Authenticated users can MANAGE dates
CREATE POLICY "Authenticated users can manage package_dates"
ON public.package_dates FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
