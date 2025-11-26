/*
  # Add created_by column to packages table

  1. Changes
    - Add `created_by` column to `packages` table
    - Set up foreign key constraint to `profiles` table
    - Add index for better query performance
  
  2. Security
    - Maintains existing RLS policies
    - Links packages to their creators
*/

-- Add created_by column to packages table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'packages' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE packages ADD COLUMN created_by uuid REFERENCES profiles(id);
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_packages_created_by ON packages(created_by);