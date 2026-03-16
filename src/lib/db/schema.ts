import {
  pgTable,
  text,
  timestamp,
  uuid,
  decimal,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Ruoli utente nell'organizzazione
export const userRoleEnum = pgEnum("user_role", [
  "owner",
  "admin",
  "member",
]);

// Stato pagamento
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "completed",
  "failed",
  "refunded",
]);

// Organizzazioni (company / squadre) - multi-tenant
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Utenti (admin delle company)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  name: text("name"),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  role: userRoleEnum("role").notNull().default("member"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Iscritti (membri della squadra di corsa)
export const members = pgTable(
  "members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    birthDate: text("birth_date"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("members_org_idx").on(table.organizationId),
    index("members_email_org_idx").on(table.email, table.organizationId),
  ]
);

// Pagamenti (quota iscrizione, rinnovi, ecc.)
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    memberId: uuid("member_id").references(() => members.id, {
      onDelete: "set null",
    }),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("EUR"),
    status: paymentStatusEnum("status").notNull().default("pending"),
    description: text("description"),
    stripePaymentId: text("stripe_payment_id"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("payments_org_idx").on(table.organizationId),
    index("payments_member_idx").on(table.memberId),
  ]
);

// Gare (calendario corse)
export const races = pgTable(
  "races",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    raceDate: text("race_date").notNull(), // YYYY-MM-DD
    type: text("type").notNull(), // CROSS, STRADA, MEZZA, TRAIL, ...
    name: text("name").notNull(),
    location: text("location").notNull(),
    province: text("province"), // VA, MI, NO, MB, ...
    distance: text("distance"), // "6/3", "21.097", "42.195"
    time: text("time"), // "9.30", "14.30"
    infoUrl: text("info_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("races_org_idx").on(table.organizationId),
    index("races_date_idx").on(table.raceDate),
  ]
);

// Partecipazione iscritto → gara (chi partecipa a quale gara)
export const raceParticipants = pgTable(
  "race_participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    raceId: uuid("race_id")
      .notNull()
      .references(() => races.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("race_participants_race_idx").on(table.raceId),
    index("race_participants_member_idx").on(table.memberId),
  ]
);

// Car sharing: autista o passeggero per una gara
export const carSharingRoleEnum = pgEnum("car_sharing_role", ["driver", "passenger"]);

export const carSharing = pgTable(
  "car_sharing",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    raceId: uuid("race_id")
      .notNull()
      .references(() => races.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    role: carSharingRoleEnum("role").notNull(),
    seatsAvailable: text("seats_available"), // solo per driver: "2", "3"...
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("car_sharing_race_idx").on(table.raceId),
    index("car_sharing_member_idx").on(table.memberId),
    uniqueIndex("car_sharing_race_member_unique").on(table.raceId, table.memberId),
  ]
);

// Foto condivise (galleria)
export const photos = pgTable(
  "photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    raceId: uuid("race_id").references(() => races.id, { onDelete: "set null" }),
    memberId: uuid("member_id").references(() => members.id, { onDelete: "set null" }),
    url: text("url").notNull(),
    filename: text("filename").notNull(),
    caption: text("caption"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("photos_org_idx").on(table.organizationId),
    index("photos_race_idx").on(table.raceId),
  ]
);

// Eventi (allenamenti, riunioni, serate, ecc.)
export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    date: text("date").notNull(), // YYYY-MM-DD
    time: text("time"), // HH:MM
    location: text("location"),
    raceId: uuid("race_id").references(() => races.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("events_org_idx").on(table.organizationId),
    index("events_date_idx").on(table.date),
  ]
);

// Partecipazione iscritto → evento
export const eventParticipants = pgTable(
  "event_participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("event_participants_event_idx").on(table.eventId),
    index("event_participants_member_idx").on(table.memberId),
  ]
);

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type Race = typeof races.$inferSelect;
export type NewRace = typeof races.$inferInsert;
export type RaceParticipant = typeof raceParticipants.$inferSelect;
export type NewRaceParticipant = typeof raceParticipants.$inferInsert;
export type CarSharing = typeof carSharing.$inferSelect;
export type NewCarSharing = typeof carSharing.$inferInsert;
export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventParticipant = typeof eventParticipants.$inferSelect;
export type NewEventParticipant = typeof eventParticipants.$inferInsert;
