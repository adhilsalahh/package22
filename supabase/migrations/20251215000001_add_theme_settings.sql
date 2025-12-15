-- Add theme columns to site_settings table
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#059669',
ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#0d9488',
ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'Inter, sans-serif';

-- Update the existing row (if any) or insert default
INSERT INTO site_settings (primary_color, secondary_color, font_family)
VALUES ('#059669', '#0d9488', 'Inter, sans-serif')
ON CONFLICT DO NOTHING;
