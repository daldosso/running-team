"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  organizationTablePreferences,
  userTablePreferences,
} from "@/lib/db/schema";
import { getOrganizationId } from "@/lib/org-context";
import { getSession } from "@/lib/auth";

export type TablePreferences = {
  columnOrder?: number[];
  columnWidths?: number[];
};

const parseNumericArray = (value?: string | null) => {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return undefined;
    const normalized = parsed
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item));
    return normalized.length > 0 ? normalized : undefined;
  } catch {
    return undefined;
  }
};

export async function getTablePreferences(
  tableKey: string
): Promise<TablePreferences | null> {
  const session = await getSession();
  const orgId = await getOrganizationId();
  if (!orgId || !session?.userId) return null;

  const [row] = await db
    .select()
    .from(userTablePreferences)
    .where(
      and(
        eq(userTablePreferences.organizationId, orgId),
        eq(userTablePreferences.userId, session.userId),
        eq(userTablePreferences.tableKey, tableKey)
      )
    );

  if (!row) return null;

  return {
    columnOrder: parseNumericArray(row.columnOrder),
    columnWidths: parseNumericArray(row.columnWidths),
  };
}

export async function saveTablePreferences(
  tableKey: string,
  preferences: TablePreferences
) {
  const session = await getSession();
  const orgId = await getOrganizationId();
  if (!orgId) return { ok: false, skipped: true };

  const columnOrder = preferences.columnOrder
    ? JSON.stringify(preferences.columnOrder)
    : null;
  const columnWidths = preferences.columnWidths
    ? JSON.stringify(preferences.columnWidths)
    : null;

  if (session?.userId) {
    await db
      .insert(userTablePreferences)
      .values({
        organizationId: orgId,
        userId: session.userId,
        tableKey,
        columnOrder,
        columnWidths,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          userTablePreferences.organizationId,
          userTablePreferences.userId,
          userTablePreferences.tableKey,
        ],
        set: {
          columnOrder,
          columnWidths,
          updatedAt: new Date(),
        },
      });
  } else {
    await db
      .insert(organizationTablePreferences)
      .values({
        organizationId: orgId,
        tableKey,
        columnOrder,
        columnWidths,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          organizationTablePreferences.organizationId,
          organizationTablePreferences.tableKey,
        ],
        set: {
          columnOrder,
          columnWidths,
          updatedAt: new Date(),
        },
      });
  }

  return { ok: true };
}

export async function getTablePreferencesWithFallback(
  tableKey: string
): Promise<TablePreferences | null> {
  const session = await getSession();
  const orgId = await getOrganizationId();
  if (!orgId) return null;

  if (session?.userId) {
    const [row] = await db
      .select()
      .from(userTablePreferences)
      .where(
        and(
          eq(userTablePreferences.organizationId, orgId),
          eq(userTablePreferences.userId, session.userId),
          eq(userTablePreferences.tableKey, tableKey)
        )
      );
    if (row) {
      return {
        columnOrder: parseNumericArray(row.columnOrder),
        columnWidths: parseNumericArray(row.columnWidths),
      };
    }
  }

  const [orgRow] = await db
    .select()
    .from(organizationTablePreferences)
    .where(
      and(
        eq(organizationTablePreferences.organizationId, orgId),
        eq(organizationTablePreferences.tableKey, tableKey)
      )
    );
  if (!orgRow) return null;
  return {
    columnOrder: parseNumericArray(orgRow.columnOrder),
    columnWidths: parseNumericArray(orgRow.columnWidths),
  };
}

export async function clearTablePreferences(tableKey: string) {
  const session = await getSession();
  const orgId = await getOrganizationId();
  if (!orgId) return { ok: false, skipped: true };

  if (session?.userId) {
    await db
      .delete(userTablePreferences)
      .where(
        and(
          eq(userTablePreferences.organizationId, orgId),
          eq(userTablePreferences.userId, session.userId),
          eq(userTablePreferences.tableKey, tableKey)
        )
      );
  } else {
    await db
      .delete(organizationTablePreferences)
      .where(
        and(
          eq(organizationTablePreferences.organizationId, orgId),
          eq(organizationTablePreferences.tableKey, tableKey)
        )
      );
  }

  return { ok: true };
}
