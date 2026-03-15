# Running Team

Web app per la gestione di **squadre di corsa**: iscritti e pagamenti. Multi-tenant (una istanza per company o un deploy per cliente). Deploy su **Vercel** con database **Neon** (PostgreSQL).

## Funzionalità

- **Iscritti**: anagrafica (nome, cognome, email, telefono, data di nascita, note), elenco e eliminazione
- **Pagamenti**: importo, collegamento opzionale a un iscritto, stato (in attesa / completato), descrizione
- **Dashboard**: conteggio iscritti, numero pagamenti, totale incassato
- **Multi-tenant**: ogni organizzazione vede solo i propri dati (cookie `running-team-org-id` o variabile `ORG_ID`)

## Stack

- **Next.js 16** (App Router), TypeScript, Tailwind CSS
- **Neon** – PostgreSQL serverless
- **Drizzle ORM** – schema e migrazioni
- **Vercel** – hosting frontend e backend (API Routes + Server Actions)

## Setup locale

1. **Clona e installa**
   ```bash
   npm install
   ```

2. **Database Neon**
   - Crea un progetto su [Neon](https://neon.tech)
   - Copia `.env.example` in `.env` e inserisci la connection string:
   ```env
   DATABASE_URL="postgresql://..."
   ```

3. **Schema DB**
   ```bash
   npm run db:push
   ```
   (oppure `npm run db:generate` e poi applica le migrazioni con il tuo workflow Neon)

4. **Organizzazione**
   - Avvia l’app: `npm run dev`
   - Chiama `POST http://localhost:3000/api/seed` (es. con curl o Postman)
   - Copia l’`organizationId` nella risposta e aggiungilo in `.env`:
   ```env
   ORG_ID="uuid-restituito"
   ```

5. **Avvio**
   ```bash
   npm run dev
   ```
   Apri [http://localhost:3000](http://localhost:3000).

## Deploy su Vercel

1. **Neon**
   - Crea un progetto Neon (o usa l’integrazione [Vercel + Neon](https://vercel.com/integrations/neon))
   - In Vercel → Project → Settings → Environment Variables aggiungi:
     - `DATABASE_URL` (connection string Neon)

2. **Organizzazione (multi-tenant)**
   - **Un deploy per company**: in Vercel aggiungi la variabile `ORG_ID` con l’UUID dell’organizzazione (creata via API o seed).
   - **Una app per più company**: implementa login e imposta il cookie `running-team-org-id` con l’id org dopo l’autenticazione.

3. **Build**
   - Collega il repo a Vercel; il build usa `next build`. Nessuna configurazione extra necessaria per Next.js + Neon su Vercel.

## Script

| Comando        | Descrizione                    |
|----------------|--------------------------------|
| `npm run dev`  | Dev server                    |
| `npm run build`| Build produzione               |
| `npm run start`| Avvio dopo build               |
| `npm run db:generate` | Genera migrazioni Drizzle |
| `npm run db:push`      | Applica schema al DB (Neon)   |

## Struttura

- `src/app/` – App Router: pagine, layout, API routes
- `src/app/actions/` – Server Actions (iscritti, pagamenti)
- `src/lib/db/` – Drizzle schema e client Neon
- `src/lib/org-context.ts` – Lettura organizzazione (cookie / env)

## Licenza

Privato / uso commerciale come preferisci.
