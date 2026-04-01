"use server";

import { db } from "@/lib/db";
import { members, payments } from "@/lib/db/schema";
import { getOrganizationId } from "@/lib/org-context";
import { eq, desc } from "drizzle-orm";

export async function exportMembersAsCSV() {
  const orgId = await getOrganizationId();
  if (!orgId) return { ok: false, error: "Organizzazione non specificata" };

  const membersList = await db
    .select()
    .from(members)
    .where(eq(members.organizationId, orgId))
    .orderBy(desc(members.createdAt));

  const paymentsList = await db
    .select({
      memberId: payments.memberId,
      status: payments.status,
      paidAt: payments.paidAt,
    })
    .from(payments)
    .where(eq(payments.organizationId, orgId))
    .orderBy(desc(payments.paidAt), desc(payments.createdAt));

  const latestPaymentByMember = new Map<string, string>();
  for (const payment of paymentsList) {
    if (payment.memberId && !latestPaymentByMember.has(payment.memberId)) {
      latestPaymentByMember.set(payment.memberId, payment.status);
    }
  }

  const escapeCSV = (value: string | null | undefined): string => {
    if (!value) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = [
    "Nome",
    "Cognome",
    "Email",
    "Telefono",
    "Tessera",
    "Codice Fiscale",
    "Categoria",
    "Status",
    "Genere",
    "Materiale 2026",
    "Spedizione",
    "Anno Iscrizione",
    "Pagamento",
    "Indirizzo",
    "CAP",
    "Città",
    "Provincia",
    "Luogo Nascita",
    "Data Nascita",
    "Note",
  ];

  const rows = membersList.map((m) => [
    escapeCSV(m.firstName),
    escapeCSV(m.lastName),
    escapeCSV(m.email),
    escapeCSV(m.phone),
    escapeCSV(m.tessera),
    escapeCSV(m.codiceFiscale),
    escapeCSV(m.categoria),
    escapeCSV(m.status),
    escapeCSV(m.genere),
    escapeCSV(m.materiale2026Consegna),
    escapeCSV(m.spedizione),
    m.createdAt ? new Date(m.createdAt).getFullYear().toString() : "",
    escapeCSV(latestPaymentByMember.get(m.id)),
    escapeCSV(m.indirizzo),
    escapeCSV(m.cap),
    escapeCSV(m.citta),
    escapeCSV(m.prov),
    escapeCSV(m.luogoNascita),
    escapeCSV(m.birthDate),
    escapeCSV(m.notes),
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return { ok: true, csv, fileName: `iscritti_${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}.csv` };
}

export async function importMembersFromCSV(csvContent: string) {
  const orgId = await getOrganizationId();
  if (!orgId) return { ok: false, error: "Organizzazione non specificata" };

  const lines = csvContent.trim().split("\n");
  if (lines.length < 2) return { ok: false, error: "CSV vuoto o non valido" };

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const nameIndex = headers.findIndex((h) => h.includes("nome") && !h.includes("cognome"));
  const lastNameIndex = headers.findIndex((h) => h.includes("cognome"));
  const emailIndex = headers.findIndex((h) => h.includes("email"));

  if (nameIndex === -1 || lastNameIndex === -1 || emailIndex === -1) {
    return { ok: false, error: "CSV mancante di colonne richieste: Nome, Cognome, Email" };
  }

  const phoneIndex = headers.findIndex((h) => h.includes("telefono"));
  const tesseraIndex = headers.findIndex((h) => h.includes("tessera"));
  const cfIndex = headers.findIndex((h) => h.includes("codice") || h.includes("fiscale"));
  const categoriaIndex = headers.findIndex((h) => h.includes("categoria"));
  const statusIndex = headers.findIndex((h) => h.includes("status"));
  const genereIndex = headers.findIndex((h) => h.includes("genere"));
  const materialeIndex = headers.findIndex((h) => h.includes("materiale"));
  const spedizioneIndex = headers.findIndex((h) => h.includes("spedizione"));
  const indirizzoIndex = headers.findIndex((h) => h.includes("indirizzo"));
  const capIndex = headers.findIndex((h) => h.includes("cap"));
  const cittaIndex = headers.findIndex((h) => h.includes("città"));
  const provIndex = headers.findIndex((h) => h.includes("provincia") || h.includes("prov"));
  const luogoIndex = headers.findIndex((h) => h.includes("luogo"));
  const birthIndex = headers.findIndex((h) => h.includes("nascita"));
  const notesIndex = headers.findIndex((h) => h.includes("note"));

  const imported = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.match(/("(?:[^"]|"")*"|[^,]*)/g) || [];
    const getField = (index: number) => {
      if (index === -1) return null;
      const val = parts[index]?.replace(/^"|"$/g, "").replace(/""/g, '"') ?? "";
      return val.trim().length > 0 ? val.trim() : null;
    };

    const firstName = getField(nameIndex);
    const lastName = getField(lastNameIndex);
    const email = getField(emailIndex);

    if (!firstName || !lastName || !email) {
      errors.push(`Riga ${i + 1}: mancano Nome, Cognome o Email`);
      continue;
    }

    try {
      await db.insert(members).values({
        organizationId: orgId,
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone: getField(phoneIndex) ?? null,
        tessera: getField(tesseraIndex) ?? null,
        codiceFiscale: getField(cfIndex) ?? null,
        categoria: getField(categoriaIndex) ?? null,
        status: getField(statusIndex) ?? null,
        genere: getField(genereIndex) ?? null,
        materiale2026Consegna: getField(materialeIndex) ?? null,
        spedizione: getField(spedizioneIndex) ?? null,
        indirizzo: getField(indirizzoIndex) ?? null,
        cap: getField(capIndex) ?? null,
        citta: getField(cittaIndex) ?? null,
        prov: getField(provIndex) ?? null,
        luogoNascita: getField(luogoIndex) ?? null,
        birthDate: getField(birthIndex) ?? null,
        notes: getField(notesIndex) ?? null,
      });
      imported.push(firstName + " " + lastName);
    } catch (error) {
      errors.push(`Riga ${i + 1} (${firstName} ${lastName}): ${(error as Error).message}`);
    }
  }

  return {
    ok: true,
    imported: imported.length,
    errors: errors.length > 0 ? errors : undefined,
  };
}
