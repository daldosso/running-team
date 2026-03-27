CREATE TABLE "organization_table_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"table_key" text NOT NULL,
	"column_order" text,
	"column_widths" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization_table_preferences" ADD CONSTRAINT "organization_table_preferences_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "org_table_prefs_org_idx" ON "organization_table_preferences" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "org_table_prefs_unique" ON "organization_table_preferences" USING btree ("organization_id","table_key");
