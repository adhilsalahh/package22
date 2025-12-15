-- HEAVY RESET: Drop existing tables to fix schema mismatch and missing columns
DROP TABLE IF EXISTS site_settings CASCADE;
DROP TABLE IF EXISTS site_settings_v2 CASCADE;
DROP TABLE IF EXISTS site_settings_v3 CASCADE;

-- Create the table fresh with ALL required columns
CREATE TABLE site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_title text DEFAULT 'Welcome to Va Oru Trippadikkam',
  hero_subtitle text DEFAULT 'Your trusted partner for package booking and tracking',
  hero_image_url text DEFAULT '',
  header_logo_url text DEFAULT '/Va oru trippadikkam.jpg',
  trekking_images jsonb DEFAULT '[]'::jsonb,
  gallery_images jsonb DEFAULT '[]'::jsonb,
  primary_color text DEFAULT '#059669',
  secondary_color text DEFAULT '#0d9488',
  font_family text DEFAULT 'Inter, sans-serif',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES profiles(id)
);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "Anyone can view site settings"
  ON site_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public can view site settings"
  ON site_settings FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Admins can insert site settings"
  ON site_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update site settings"
  ON site_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Insert default row immediately so the site works
INSERT INTO site_settings (
  hero_title,
  hero_subtitle,
  header_logo_url,
  primary_color,
  secondary_color
) VALUES (
  'Welcome to Va Oru Trippadikkam',
  'Your trusted partner for package booking and tracking',
  '/Va oru trippadikkam.jpg',
  '#059669',
  '#0d9488'
);
