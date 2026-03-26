CREATE TABLE "organization_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "user_role" DEFAULT 'runner' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	CONSTRAINT "password_reset_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'runner';--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "tessera" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "luogo_nascita" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "codice_fiscale" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "categoria" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "straniero" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "indirizzo" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "cap" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "citta" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "prov" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "status" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "materiale_2026_consegnato" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "spedizione" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "genere" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "taglia_maglia_cotone" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "taglia_maglia_solar" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "taglia_maglia_pulsar" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "taglia_canotta_solar" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "taglia_canotta_pulsar" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "taglia_felpa_solar" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "taglia_felpa_pulsar" text;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "org_members_org_idx" ON "organization_members" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "org_members_user_idx" ON "organization_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "org_members_unique" ON "organization_members" USING btree ("organization_id","user_id");--> statement-breakpoint
ALTER TABLE "public"."organization_members" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "public"."users" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."user_role";--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'admin', 'runner');--> statement-breakpoint
ALTER TABLE "public"."organization_members" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";--> statement-breakpoint
ALTER TABLE "public"."users" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";