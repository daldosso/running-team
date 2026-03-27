"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Member } from "@/lib/db/schema";
import { deleteMember, updateMember } from "@/app/actions/members";
import {
  clearTablePreferences,
  saveTablePreferences,
} from "@/app/actions/table-preferences";

const COLUMN_LABELS = [
  "",
  "Nome",
  "Tessera",
  "Codice Fiscale",
  "Cat.",
  "Status",
  "Materiale 2026",
  "Spedizione",
  "Genere",
  "Email",
  "Telefono",
  "",
];

const DEFAULT_COLUMN_WIDTHS = [
  64, // Avatar
  200, // Nome
  110, // Tessera
  190, // Codice Fiscale
  80, // Cat.
  140, // Status
  170, // Materiale 2026
  130, // Spedizione
  90, // Genere
  220, // Email
  130, // Telefono
  80, // Azioni
];

const normalizeColumnOrder = (order?: number[]) => {
  const base = COLUMN_LABELS.map((_, index) => index);
  if (!order || order.length === 0) return base;
  const filtered = order.filter(
    (value) =>
      Number.isFinite(value) &&
      Number.isInteger(value) &&
      value >= 0 &&
      value < base.length
  );
  const withoutFixed = filtered.filter((value) => value !== 0 && value !== 11);
  const used = new Set(withoutFixed);
  const normalized = [0, ...withoutFixed];
  base.forEach((index) => {
    if (index === 0 || index === 11) return;
    if (!used.has(index)) normalized.push(index);
  });
  normalized.push(11);
  return normalized;
};

const normalizeColumnWidths = (widths?: number[]) => {
  const next = DEFAULT_COLUMN_WIDTHS.map((value, index) => {
    const candidate = widths?.[index];
    if (typeof candidate !== "number" || !Number.isFinite(candidate)) return value;
    return Math.max(80, Math.round(candidate));
  });
  return next;
};

