ALTER TABLE "members"
  ADD COLUMN IF NOT EXISTS "anno_iscrizione" integer;

ALTER TABLE "members"
  ADD COLUMN IF NOT EXISTS "payment_status" "payment_status";

ALTER TABLE "events"
  ADD COLUMN IF NOT EXISTS "pdf_url" text;

ALTER TABLE "events"
  ADD COLUMN IF NOT EXISTS "pdf_filename" text;

UPDATE "members"
SET "anno_iscrizione" = 2026
WHERE "anno_iscrizione" IS NULL;
