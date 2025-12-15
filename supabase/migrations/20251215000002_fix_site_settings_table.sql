-- Create new table with updated schema
CREATE TABLE IF NOT EXISTS site_settings_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_title text DEFAULT 'Welcome to Va Oru Trippadikkam',
  hero_subtitle text DEFAULT 'Your trusted partner for package booking and tracking',
  hero_image_url text DEFAULT '',
  trekking_images jsonb DEFAULT '[]'::jsonb,
  gallery_images jsonb DEFAULT '[]'::jsonb,
  primary_color text DEFAULT '#059669',
  secondary_color text DEFAULT '#0d9488',
  font_family text DEFAULT 'Inter, sans-serif',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES profiles(id)
);

-- Copy data from old table if exists
INSERT INTO site_settings_v2 (
  id, hero_title, hero_subtitle, hero_image_url, 
  trekking_images, gallery_images, updated_at, updated_by
)
SELECT 
  id, hero_title, hero_subtitle, hero_image_url, 
  trekking_images, gallery_images, updated_at, updated_by
FROM site_settings
ON CONFLICT DO NOTHING;

-- Drop old table and rename new one
DROP TABLE IF EXISTS site_settings;
ALTER TABLE site_settings_v2 RENAME TO site_settings;

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

-- Insert default row if empty
INSERT INTO site_settings (
  hero_title
)
SELECT 'Welcome to Va Oru Trippadikkam'
WHERE NOT EXISTS (SELECT 1 FROM site_settings);
