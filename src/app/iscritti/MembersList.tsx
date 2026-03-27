"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Member } from "@/lib/db/schema";
import { deleteMember, updateMember } from "@/app/actions/members";

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

export function MembersList({ members: list }: { members: Member[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profilo" | "dettagli">("profilo");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [colWidths, setColWidths] = useState<number[]>(DEFAULT_COLUMN_WIDTHS);
  const resizeRef = useRef<{
    index: number;
    startX: number;
    startWidth: number;
  } | null>(null);

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
    setPhotoPreview(current?.photoUrl ?? null);
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
      setPhotoPreview(data.url ?? null);
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

  if (list.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 py-8 text-center text-zinc-500 dark:border-zinc-600">
        Nessun iscritto. Aggiungi il primo con &quot;+ Nuovo iscritto&quot;.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="min-w-[1800px] w-full table-fixed text-left text-sm whitespace-nowrap">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
            {[
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
            ].map((label, index) => (
              <th
                key={label || "azioni"}
                style={{ width: colWidths[index] }}
                className={`group relative px-4 py-3 font-medium${
                  label ? "" : " sticky right-0 z-10 bg-zinc-50 dark:bg-zinc-800/50"
                }`}
              >
                <span>{label}</span>
                {label ? (
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      resizeRef.current = {
                        index,
                        startX: event.clientX,
                        startWidth: colWidths[index],
                      };
                      document.body.classList.add("select-none");
                    }}
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    aria-label={`Ridimensiona colonna ${label}`}
                  />
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map((m) => {
            const isEditing = editingId === m.id;
            const currentPhoto = isEditing ? photoPreview ?? m.photoUrl ?? null : null;

            return (
              <Fragment key={m.id}>
                <tr
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                >
                  <td className="px-4 py-3" style={{ width: colWidths[0] }}>
                    <button
                      type="button"
                      onClick={() => setEditingId(m.id)}
                      className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 text-[10px] font-semibold text-zinc-500 transition hover:scale-[1.02] hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 ${statusRingClass(m.status)}`}
                      aria-label={`Modifica ${m.firstName} ${m.lastName}`}
                      title="Modifica iscritto"
                    >
                      {m.photoUrl ? (
                        <img
                          src={m.photoUrl}
                          alt={`${m.firstName} ${m.lastName}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>
                          {`${m.firstName?.[0] ?? ""}${m.lastName?.[0] ?? ""}`.toUpperCase()}
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3" style={{ width: colWidths[1] }}>
                    {m.firstName} {m.lastName}
                  </td>
                  <td
                    className="px-4 py-3 text-zinc-600 dark:text-zinc-400"
                    style={{ width: colWidths[2] }}
                  >
                    {m.tessera ?? "—"}
                  </td>
                  <td
                    className="px-4 py-3 text-zinc-600 dark:text-zinc-400"
                    style={{ width: colWidths[3] }}
                  >
                    {m.codiceFiscale ?? "—"}
                  </td>
                  <td
                    className="px-4 py-3 text-zinc-600 dark:text-zinc-400"
                    style={{ width: colWidths[4] }}
                  >
                    {m.categoria ?? "—"}
                  </td>
                  <td
                    className="px-4 py-3 text-zinc-600 dark:text-zinc-400"
                    style={{ width: colWidths[5] }}
                  >
                    {m.status ?? "—"}
                  </td>
                  <td
                    className="px-4 py-3 text-zinc-600 dark:text-zinc-400"
                    style={{ width: colWidths[6] }}
                  >
                    {m.materiale2026Consegna ?? "—"}
                  </td>
                  <td
                    className="px-4 py-3 text-zinc-600 dark:text-zinc-400"
                    style={{ width: colWidths[7] }}
                  >
                    {m.spedizione ?? "—"}
                  </td>
                  <td
                    className="px-4 py-3 text-zinc-600 dark:text-zinc-400"
                    style={{ width: colWidths[8] }}
                  >
                    {m.genere ?? "—"}
                  </td>
                  <td
                    className="px-4 py-3 text-zinc-600 dark:text-zinc-400"
                    style={{ width: colWidths[9] }}
                  >
                    {m.email}
                  </td>
                  <td
                    className="px-4 py-3 text-zinc-600 dark:text-zinc-400"
                    style={{ width: colWidths[10] }}
                  >
                    {m.phone ?? "—"}
                  </td>
                  <td
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
                  </td>
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


