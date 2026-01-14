-- Full Schema for 'bookings' table
-- Run this in the Supabase SQL Editor

-- 1. Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id), -- Optional: Link to auth user
  package_id UUID REFERENCES packages(id) NOT NULL, -- Link to package
  
  -- Booking Details
  booking_date TEXT NOT NULL, -- Stored as 'YYYY-MM-DD'
  travel_group_name TEXT,
  number_of_members INTEGER DEFAULT 1,
  
  -- Financials
  total_price NUMERIC DEFAULT 0,
  advance_amount NUMERIC DEFAULT 0, -- The required advance
  advance_paid NUMERIC DEFAULT 0,   -- Amount actually paid
  
  -- Statuses
  status TEXT DEFAULT 'pending', -- pending, confirmed, cancelled
  payment_status TEXT DEFAULT 'not_paid', -- not_paid, paid, pending_verification
  
  -- Contact Info (Snapshot at booking time)
  guest_name TEXT,
  guest_phone TEXT,
  
  -- Admin
  admin_notes TEXT,
  advance_receipt_url TEXT,
  payment_screenshot TEXT,
  advance_utr TEXT
);

-- 2. Add Demographic Columns (Safe to run if table exists)
-- Usage: ALTER TABLE bookings ADD COLUMN IF NOT EXISTS column_name data_type DEFAULT default_value;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS adult_males INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS adult_females INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS couples INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS child_under_5 INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS child_5_to_8 INTEGER DEFAULT 0;

-- Optional: If you still have data for 'child_above_8' you can keep it, 
-- but the frontend no longer uses it.
-- ALTER TABLE bookings ADD COLUMN IF NOT EXISTS child_above_8 INTEGER DEFAULT 0;

-- 3. Policies (Row Level Security) - Basic Setup
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own bookings
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own bookings
CREATE POLICY "Users can insert own bookings" ON bookings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow public/admins (depending on your setup) to manage - Adjust as needed
-- Ideally, only Authenticated users or Service Role should manage full access.