const getSortableValue = (member: Member, index: number) => {
  switch (index) {
    case 1:
      return `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim();
    case 2:
      return member.tessera ?? "";
    case 3:
      return member.codiceFiscale ?? "";
    case 4:
      return member.categoria ?? "";
    case 5:
      return member.status ?? "";
    case 6:
      return member.materiale2026Consegna ?? "";
    case 7:
      return member.spedizione ?? "";
    case 8:
      return member.genere ?? "";
    case 9:
      return member.email ?? "";
    case 10:
      return member.phone ?? "";
    default:
      return "";
  }
};

export function MembersList({
  members: list,
  initialColumnOrder,
  initialColumnWidths,
  initialSortColumn,
  initialSortDirection,
  initialSearchQuery,
}: {
  members: Member[];
  initialColumnOrder?: number[];
  initialColumnWidths?: number[];
  initialSortColumn?: number | null;
  initialSortDirection?: "asc" | "desc";
  initialSearchQuery?: string;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profilo" | "dettagli">("profilo");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [colWidths, setColWidths] = useState<number[]>(
    () => normalizeColumnWidths(initialColumnWidths)
  );
  const [columnOrder, setColumnOrder] = useState<number[]>(
    () => normalizeColumnOrder(initialColumnOrder)
  );
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [sortState, setSortState] = useState<{
    index: number | null;
    direction: "asc" | "desc";
  }>({
    index: typeof initialSortColumn === "number" ? initialSortColumn : null,
    direction: initialSortDirection ?? "asc",
  });
  const [searchTerm, setSearchTerm] = useState(initialSearchQuery ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(
    initialSearchQuery ?? ""
  );
  const resizeRef = useRef<{
    index: number;
    startX: number;
    startWidth: number;
  } | null>(null);
  const dragRef = useRef<number | null>(null);
  const didMountRef = useRef(false);

  useEffect(() => {
    didMountRef.current = true;
  }, []);

  useEffect(() => {
    if (!didMountRef.current) return;
    const timeout = window.setTimeout(() => {
      void saveTablePreferences("iscritti", {
        columnOrder,
        columnWidths: colWidths,
        sortColumn: sortState.index,
        sortDirection: sortState.direction,
        searchQuery: searchTerm,
      });
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [columnOrder, colWidths, sortState, searchTerm]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  const filteredList = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return list;
    return list.filter((member) => {
      const fields = [
        member.firstName,
        member.lastName,
        member.email,
        member.phone,
        member.tessera,
        member.codiceFiscale,
        member.categoria,
        member.status,
        member.materiale2026Consegna,
        member.spedizione,
        member.genere,
        member.luogoNascita,
        member.indirizzo,
        member.cap,
        member.citta,
        member.prov,
        member.notes,
      ];
      return fields.some((value) =>
        (value ?? "").toLowerCase().includes(query)
      );
    });
  }, [list, searchTerm]);

  const sortedList = useMemo(() => {
    if (sortState.index === null) return filteredList;
    const sortIndex = sortState.index;
    const next = [...filteredList];
    const direction = sortState.direction === "asc" ? 1 : -1;
    next.sort((a, b) => {
      const valueA = getSortableValue(a, sortIndex);
      const valueB = getSortableValue(b, sortIndex);
      return valueA.localeCompare(valueB, "it", { sensitivity: "base" }) * direction;
    });
    return next;
  }, [filteredList, sortState]);

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      if (!resizeRef.current) return;
      const { index, startX, startWidth } = resizeRef.current;
      const delta = event.clientX - startX;
      const nextWidth = Math.max(80, startWidth + delta);
      setColWidths((prev) => {
        if (prev[index] === nextWidth) return prev;
        const next = [...prev];
        next[index] = nextWidth;
        return next;
      });
    };

    const handleUp = () => {
      resizeRef.current = null;
      document.body.classList.remove("select-none");
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, []);

  useEffect(() => {
    if (!editingId) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setEditingId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingId]);

  useEffect(() => {
    if (!editingId) return;
    const current = list.find((m) => m.id === editingId);
    setActiveTab("profilo");
    setPhotoPreview(current?.photoUrl ? `/api/members/photo/${current.id}` : null);
    setPhotoError(null);
  }, [editingId, list]);

  const uploadMemberPhoto = async (memberId: string, file: File) => {
    setPhotoUploading(true);
    setPhotoError(null);
    try {
      const formData = new FormData();
      formData.set("memberId", memberId);
      formData.set("file", file);
      const res = await fetch("/api/members/photo", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };
      if (!res.ok) {
        setPhotoError(data.error || "Upload fallito");
        return;
      }
      setPhotoPreview(
        data.url ? `/api/members/photo/${memberId}?t=${Date.now()}` : null
      );
      router.refresh();
    } catch {
      setPhotoError("Upload fallito");
    } finally {
      setPhotoUploading(false);
    }
  };

  const removeMemberPhoto = async (memberId: string) => {
    setPhotoUploading(true);
    setPhotoError(null);
    try {
      const res = await fetch("/api/members/photo", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setPhotoError(data.error || "Operazione non riuscita");
        return;
      }
      setPhotoPreview(null);
      router.refresh();
    } catch {
      setPhotoError("Operazione non riuscita");
    } finally {
      setPhotoUploading(false);
    }
  };

  const statusRingClass = (status?: string | null) => {
    const normalized = status?.trim().toLowerCase();
    switch (normalized) {
      case "attivo":
      case "attiva":
      case "active":
        return "ring-2 ring-emerald-500/70";
      case "in sospeso":
      case "pending":
        return "ring-2 ring-amber-500/70";
      case "scaduto":
      case "scaduta":
      case "inactive":
        return "ring-2 ring-rose-500/70";
      default:
        return "ring-1 ring-zinc-200 dark:ring-zinc-700";
    }
  };

  const isDraggableColumn = (index: number) => index !== 0 && index !== 11;
  const isDroppableColumn = (index: number) => index !== 0 && index !== 11;
  const isSortableColumn = (index: number) => index >= 1 && index <= 10;

  if (list.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 py-8 text-center text-zinc-500 dark:border-zinc-600">
        Nessun iscritto. Aggiungi il primo con &quot;+ Nuovo iscritto&quot;.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-2 border-b border-zinc-200 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cerca iscritti..."
            className="h-8 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-700 shadow-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 sm:w-64"
          />
          {searchTerm ? (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="rounded-md px-2 py-1 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              Pulisci
            </button>
          ) : null}
          <span className="text-zinc-400">
            {filteredList.length} / {list.length} iscritti
          </span>
        </div>
        <button
          type="button"
          onClick={async () => {
            await clearTablePreferences("iscritti");
            setColumnOrder(normalizeColumnOrder(undefined));
            setColWidths(normalizeColumnWidths(undefined));
            setSortState({ index: null, direction: "asc" });
            setSearchTerm("");
          }}
          className="rounded-md px-2 py-1 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
        >
          Ripristina colonne
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[1800px] w-full table-fixed text-left text-sm whitespace-nowrap">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
            {columnOrder.map((colIndex) => {
              const label = COLUMN_LABELS[colIndex];
              const isSticky = colIndex === 11;
              const isDraggable = isDraggableColumn(colIndex);
              const isDroppable = isDroppableColumn(colIndex);
              const isSortable = isSortableColumn(colIndex);
              const isSorted = sortState.index === colIndex;
              const isDragOver = dragOverIndex === colIndex && isDroppable;
              return (
                <th
                  key={`col-${colIndex}`}
                  style={{ width: colWidths[colIndex] }}
                  draggable={isDraggable}
                  onDragStart={(event) => {
                    if (!isDraggable) return;
                    dragRef.current = colIndex;
                    setDragOverIndex(null);
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", String(colIndex));
                  }}
                  onDragOver={(event) => {
                    if (!isDroppable) return;
                    if (dragRef.current === null || dragRef.current === colIndex) return;
                    event.preventDefault();
                    setDragOverIndex(colIndex);
                  }}
                  onDragLeave={() => {
                    if (dragOverIndex === colIndex) setDragOverIndex(null);
                  }}
                  onDrop={(event) => {
                    if (!isDroppable) return;
                    event.preventDefault();
                    const from = dragRef.current;
                    if (from === null || from === colIndex) return;
                    setColumnOrder((prev) => {
                      if (!prev.includes(from)) return prev;
                      const next = prev.filter((i) => i !== from);
                      const targetPos = next.indexOf(colIndex);
                      if (targetPos === -1) return prev;
                      next.splice(targetPos, 0, from);
                      return next;
                    });
                    dragRef.current = null;
                    setDragOverIndex(null);
                  }}
                  onDragEnd={() => {
                    dragRef.current = null;
                    setDragOverIndex(null);
                  }}
                  className={`group relative px-4 py-3 font-medium${
                    isSticky ? " sticky right-0 z-10 bg-zinc-50 dark:bg-zinc-800/50" : ""
                  }${isDraggable ? " cursor-grab" : ""}${
                    isDragOver ? " ring-2 ring-inset ring-zinc-400/60" : ""
                  }`}
                >
                  {isSortable ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSortState((prev) => {
                          if (prev.index === colIndex) {
                            return {
                              index: colIndex,
                              direction: prev.direction === "asc" ? "desc" : "asc",
                            };
                          }
                          return { index: colIndex, direction: "asc" };
                        });
                      }}
                      className="inline-flex items-center gap-1 text-left"
                    >
                      <span className="select-none">{label}</span>
                      <span className="text-[10px] text-zinc-400">
                        {isSorted ? (sortState.direction === "asc" ? "▲" : "▼") : "↕"}
                      </span>
                    </button>
                  ) : (
                    <span className="select-none">{label}</span>
                  )}
                  {label ? (
                    <button
                      type="button"
                      draggable={false}
                      onMouseDown={(event) => {
                        resizeRef.current = {
                          index: colIndex,
                          startX: event.clientX,
                          startWidth: colWidths[colIndex],
                        };
                        document.body.classList.add("select-none");
                      }}
                      className="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                      aria-label={`Ridimensiona colonna ${label}`}
                    />
                  ) : null}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedList.map((m) => {
            const isEditing = editingId === m.id;
            const serverPhoto = m.photoUrl ? `/api/members/photo/${m.id}` : null;
            const currentPhoto = isEditing ? photoPreview ?? serverPhoto : serverPhoto;

            const cells = [
              <td key={`avatar-${m.id}`} className="px-4 py-3" style={{ width: colWidths[0] }}>
                <button
                  type="button"
                  onClick={() => setEditingId(m.id)}
                  className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 text-[10px] font-semibold text-zinc-500 transition hover:scale-[1.02] hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 ${statusRingClass(
                    m.status
                  )}`}
                  aria-label={`Modifica ${m.firstName} ${m.lastName}`}
                  title="Modifica iscritto"
                >
                  {currentPhoto ? (
                    <img
                      src={currentPhoto}
                      alt={`${m.firstName} ${m.lastName}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>
                      {`${m.firstName?.[0] ?? ""}${m.lastName?.[0] ?? ""}`.toUpperCase()}
                    </span>
                  )}
                </button>
              </td>,
              <td key={`nome-${m.id}`} className="px-4 py-3" style={{ width: colWidths[1] }}>
                {m.firstName} {m.lastName}
              </td>,
              <td
                key={`tessera-${m.id}`}
                className="px-4 py-3 text-zinc-600 dark:text-zinc-400"
                style={{ width: colWidths[2] }}
              >
                {m.tessera ?? "—"}
              </td>,
              <td
                key={`cf-${m.id}`}
                className="px-4 py-3 text-zinc-600 dark:text-zinc-400"
                style={{ width: colWidths[3] }}
              >
                {m.codiceFiscale ?? "—"}
              </td>,
              <td
                key={`cat-${m.id}`}
                className="px-4 py-3 text-zinc-600 dark:text-zinc-400"
                style={{ width: colWidths[4] }}
              >
                {m.categoria ?? "—"}
              </td>,
              <td
                key={`status-${m.id}`}
                className="px-4 py-3 text-zinc-600 dark:text-zinc-400"
                style={{ width: colWidths[5] }}
              >
                {m.status ?? "—"}
              </td>,
              <td
                key={`materiale-${m.id}`}
                className="px-4 py-3 text-zinc-600 dark:text-zinc-400"
                style={{ width: colWidths[6] }}
              >
                {m.materiale2026Consegna ?? "—"}
              </td>,
              <td
                key={`spedizione-${m.id}`}
                className="px-4 py-3 text-zinc-600 dark:text-zinc-400"
                style={{ width: colWidths[7] }}
              >
                {m.spedizione ?? "—"}
              </td>,
              <td
                key={`genere-${m.id}`}
                className="px-4 py-3 text-zinc-600 dark:text-zinc-400"
                style={{ width: colWidths[8] }}
              >
                {m.genere ?? "—"}
              </td>,
              <td
                key={`email-${m.id}`}
                className="px-4 py-3 text-zinc-600 dark:text-zinc-400"
                style={{ width: colWidths[9] }}
              >
                {m.email}
              </td>,
              <td
                key={`telefono-${m.id}`}
                className="px-4 py-3 text-zinc-600 dark:text-zinc-400"
                style={{ width: colWidths[10] }}
              >
                {m.phone ?? "—"}
              </td>,
              <td
                key={`azioni-${m.id}`}
                className="sticky right-0 z-10 bg-white px-4 py-3 dark:bg-zinc-900"
                style={{ width: colWidths[11] }}
              >
                {!isEditing ? (
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingId(m.id)}
                      className="rounded-md p-1 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-white"
                      aria-label="Modifica iscritto"
                      title="Modifica"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </button>
                    <form
                      action={async () => {
                        await deleteMember(m.id);
                      }}
                      onSubmit={(e) => {
                        if (!confirm("Eliminare questo iscritto?")) e.preventDefault();
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-md p-1 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                        aria-label="Elimina iscritto"
                        title="Elimina"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="M6 6l1 14h10l1-14" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                        </svg>
                      </button>
                    </form>
                  </div>
                ) : (
                  <span className="text-xs text-zinc-500">In modifica</span>
                )}
              </td>,
            ];

            return (
              <Fragment key={m.id}>
                <tr
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                >
                  {columnOrder.map((colIndex) => cells[colIndex])}
                </tr>
                {isEditing && (
                  <tr>
                    <td colSpan={11} className="p-0">
                      <div className="fixed inset-0 z-50">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="absolute inset-0 bg-black/50"
                          aria-label="Chiudi modifica iscritto"
                        />
                        <div className="absolute inset-x-0 top-6 mx-auto w-full max-w-5xl px-4 sm:px-6">
                          <form
                            action={async (fd) => {
                              await updateMember(m.id, {
                            firstName: fd.get("firstName") as string,
                            lastName: fd.get("lastName") as string,
                            email: fd.get("email") as string,
                            phone: (fd.get("phone") as string) || undefined,
                            birthDate: (fd.get("birthDate") as string) || undefined,
                            tessera: (fd.get("tessera") as string) || undefined,
                            luogoNascita: (fd.get("luogoNascita") as string) || undefined,
                            codiceFiscale: (fd.get("codiceFiscale") as string) || undefined,
                            categoria: (fd.get("categoria") as string) || undefined,
                            straniero: (fd.get("straniero") as string) || undefined,
                            indirizzo: (fd.get("indirizzo") as string) || undefined,
                            cap: (fd.get("cap") as string) || undefined,
                            citta: (fd.get("citta") as string) || undefined,
                            prov: (fd.get("prov") as string) || undefined,
                            status: (fd.get("status") as string) || undefined,
                            materiale2026Consegna:
                              (fd.get("materiale2026Consegna") as string) || undefined,
                            spedizione: (fd.get("spedizione") as string) || undefined,
                            genere: (fd.get("genere") as string) || undefined,
                            tagliaMagliaCotone:
                              (fd.get("tagliaMagliaCotone") as string) || undefined,
                            tagliaMagliaSolar:
                              (fd.get("tagliaMagliaSolar") as string) || undefined,
                            tagliaMagliaPulsar:
                              (fd.get("tagliaMagliaPulsar") as string) || undefined,
                            tagliaCanottaSolar:
                              (fd.get("tagliaCanottaSolar") as string) || undefined,
                            tagliaCanottaPulsar:
                              (fd.get("tagliaCanottaPulsar") as string) || undefined,
                            tagliaFelpaSolar:
                              (fd.get("tagliaFelpaSolar") as string) || undefined,
                            tagliaFelpaPulsar:
                              (fd.get("tagliaFelpaPulsar") as string) || undefined,
                            notes: (fd.get("notes") as string) || undefined,
                              });
                              setEditingId(null);
                            }}
                            className="relative mx-auto max-h-[80vh] w-full overflow-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:p-8"
                          >
                            <div className="mb-4 flex items-start justify-between">
                              <div>
                                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                  Modifica iscritto
                                </p>
                                <p className="text-xs text-zinc-500">
                                  {m.firstName} {m.lastName}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                aria-label="Chiudi"
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M6 6l12 12" />
                                  <path d="M18 6l-12 12" />
                                </svg>
                              </button>
                            </div>
                                                                            <div className="mb-6 flex gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-700">
                              <button
                                type="button"
                                onClick={() => setActiveTab("profilo")}
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  activeTab === "profilo"
                                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-300 dark:hover:text-white"
                                }`}
                              >
                                Profilo
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveTab("dettagli")}
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  activeTab === "dettagli"
                                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-300 dark:hover:text-white"
                                }`}
                              >
                                Dettagli
                              </button>
                            </div>

                            {activeTab === "profilo" ? (
                              <div className="space-y-5">
                                <div className="grid gap-6 md:grid-cols-[190px_1fr]">
                                  <div>
                                    <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800">
                                      {currentPhoto ? (
                                        <img
                                          src={currentPhoto}
                                          alt={`Foto ${m.firstName} ${m.lastName}`}
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <span>Nessuna foto</span>
                                      )}
                                    </div>
                                    <div className="mt-3 space-y-2">
                                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                        Immagine iscritto
                                      </label>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(event) => {
                                          const file = event.target.files?.[0];
                                          if (file) void uploadMemberPhoto(m.id, file);
                                          event.currentTarget.value = "";
                                        }}
                                        className="block w-full text-xs text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-200 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-zinc-800 hover:file:bg-zinc-300 dark:text-zinc-300 dark:file:bg-zinc-700 dark:file:text-zinc-100 dark:hover:file:bg-zinc-600"
                                      />
                                      {photoError && (
                                        <p className="text-xs text-red-600 dark:text-red-400">{photoError}</p>
                                      )}
                                      <div className="flex gap-2">
                                        {currentPhoto && (
                                          <button
                                            type="button"
                                            onClick={() => void removeMemberPhoto(m.id)}
                                            disabled={photoUploading}
                                            className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
                                          >
                                            Rimuovi foto
                                          </button>
                                        )}
                                        {photoUploading && (
                                          <span className="text-xs text-zinc-500">Aggiornamento…</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-5">
                                    <div className="grid gap-5 md:grid-cols-2">
                                      <div>
                                        <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                          Nome
                                        </label>
                                        <input
                                          name="firstName"
                                          required
                                          defaultValue={m.firstName}
                                          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                                        />
                                      </div>
                                      <div>
                                        <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                          Cognome
                                        </label>
                                        <input
                                          name="lastName"
                                          required
                                          defaultValue={m.lastName}
                                          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                        Email
                                      </label>
                                      <input
                                        name="email"
                                        type="email"
                                        required
                                        defaultValue={m.email}
                                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                                      />
                                    </div>
                                    <div className="grid gap-5 md:grid-cols-2">
                                      <div>
                                        <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                          Telefono
                                        </label>
                                        <input
                                          name="phone"
                                          type="tel"
                                          defaultValue={m.phone ?? ""}
                                          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                                        />
                                      </div>
                                      <div>
                                        <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                          Data di nascita
                                        </label>
                                        <input
                                          name="birthDate"
                                          type="date"
                                          defaultValue={m.birthDate ?? ""}
                                          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="grid gap-5 md:grid-cols-2">
                                  <div>
                                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                      Tessera
                                    </label>
                                    <input
                                      name="tessera"
                                      defaultValue={m.tessera ?? ""}
                                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                      Codice Fiscale
                                    </label>
                                    <input
                                      name="codiceFiscale"
                                      defaultValue={m.codiceFiscale ?? ""}
                                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                                    />
                                  </div>
                                </div>
                                <div className="grid gap-5 md:grid-cols-2">
                                  <div>
                                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                      Luogo nascita
                                    </label>
                                    <input
                                      name="luogoNascita"
                                      defaultValue={m.luogoNascita ?? ""}
                                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                      Categoria (Cat.)
                                    </label>
                                    <input
                                      name="categoria"
                                      defaultValue={m.categoria ?? ""}
                                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                                    />
                                  </div>
                                </div>
                                <div className="grid gap-5 md:grid-cols-2">
                                  <div>
                                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                      Straniero
                                    </label>
                                    <input
                                      name="straniero"
                                      defaultValue={m.straniero ?? ""}
                                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                      Genere
                                    </label>
                                    <input
                                      name="genere"
                                      defaultValue={m.genere ?? ""}
                                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-5">
                                <div className="grid gap-5 md:grid-cols-2">
                                  <div>
                                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                      Status
                                    </label>
                                    <input
                                      name="status"
                                      defaultValue={m.status ?? ""}
                                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                      Materiale 2026 consegnato
                                    </label>
                                    <input
                                      name="materiale2026Consegna"
                                      defaultValue={m.materiale2026Consegna ?? ""}
                                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                                    />
                                  </div>
                                </div>
                                <div className="grid gap-5 md:grid-cols-2">
                                  <div>
                                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                      Spedizione
                                    </label>
                                    <input
                                      name="spedizione"
                                      defaultValue={m.spedizione ?? ""}
                                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                      Indirizzo
                                    </label>
                                    <input
                                      name="indirizzo"
                                      defaultValue={m.indirizzo ?? ""}
                                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                                    />
                                  </div>
                                </div>
                                <div className="grid gap-5 md:grid-cols-3">
                                  <div>
                                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                      CAP
                                    </label>
                                    <input
                                      name="cap"
                                      defaultValue={m.cap ?? ""}
                                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                      Città
                                    </label>
                                    <input
                                      name="citta"
                                      defaultValue={m.citta ?? ""}
                                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                      Prov.
                                    </label>
                                    <input
                                      name="prov"
                                      defaultValue={m.prov ?? ""}
                                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                                    />
                                  </div>
                                </div>

                                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
                                  <p className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                    Taglie
                                  </p>
                                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                                    <div>
                                      <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                        Maglia cotone
                                      </label>
                                      <input
                                        name="tagliaMagliaCotone"
                                        defaultValue={m.tagliaMagliaCotone ?? ""}
                                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                        Maglia Solar
                                      </label>
                                      <input
                                        name="tagliaMagliaSolar"
                                        defaultValue={m.tagliaMagliaSolar ?? ""}
                                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                        Maglia Pulsar
                                      </label>
                                      <input
                                        name="tagliaMagliaPulsar"
                                        defaultValue={m.tagliaMagliaPulsar ?? ""}
                                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                        Canotta Solar
                                      </label>
                                      <input
                                        name="tagliaCanottaSolar"
                                        defaultValue={m.tagliaCanottaSolar ?? ""}
                                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                        Canotta Pulsar
                                      </label>
                                      <input
                                        name="tagliaCanottaPulsar"
                                        defaultValue={m.tagliaCanottaPulsar ?? ""}
                                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                        Felpa Solar
                                      </label>
                                      <input
                                        name="tagliaFelpaSolar"
                                        defaultValue={m.tagliaFelpaSolar ?? ""}
                                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                        Felpa Pulsar
                                      </label>
                                      <input
                                        name="tagliaFelpaPulsar"
                                        defaultValue={m.tagliaFelpaPulsar ?? ""}
                                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                    Note
                                  </label>
                                  <textarea
                                    name="notes"
                                    rows={2}
                                    defaultValue={m.notes ?? ""}
                                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                                  />
                                </div>
                              </div>
                            )}
                            <div className="mt-5 flex gap-2">
                              <button
                                type="submit"
                                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                              >
                                Salva
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-600"
                              >
                                Annulla
                              </button>
                            </div>
                      </form>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}


