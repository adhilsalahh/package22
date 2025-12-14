/*
  # Add INSERT Policy to Profiles Table

  1. Changes
    - Add INSERT policy to allow users to create their own profiles during signup
    - This fixes the RLS violation when creating profiles for new users
    
  2. Security
    - Users can only insert profiles with their own user ID
    - Prevents users from creating profiles for other users
*/

CREATE POLICY "Users can create their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);