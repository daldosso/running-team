"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { members, payments } from "@/lib/db/schema";
import { getOrganizationId } from "@/lib/org-context";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

export type PaymentFormData = {
  memberId?: string;
  amount: string;
  currency?: string;
  description?: string;
  status?: "pending" | "completed" | "failed" | "refunded";
};

const parseCSVLine = (line: string, delimiter: string) => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];
    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
};

const normalizeHeader = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

const normalizeMemberKey = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const normalizeAmount = (value: string) => {
  const clean = value.replace(/[€\s]/g, "").trim();
  if (clean.includes(",") && clean.includes(".")) {
    return clean.replace(/\./g, "").replace(",", ".");
  }
  return clean.replace(",", ".");
};

const normalizePaymentStatus = (
  value: string
): "pending" | "completed" | "failed" | "refunded" => {
  const normalized = normalizeHeader(value);
  if (["completato", "pagato", "paid", "completed", "ok"].includes(normalized)) {
    return "completed";
  }
  if (["fallito", "failed", "errore", "ko"].includes(normalized)) {
    return "failed";
  }
  if (["rimborsato", "refunded"].includes(normalized)) {
    return "refunded";
  }
  return "pending";
};

const parsePaymentDate = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return new Date(`${trimmed}T12:00:00`);

  const italianMatch = trimmed.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if (italianMatch) {
    const [, day, month, year] = italianMatch;
    return new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T12:00:00`);
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export async function createPayment(formData: PaymentFormData) {
  const session = await getSession();
  const canManage = session?.role === "owner" || session?.role === "admin";
  if (!session || !canManage) {
    return { ok: false, error: "Non autorizzato" };
  }

  const orgId = await getOrganizationId();
  if (!orgId) return { ok: false, error: "Organizzazione non specificata" };

  await db.insert(payments).values({
    organizationId: orgId,
    memberId: formData.memberId || null,
    amount: formData.amount.replace(",", "."),
    currency: formData.currency ?? "EUR",
    description: formData.description?.trim() || null,
    status: (formData.status as "pending" | "completed" | "failed" | "refunded") ?? "pending",
    paidAt: formData.status === "completed" ? new Date() : null,
  });
  revalidatePath("/");
  revalidatePath("/pagamenti");
  return { ok: true };
}

export async function updatePaymentStatus(
  id: string,
  status: "pending" | "completed" | "failed" | "refunded"
) {
  const session = await getSession();
  const canManage = session?.role === "owner" || session?.role === "admin";
  if (!session || !canManage) {
    return { ok: false, error: "Non autorizzato" };
  }

  const orgId = await getOrganizationId();
  if (!orgId) return { ok: false, error: "Organizzazione non specificata" };

  await db
    .update(payments)
    .set({
      status,
      updatedAt: new Date(),
      ...(status === "completed" ? { paidAt: new Date() } : {}),
    })
    .where(and(eq(payments.id, id), eq(payments.organizationId, orgId)));
  revalidatePath("/");
  revalidatePath("/pagamenti");
  return { ok: true };
}

export async function deletePayment(id: string) {
  const session = await getSession();
  const canManage = session?.role === "owner" || session?.role === "admin";
  if (!session || !canManage) {
    return { ok: false, error: "Non autorizzato" };
  }

  const orgId = await getOrganizationId();
  if (!orgId) return { ok: false, error: "Organizzazione non specificata" };

  await db
    .delete(payments)
    .where(and(eq(payments.id, id), eq(payments.organizationId, orgId)));
  revalidatePath("/");
  revalidatePath("/pagamenti");
  return { ok: true };
}

export async function importPaymentsFromCSV(csvContent: string) {
  const session = await getSession();
  const canManage = session?.role === "owner" || session?.role === "admin";
  if (!session || !canManage) {
    return { ok: false, error: "Non autorizzato" };
  }

  const orgId = await getOrganizationId();
  if (!orgId) return { ok: false, error: "Organizzazione non specificata" };

  const lines = csvContent
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  if (lines.length < 2) return { ok: false, error: "CSV vuoto o non valido" };

  const delimiter = (lines[0].match(/;/g)?.length ?? 0) > (lines[0].match(/,/g)?.length ?? 0)
    ? ";"
    : ",";
  const headers = parseCSVLine(lines[0], delimiter).map(normalizeHeader);
  const findColumn = (...names: string[]) =>
    names.map(normalizeHeader).map((name) => headers.indexOf(name)).find((index) => index >= 0) ?? -1;

  const amountIndex = findColumn("importo", "amount");
  const memberIndex = findColumn("iscritto", "atleta", "runner", "member", "nome");
  const descriptionIndex = findColumn("descrizione", "description", "causale");
  const statusIndex = findColumn("stato", "status");
  const dateIndex = findColumn("data", "date", "paidAt", "pagatoIl");

  if (amountIndex < 0) {
    return { ok: false, error: "CSV mancante della colonna Importo" };
  }

  const memberRows = await db
    .select({
      id: members.id,
      firstName: members.firstName,
      lastName: members.lastName,
      email: members.email,
    })
    .from(members)
    .where(eq(members.organizationId, orgId));

  const memberMap = new Map<string, string>();
  for (const member of memberRows) {
    memberMap.set(normalizeMemberKey(`${member.firstName} ${member.lastName}`), member.id);
    memberMap.set(normalizeMemberKey(`${member.lastName} ${member.firstName}`), member.id);
    if (member.email) memberMap.set(normalizeMemberKey(member.email), member.id);
  }

  const rowsToInsert: (typeof payments.$inferInsert)[] = [];
  const errors: string[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const values = parseCSVLine(lines[lineIndex], delimiter);
    const amount = normalizeAmount(values[amountIndex] ?? "");
    if (!amount || Number.isNaN(Number(amount))) {
      errors.push(`Riga ${lineIndex + 1}: importo non valido`);
      continue;
    }

    const memberLabel = memberIndex >= 0 ? values[memberIndex] ?? "" : "";
    const memberId = memberLabel ? memberMap.get(normalizeMemberKey(memberLabel)) ?? null : null;
    if (memberLabel && !memberId) {
      errors.push(`Riga ${lineIndex + 1}: iscritto non trovato (${memberLabel})`);
    }

    const status = statusIndex >= 0
      ? normalizePaymentStatus(values[statusIndex] ?? "")
      : "pending";
    const paymentDate = dateIndex >= 0 ? parsePaymentDate(values[dateIndex] ?? "") : null;

    rowsToInsert.push({
      organizationId: orgId,
      memberId,
      amount,
      currency: "EUR",
      description: descriptionIndex >= 0 ? (values[descriptionIndex]?.trim() || null) : null,
      status,
      paidAt: paymentDate ?? (status === "completed" ? new Date() : null),
      createdAt: paymentDate ?? undefined,
    });
  }

  if (rowsToInsert.length === 0) {
    return { ok: false, error: errors[0] ?? "Nessun pagamento valido da importare" };
  }

  await db.insert(payments).values(rowsToInsert);
  revalidatePath("/");
  revalidatePath("/pagamenti");

  return {
    ok: true,
    imported: rowsToInsert.length,
    errors,
  };
}
