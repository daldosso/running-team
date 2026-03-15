import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations, members, payments } from "@/lib/db/schema";
import { getOrganizationId } from "@/lib/org-context";

export const dynamic = "force-dynamic";

const NOMI: string[] = [
  "Marco", "Luca", "Andrea", "Giuseppe", "Alessandro", "Francesco", "Matteo",
  "Giulia", "Chiara", "Elena", "Sara", "Martina", "Federica", "Laura", "Anna",
];

const COGNOMI: string[] = [
  "Rossi", "Russo", "Ferrari", "Esposito", "Bianchi", "Romano", "Colombo",
  "Ricci", "Marino", "Greco", "Bruno", "Gallo", "Conti", "De Luca", "Mancini",
];

const DESCRIZIONI_PAGAMENTI: string[] = [
  "Quota iscrizione 2025",
  "Rinnovo annuale",
  "Quota sociale",
  "Iscrizione gara 10 km",
  "Iscrizione mezza maratona",
  "Tessera associativa",
  "Quota gennaio",
  "Rimborso maglietta",
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(from: number, to: number): string {
  const start = new Date(from, 0, 1).getTime();
  const end = new Date(to, 11, 31).getTime();
  const d = new Date(start + Math.random() * (end - start));
  return d.toISOString().slice(0, 10);
}

export async function POST() {
  let orgId = await getOrganizationId();
  if (!orgId) {
    const [existing] = await db.select().from(organizations).limit(1);
    if (existing) {
      orgId = existing.id;
    } else {
      const [created] = await db
        .insert(organizations)
        .values({ name: "Squadra Demo", slug: "squadra-demo" })
        .returning();
      orgId = created!.id;
    }
  }

  const existingMembers = await db
    .select({ id: members.id })
    .from(members)
    .where(eq(members.organizationId, orgId));
  if (existingMembers.length > 0) {
    return NextResponse.json({
      message: "Dati già presenti. Elimina iscritti e pagamenti per ripopolare.",
      membersCount: existingMembers.length,
    });
  }

  const insertedMembers = await db
    .insert(members)
    .values(
      Array.from({ length: 18 }, (_, i) => {
        const nome = NOMI[i % NOMI.length];
        const cognome = COGNOMI[Math.floor(i / NOMI.length) % COGNOMI.length];
        const email = `${nome.toLowerCase()}.${cognome.toLowerCase().replace(/\s/g, "")}${i}@email.it`;
        return {
          organizationId: orgId!,
          firstName: nome,
          lastName: cognome,
          email,
          phone: Math.random() > 0.2 ? `3${String(3000000000 + i * 123456).slice(0, 9)}` : null,
          birthDate: Math.random() > 0.3 ? randomDate(1970, 2005) : null,
          notes: Math.random() > 0.6 ? "Interesse mezza maratona" : null,
        };
      })
    )
    .returning({ id: members.id });

  const memberIds = insertedMembers.map((r) => r.id);

  const paymentsToInsert: Array<{
    organizationId: string;
    memberId: string;
    amount: string;
    currency: string;
    status: "pending" | "completed";
    description: string;
    paidAt: Date | null;
  }> = [];

  for (let i = 0; i < 15; i++) {
    const completed = i < 12;
    paymentsToInsert.push({
      organizationId: orgId!,
      memberId: memberIds[i % memberIds.length]!,
      amount: (25 + Math.floor(Math.random() * 30)).toFixed(2),
      currency: "EUR",
      status: completed ? "completed" : "pending",
      description: randomItem(DESCRIZIONI_PAGAMENTI),
      paidAt: completed ? new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000) : null,
    });
  }
  for (let i = 0; i < 5; i++) {
    const completed = Math.random() > 0.3;
    paymentsToInsert.push({
      organizationId: orgId!,
      memberId: memberIds[Math.floor(Math.random() * memberIds.length)]!,
      amount: (15 + Math.floor(Math.random() * 40)).toFixed(2),
      currency: "EUR",
      status: completed ? "completed" : "pending",
      description: randomItem(DESCRIZIONI_PAGAMENTI),
      paidAt: completed ? new Date() : null,
    });
  }

  await db.insert(payments).values(
    paymentsToInsert.map((p) => ({
      organizationId: p.organizationId,
      memberId: p.memberId,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      description: p.description,
      paidAt: p.paidAt,
    }))
  );

  return NextResponse.json({
    message: "Database popolato con dati finti (nomi italiani).",
    membersCount: insertedMembers.length,
    paymentsCount: paymentsToInsert.length,
  });
}
