ALTER TABLE "users" ADD COLUMN "member_id" uuid REFERENCES "public"."members"("id") ON DELETE set null;
