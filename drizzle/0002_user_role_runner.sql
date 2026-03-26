DO $$
BEGIN
  -- Renaming keeps existing data consistent (member -> runner).
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'user_role'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' AND t.typname = 'user_role' AND e.enumlabel = 'member'
    ) THEN
      ALTER TYPE "public"."user_role" RENAME VALUE 'member' TO 'runner';
    END IF;
  END IF;
END $$;

ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'runner';
ALTER TABLE "organization_members" ALTER COLUMN "role" SET DEFAULT 'runner';

