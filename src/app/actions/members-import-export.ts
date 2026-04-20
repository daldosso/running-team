"use server";

import { db } from "@/lib/db";
import { members, payments } from "@/lib/db/schema";
import { getOrganizationId } from "@/lib/org-context";
import { and, desc, eq } from "drizzle-orm";

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

  const normalizeHeader = (value: string) =>
    value
      .replace(/^\ufeff/, "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const normalizeDate = (value: string | null) => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

    const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (!slashMatch) return trimmed;

    const month = Number(slashMatch[1]);
    const day = Number(slashMatch[2]);
    let year = Number(slashMatch[3]);

    if (year < 100) {
      year += year >= 30 ? 1900 : 2000;
    }

    if (
      !Number.isInteger(day) ||
      !Number.isInteger(month) ||
      !Number.isInteger(year) ||
      day < 1 ||
      day > 31 ||
      month < 1 ||
      month > 12
    ) {
      return trimmed;
    }

    return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
  };

  const detectDelimiter = (headerLine: string) => {
    const sample = headerLine.replace(/^\ufeff/, "");
    const counts = new Map<string, number>([
      [",", (sample.match(/,/g) || []).length],
      [";", (sample.match(/;/g) || []).length],
      ["\t", (sample.match(/\t/g) || []).length],
      ["|", (sample.match(/\|/g) || []).length],
    ]);
    let best: { delim: string; count: number } | null = null;
    for (const [delim, count] of counts) {
      if (!best || count > best.count) best = { delim, count };
    }
    return best && best.count > 0 ? best.delim : ",";
  };

  const parseCSVLine = (line: string, delimiter: string) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }
      if (char === delimiter && !inQuotes) {
        result.push(current);
        current = "";
        continue;
      }
      current += char;
    }
    result.push(current);
    return result.map((value) => value.replace(/\r$/, ""));
  };

  const delimiter = detectDelimiter(lines[0]);
  const rawHeaders = parseCSVLine(lines[0], delimiter);
  const headers = rawHeaders.map((h) => normalizeHeader(h));

  const matchesAlias = (value: string, alias: string) => {
    if (!value) return false;
    if (value === alias) return true;

    const valueTokens = value.split(" ");
    const aliasTokens = alias.split(" ");

    if (aliasTokens.length === 1) {
      return valueTokens.includes(alias);
    }

    return value.includes(alias);
  };

  const findHeaderIndex = (aliases: string[]) =>
    headers.findIndex((header) =>
      aliases.some((alias) => matchesAlias(header, alias))
    );

  const normalizeMergeKeyPart = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");

  const buildMergeKey = (firstName: string, lastName: string) =>
    `${normalizeMergeKeyPart(firstName)}|${normalizeMergeKeyPart(lastName)}`;

  const nameIndex = findHeaderIndex(["nome"]);
  const lastNameIndex = findHeaderIndex(["cognome"]);
  const emailIndex = findHeaderIndex(["email", "e mail", "mail"]);

  if (nameIndex === -1 || lastNameIndex === -1) {
    return { ok: false, error: "CSV mancante di colonne richieste: Nome, Cognome" };
  }

  const phoneIndex = findHeaderIndex(["telefono", "cellulare", "cell"]);
  const tesseraIndex = findHeaderIndex(["tessera"]);
  const cfIndex = findHeaderIndex(["codice fiscale", "codicefiscale", "cf"]);
  const categoriaIndex = findHeaderIndex(["categoria", "cat"]);
  const statusIndex = findHeaderIndex(["status", "stato"]);
  const genereIndex = findHeaderIndex(["genere", "sesso"]);
  const materialeIndex = findHeaderIndex(["materiale 2026", "materiale"]);
  const spedizioneIndex = findHeaderIndex(["spedizione"]);
  const indirizzoIndex = findHeaderIndex(["indirizzo", "via"]);
  const capIndex = findHeaderIndex(["cap"]);
  const cittaIndex = findHeaderIndex(["citta", "citta"]);
  const provIndex = findHeaderIndex(["provincia", "prov"]);
  const luogoIndex = findHeaderIndex(["luogo nascita"]);
  const birthIndex = findHeaderIndex(["data nascita", "data di nascita"]);
  const notesIndex = findHeaderIndex(["note", "annotazioni"]);
  const stranieroIndex = findHeaderIndex(["straniero"]);
  const tagliaMagliaCotoneIndex = findHeaderIndex(["taglia maglia cotone", "maglia cotone"]);
  const tagliaMagliaSolarIndex = findHeaderIndex(["taglia maglia solar", "maglia solar"]);
  const tagliaMagliaPulsarIndex = findHeaderIndex(["taglia maglia pulsar", "maglia pulsar"]);
  const tagliaCanottaSolarIndex = findHeaderIndex(["taglia canotta solar", "canotta solar"]);
  const tagliaCanottaPulsarIndex = findHeaderIndex(["taglia canotta pulsar", "canotta pulsar"]);
  const tagliaFelpaSolarIndex = findHeaderIndex(["taglia felpa solar", "felpa solar"]);
  const tagliaFelpaPulsarIndex = findHeaderIndex(["taglia felpa pulsar", "felpa pulsar"]);

  const imported = [];
  const updated = [];
  const errors = [];

  const existingMembers = await db
    .select()
    .from(members)
    .where(eq(members.organizationId, orgId));

  const existingMembersByKey = new Map(
    existingMembers.map((member) => [
      buildMergeKey(member.firstName, member.lastName),
      member,
    ])
  );

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = parseCSVLine(line, delimiter);
    const getField = (index: number) => {
      if (index === -1) return null;
      const val = parts[index] ?? "";
      const trimmed = val.trim();
      return trimmed.length > 0 ? trimmed : null;
    };

    const firstName = getField(nameIndex);
    const lastName = getField(lastNameIndex);
    const rawEmail = getField(emailIndex);

    if (!firstName || !lastName) {
      errors.push(`Riga ${i + 1}: mancano Nome o Cognome`);
      continue;
    }

    try {
      const tessera = getField(tesseraIndex);
      const email = rawEmail?.trim().toLowerCase() ?? "";
      const mergeKey = buildMergeKey(firstName, lastName);
      const existingMember = existingMembersByKey.get(mergeKey);
      const nextValues = {
        firstName,
        lastName,
        email,
        phone: getField(phoneIndex) ?? null,
        tessera: tessera ?? null,
        codiceFiscale: getField(cfIndex) ?? null,
        categoria: getField(categoriaIndex) ?? null,
        straniero: getField(stranieroIndex) ?? null,
        status: getField(statusIndex) ?? null,
        genere: getField(genereIndex) ?? null,
        materiale2026Consegna: getField(materialeIndex) ?? null,
        spedizione: getField(spedizioneIndex) ?? null,
        indirizzo: getField(indirizzoIndex) ?? null,
        cap: getField(capIndex) ?? null,
        citta: getField(cittaIndex) ?? null,
        prov: getField(provIndex) ?? null,
        luogoNascita: getField(luogoIndex) ?? null,
        birthDate: normalizeDate(getField(birthIndex)),
        tagliaMagliaCotone: getField(tagliaMagliaCotoneIndex) ?? null,
        tagliaMagliaSolar: getField(tagliaMagliaSolarIndex) ?? null,
        tagliaMagliaPulsar: getField(tagliaMagliaPulsarIndex) ?? null,
        tagliaCanottaSolar: getField(tagliaCanottaSolarIndex) ?? null,
        tagliaCanottaPulsar: getField(tagliaCanottaPulsarIndex) ?? null,
        tagliaFelpaSolar: getField(tagliaFelpaSolarIndex) ?? null,
        tagliaFelpaPulsar: getField(tagliaFelpaPulsarIndex) ?? null,
        notes: getField(notesIndex) ?? null,
      };

      if (existingMember) {
        await db
          .update(members)
          .set({
            firstName,
            lastName,
            email: nextValues.email || existingMember.email,
            phone: nextValues.phone ?? existingMember.phone,
            tessera: nextValues.tessera ?? existingMember.tessera,
            codiceFiscale: nextValues.codiceFiscale ?? existingMember.codiceFiscale,
            categoria: nextValues.categoria ?? existingMember.categoria,
            straniero: nextValues.straniero ?? existingMember.straniero,
            status: nextValues.status ?? existingMember.status,
            genere: nextValues.genere ?? existingMember.genere,
            materiale2026Consegna:
              nextValues.materiale2026Consegna ?? existingMember.materiale2026Consegna,
            spedizione: nextValues.spedizione ?? existingMember.spedizione,
            indirizzo: nextValues.indirizzo ?? existingMember.indirizzo,
            cap: nextValues.cap ?? existingMember.cap,
            citta: nextValues.citta ?? existingMember.citta,
            prov: nextValues.prov ?? existingMember.prov,
            luogoNascita: nextValues.luogoNascita ?? existingMember.luogoNascita,
            birthDate: nextValues.birthDate ?? existingMember.birthDate,
            tagliaMagliaCotone:
              nextValues.tagliaMagliaCotone ?? existingMember.tagliaMagliaCotone,
            tagliaMagliaSolar:
              nextValues.tagliaMagliaSolar ?? existingMember.tagliaMagliaSolar,
            tagliaMagliaPulsar:
              nextValues.tagliaMagliaPulsar ?? existingMember.tagliaMagliaPulsar,
            tagliaCanottaSolar:
              nextValues.tagliaCanottaSolar ?? existingMember.tagliaCanottaSolar,
            tagliaCanottaPulsar:
              nextValues.tagliaCanottaPulsar ?? existingMember.tagliaCanottaPulsar,
            tagliaFelpaSolar:
              nextValues.tagliaFelpaSolar ?? existingMember.tagliaFelpaSolar,
            tagliaFelpaPulsar:
              nextValues.tagliaFelpaPulsar ?? existingMember.tagliaFelpaPulsar,
            notes: nextValues.notes ?? existingMember.notes,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(members.id, existingMember.id),
              eq(members.organizationId, orgId)
            )
          );

        const mergedMember = {
          ...existingMember,
          ...Object.fromEntries(
            Object.entries(nextValues).filter(([, value]) => value !== null)
          ),
          email: nextValues.email || existingMember.email,
        };
        existingMembersByKey.set(mergeKey, mergedMember);
        updated.push(firstName + " " + lastName);
      } else {
        const [insertedMember] = await db
          .insert(members)
          .values({
            organizationId: orgId,
            ...nextValues,
          })
          .returning();
        existingMembersByKey.set(mergeKey, insertedMember);
        imported.push(firstName + " " + lastName);
      }
    } catch (error) {
      errors.push(`Riga ${i + 1} (${firstName} ${lastName}): ${(error as Error).message}`);
    }
  }

  return {
    ok: true,
    imported: imported.length,
    updated: updated.length,
    errors: errors.length > 0 ? errors : undefined,
  };
}
