"use client";

import { useState } from "react";

type RunnerProfile = {
  memberId: string;
  firstName: string;
  lastName: string;
  email: string;
  photoUrl: string | null;
};

export function RunnerProfileCard({ profile }: { profile: RunnerProfile }) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    profile.photoUrl ? `/api/members/photo/${profile.memberId}` : null
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
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
              <img
                src={photoPreview}
                alt={`${profile.firstName} ${profile.lastName}`}
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
      <p className="mt-3 text-xs text-zinc-500">
        Formati supportati: JPG, PNG, HEIC. Dimensione massima 4MB.
      </p>
    </div>
  );
}
