ALTER TABLE IF EXISTS "teachers"
  ADD COLUMN IF NOT EXISTS "is_approved" text DEFAULT 'false' NOT NULL;

UPDATE "teachers"
SET "is_approved" = 'false'
WHERE "is_approved" IS NULL;
