CREATE TABLE "user_table_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"table_key" text NOT NULL,
	"column_order" text,
	"column_widths" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_table_preferences" ADD CONSTRAINT "user_table_preferences_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_table_preferences" ADD CONSTRAINT "user_table_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_table_prefs_org_idx" ON "user_table_preferences" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "user_table_prefs_user_idx" ON "user_table_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_table_prefs_unique" ON "user_table_preferences" USING btree ("organization_id","user_id","table_key");
