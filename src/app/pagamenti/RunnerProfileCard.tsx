"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { saveRunnerProfile } from "@/app/actions/runner-profile";

type RunnerProfile = {
  memberId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  birthDate: string | null;
  luogoNascita: string | null;
  codiceFiscale: string | null;
  tessera: string | null;
  categoria: string | null;
  indirizzo: string | null;
  cap: string | null;
  citta: string | null;
  prov: string | null;
  notes: string | null;
  photoUrl: string | null;
};

export function RunnerProfileCard({ profile }: { profile: RunnerProfile }) {
  const router = useRouter();
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    profile.memberId && profile.photoUrl ? `/api/members/photo/${profile.memberId}` : null
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    if (!profile.memberId) {
      setError("Salva prima le informazioni del profilo, poi carica la foto.");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("memberId", profile.memberId);
      formData.set("file", file);
      const res = await fetch("/api/members/photo", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };
      if (!res.ok) {
        setError(data.error || "Upload fallito");
        return;
      }
      setPhotoPreview(
        data.url ? `/api/members/photo/${profile.memberId}?t=${Date.now()}` : null
      );
    } catch {
      setError("Upload fallito");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!profile.memberId) return;

    setUploading(true);
    setError(null);
    try {
      const res = await fetch("/api/members/photo", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: profile.memberId }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error || "Operazione non riuscita");
        return;
      }
      setPhotoPreview(null);
    } catch {
      setError("Operazione non riuscita");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
            {photoPreview ? (
              <Image
                src={photoPreview}
                alt={`${profile.firstName} ${profile.lastName}`}
                width={64}
                height={64}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-zinc-500 dark:text-zinc-300">
                {`${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {profile.firstName} {profile.lastName}
            </p>
            <p className="text-xs text-zinc-500">{profile.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleUpload(file);
                event.currentTarget.value = "";
              }}
            />
            {uploading ? "Caricamento..." : "Carica foto"}
          </label>
          {photoPreview && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Rimuovi
            </button>
          )}
        </div>
      </div>
      {error && <p className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p>}
      {message && <p className="mt-3 text-xs text-green-600 dark:text-green-400">{message}</p>}
      <p className="mt-3 text-xs text-zinc-500">
        Formati supportati: JPG, PNG, HEIC. Dimensione massima 4MB.
      </p>

      <form
        action={async (fd) => {
          setSaving(true);
          setError(null);
          setMessage(null);
          const result = await saveRunnerProfile({
            firstName: (fd.get("firstName") as string) || "",
            lastName: (fd.get("lastName") as string) || "",
            email: (fd.get("email") as string) || "",
            phone: (fd.get("phone") as string) || undefined,
            birthDate: (fd.get("birthDate") as string) || undefined,
            luogoNascita: (fd.get("luogoNascita") as string) || undefined,
            codiceFiscale: (fd.get("codiceFiscale") as string) || undefined,
            tessera: (fd.get("tessera") as string) || undefined,
            categoria: (fd.get("categoria") as string) || undefined,
            indirizzo: (fd.get("indirizzo") as string) || undefined,
            cap: (fd.get("cap") as string) || undefined,
            citta: (fd.get("citta") as string) || undefined,
            prov: (fd.get("prov") as string) || undefined,
            notes: (fd.get("notes") as string) || undefined,
          });
          setSaving(false);
          if (!result.ok) {
            setError(result.error ?? "Salvataggio non riuscito");
            return;
          }
          setMessage("Profilo salvato.");
          router.refresh();
        }}
        className="mt-6 grid gap-4 sm:grid-cols-2"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Nome
          </label>
          <input
            name="firstName"
            required
            defaultValue={profile.firstName}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Cognome
          </label>
          <input
            name="lastName"
            required
            defaultValue={profile.lastName}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
          </label>
          <input
            name="email"
            type="email"
            required
            defaultValue={profile.email}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Telefono
          </label>
          <input
            name="phone"
            defaultValue={profile.phone ?? ""}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Data di nascita
          </label>
          <input
            name="birthDate"
            type="date"
            defaultValue={profile.birthDate ?? ""}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Luogo nascita
          </label>
          <input
            name="luogoNascita"
            defaultValue={profile.luogoNascita ?? ""}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Codice fiscale
          </label>
          <input
            name="codiceFiscale"
            defaultValue={profile.codiceFiscale ?? ""}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Tessera
          </label>
          <input
            name="tessera"
            defaultValue={profile.tessera ?? ""}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Categoria
          </label>
          <input
            name="categoria"
            defaultValue={profile.categoria ?? ""}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Indirizzo
          </label>
          <input
            name="indirizzo"
            defaultValue={profile.indirizzo ?? ""}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            CAP
          </label>
          <input
            name="cap"
            defaultValue={profile.cap ?? ""}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Città
          </label>
          <input
            name="citta"
            defaultValue={profile.citta ?? ""}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Provincia
          </label>
          <input
            name="prov"
            defaultValue={profile.prov ?? ""}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Note
          </label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={profile.notes ?? ""}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {saving ? "Salvataggio..." : "Salva profilo"}
          </button>
        </div>
      </form>
    </div>
  );
}
