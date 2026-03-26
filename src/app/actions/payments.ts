"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { payments } from "@/lib/db/schema";
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
