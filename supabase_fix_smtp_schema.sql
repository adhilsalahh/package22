DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'smtp_settings') THEN
        CREATE TABLE public.smtp_settings (
            setting_key TEXT PRIMARY KEY,
            setting_value TEXT
        );
        ALTER TABLE public.smtp_settings ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;

-- Drop policy to ensure clean slate for recreation (avoids 'policy already exists' error)
DROP POLICY IF EXISTS "Public read smtp" ON public.smtp_settings;

CREATE POLICY "Public read smtp" ON public.smtp_settings FOR SELECT TO anon, authenticated USING (true);

-- Insert/Update values
INSERT INTO public.smtp_settings (setting_key, setting_value) VALUES 
('smtp_host', 'smtp.hostinger.com'),
('smtp_port', '465'),
('smtp_user', 'info@vaorutrippadikkam.com'),
('smtp_pass', 'As900486@'),
('from_email', 'info@vaorutrippadikkam.com'),
('from_name', 'Va Oru Trippadikkam')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;
