ALTER TABLE packages ADD COLUMN IF NOT EXISTS is_special_package BOOLEAN DEFAULT false;
