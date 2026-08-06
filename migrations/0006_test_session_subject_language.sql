ALTER TABLE IF EXISTS "test_sessions"
  ADD COLUMN IF NOT EXISTS "subject_language" text;
