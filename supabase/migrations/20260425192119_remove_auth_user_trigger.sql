/*
  # Remove auth.users trigger to fix signup

  ## Summary
  The trigger on auth.users that auto-creates profile rows is causing
  "Database error saving new user" during signup because it runs in a
  context that conflicts with Supabase's auth pipeline.

  ## Changes
  - Drop trigger `on_auth_user_created` on auth.users
  - Drop function `handle_new_user`
  - Profile creation will be handled by the client after signup
  - Allow display_name to be optional (already had default '')
*/

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
