ALTER TABLE IF EXISTS "student_profiles"
  ADD COLUMN IF NOT EXISTS "full_name" text,
  ADD COLUMN IF NOT EXISTS "email_address" text,
  ADD COLUMN IF NOT EXISTS "medium" text,
  ADD COLUMN IF NOT EXISTS "board" text,
  ADD COLUMN IF NOT EXISTS "country" text,
  ADD COLUMN IF NOT EXISTS "state" text,
  ADD COLUMN IF NOT EXISTS "city" text;
