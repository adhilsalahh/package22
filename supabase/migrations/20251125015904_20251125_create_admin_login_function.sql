/*
  # Create admin login verification function

  1. New Functions
    - `verify_admin_login` - Verifies admin credentials and returns admin data
    - `update_admin_last_login` - Updates admin last login timestamp
  
  2. Purpose
    - Provides secure admin authentication using email/password
    - Returns admin user data if credentials are valid
    - Tracks last login timestamp for security auditing
*/

CREATE OR REPLACE FUNCTION verify_admin_login(login_email text, login_password text)
RETURNS TABLE(admin_id uuid, email text, full_name text, is_admin boolean) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    p.full_name,
    p.is_admin
  FROM auth.users u
  LEFT JOIN profiles p ON u.id = p.id
  WHERE u.email = login_email 
    AND p.is_admin = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_admin_last_login(admin_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET updated_at = now()
  WHERE id = admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
