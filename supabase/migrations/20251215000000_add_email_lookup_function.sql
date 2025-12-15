-- Function to lookup email by name/phone/email
CREATE OR REPLACE FUNCTION get_email_by_identifier(identifier_input text)
RETURNS text AS $$
DECLARE
  found_email text;
BEGIN
  SELECT email INTO found_email
  FROM profiles
  WHERE 
    LOWER(full_name) = LOWER(identifier_input) OR
    LOWER(email) = LOWER(identifier_input) OR
    phone = identifier_input
  LIMIT 1;
  
  RETURN found_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
