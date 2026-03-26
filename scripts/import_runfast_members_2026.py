import os
import re

import numpy as np
import pandas as pd
import psycopg2


def load_database_url(env_path: str) -> str:
    database_url = None
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if line.startswith("DATABASE_URL="):
                database_url = line.split("=", 1)[1].strip().strip('"').strip()
                break
    if not database_url:
        raise RuntimeError("DATABASE_URL not found in .env")
    return database_url


def norm(v):
    if v is None:
        return None
    if isinstance(v, float) and np.isnan(v):
        return None
    if isinstance(v, str):
        s = v.strip()
        return s if s else None
    try:
        if pd.isna(v):
            return None
    except Exception:
        pass
    s = str(v).strip()
    return s if s else None


def to_date_str(v):
    if v is None:
        return None
    if isinstance(v, float) and np.isnan(v):
        return None
    try:
        if pd.isna(v):
            return None
    except Exception:
        pass
    ts = pd.to_datetime(v, errors="coerce")
    if ts is pd.NaT:
        return norm(v)
    return ts.strftime("%Y-%m-%d")


def tessera_to_email(tessera: str) -> str:
    local = re.sub(r"[^a-zA-Z0-9._-]+", "", tessera).lower()
    return f"{local}@runfast.it"


def main():
    # INPUTS
    xlsx_path = r"C:\Users\alberto.daldosso\Downloads\facsimile_db_runfast2026.xlsx"
    org_slug = "run-fast"
    target_total = 20
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    env_path = os.path.abspath(env_path)

    database_url = load_database_url(env_path)

    # READ EXCEL
    xl = pd.ExcelFile(xlsx_path)
    df = pd.read_excel(xlsx_path, sheet_name=xl.sheet_names[0]).copy()

    # Expected columns
    map_cols = {
        "Tessera": "tessera",
        "Cognome": "last_name",
        "Nome": "first_name",
        "Luogo Nascita": "luogo_nascita",
        "Data Nascita": "birth_date",
        "Codice Fiscale": "codice_fiscale",
        "Cat.": "categoria",
        "Straniero": "straniero",
        "Indirizzo": "indirizzo",
        "Cap": "cap",
        "Citta": "citta",
        "Prov.": "prov",
        "Status": "status",
        "Materiale 2026 consegnato": "materiale_2026_consegnato",
        "Spedizione": "spedizione",
        "Genere": "genere",
        "TAGLIA MAGLIA COTONE": "taglia_maglia_cotone",
        "TAGLIA MAGLIA SOLAR": "taglia_maglia_solar",
        "TAGLIA MAGLIA PULSAR": "taglia_maglia_pulsar",
        "TAGLIA CANOTTA SOLAR": "taglia_canotta_solar",
        "TAGLIA CANOTTA PULSAR": "taglia_canotta_pulsar",
        "TAGLIA FELPA SOLAR": "taglia_felpa_solar",
        "TAGLIA FELPA PULSAR": "taglia_felpa_pulsar",
    }

    missing = [c for c in map_cols.keys() if c not in df.columns]
    if missing:
        raise RuntimeError("Missing columns in XLSX: " + ", ".join(missing))

    # DB CONNECT
    conn = psycopg2.connect(database_url)
    conn.autocommit = False
    cur = conn.cursor()

    cur.execute(
        "SELECT id FROM organizations WHERE slug = %s LIMIT 1",
        (org_slug,),
    )
    org_row = cur.fetchone()
    if not org_row:
        raise RuntimeError(f"Organization with slug '{org_slug}' not found")
    org_id = org_row[0]

    # Generate deterministic emails and pre-load existing ones.
    # If the XLSX has fewer rows than target_total, we generate synthetic
    # rows (cloned from the template) to reach the desired amount.
    df_template = df.copy()
    template_rows = []
    for _, r in df_template.iterrows():
        tess = norm(r.get("Tessera"))
        first_name = norm(r.get("Nome"))
        last_name = norm(r.get("Cognome"))
        if tess and first_name and last_name:
            template_rows.append(r)

    if not template_rows:
        raise RuntimeError("No valid template rows found in XLSX (need Tessera, Nome, Cognome).")

    # Determine tessera numeric progression
    tess_numbers = []
    tess_prefixes = set()
    tess_digit_len = 6
    for r in template_rows:
        t = norm(r.get("Tessera"))
        if not t:
            continue
        m = re.match(r"^([A-Za-z]+)(\\d+)$", str(t).strip())
        if not m:
            continue
        tess_prefixes.add(m.group(1).upper())
        tess_numbers.append(int(m.group(2)))
        tess_digit_len = max(tess_digit_len, len(m.group(2)))

    if not tess_numbers:
        # Fallback: if tessera doesn't match expected pattern
        tess_prefixes = {"AF"}
        tess_numbers = [100000]

    rng = np.random.default_rng(2026)
    rng_letters = np.array(list("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"))

    def random_codice_fiscale() -> str:
        return "".join(rng.choice(rng_letters, size=16).tolist())

    def random_pick(col_value):
        # Choose between None and string; used to keep values realistic
        if col_value is None or (isinstance(col_value, float) and np.isnan(col_value)):
            return None
        return norm(col_value)

    # Pre-build final "rows" list where each item behaves like an excel row
    rows_to_process = list(template_rows)
    next_num = max(tess_numbers) + 1
    template_values_by_col = {c: df_template[c].dropna().tolist() for c in df_template.columns}

    while len(rows_to_process) < target_total:
        base = rows_to_process[rng.integers(0, len(template_rows))]

        new_prefix = rng.choice(list(tess_prefixes))
        new_tess = f"{new_prefix}{str(next_num).zfill(tess_digit_len)}"
        next_num += 1

        # Clone and mutate the few fields that must be unique-ish
        new_row = base.copy()
        new_row["Tessera"] = new_tess
        new_row["Codice Fiscale"] = random_codice_fiscale()

        # Slight variety: randomize a couple of text fields from the template distributions
        for col in ["Status", "Spedizione", "Straniero", "Genere", "categoria" if "categoria" in template_values_by_col else "Cat."]:
            # We keep it simple and only override if the column exists in XLSX
            if col in df_template.columns:
                vals = [v for v in template_values_by_col.get(col, [])]
                if vals:
                    new_row[col] = rng.choice(vals)

        # Birth date: keep format, but vary by choosing a random template date
        if "Data Nascita" in df_template.columns:
            vals = template_values_by_col.get("Data Nascita", [])
            if vals:
                new_row["Data Nascita"] = rng.choice(vals)

        # Taglie: choose per column from existing template values to keep realism
        for tag_col in [
            "TAGLIA MAGLIA COTONE",
            "TAGLIA MAGLIA SOLAR",
            "TAGLIA MAGLIA PULSAR",
            "TAGLIA CANOTTA SOLAR",
            "TAGLIA CANOTTA PULSAR",
            "TAGLIA FELPA SOLAR",
            "TAGLIA FELPA PULSAR",
        ]:
            if tag_col in df_template.columns:
                vals = template_values_by_col.get(tag_col, [])
                if vals:
                    new_row[tag_col] = rng.choice(vals)

        rows_to_process.append(new_row)

    # Generate deterministic emails for all rows to process and pre-load existing ones
    emails = []
    for r in rows_to_process:
        tess = norm(r.get("Tessera"))
        if tess:
            emails.append(tessera_to_email(tess))
    emails = list(dict.fromkeys(emails))

    existing_emails = set()
    if emails:
        cur.execute(
            "SELECT email FROM members WHERE organization_id = %s AND email = ANY(%s)",
            (org_id, emails),
        )
        existing_emails = {row[0] for row in cur.fetchall()}

    insert_cols = [
        "organization_id",
        "first_name",
        "last_name",
        "email",
        "phone",
        "birth_date",
        "notes",
        "tessera",
        "luogo_nascita",
        "codice_fiscale",
        "categoria",
        "straniero",
        "indirizzo",
        "cap",
        "citta",
        "prov",
        "status",
        "materiale_2026_consegnato",
        "spedizione",
        "genere",
        "taglia_maglia_cotone",
        "taglia_maglia_solar",
        "taglia_maglia_pulsar",
        "taglia_canotta_solar",
        "taglia_canotta_pulsar",
        "taglia_felpa_solar",
        "taglia_felpa_pulsar",
    ]

    placeholders = ",".join(["%s"] * len(insert_cols))
    columns_sql = ",".join([f'"{c}"' for c in insert_cols])
    insert_sql = f"INSERT INTO members ({columns_sql}) VALUES ({placeholders})"

    update_set = ",".join([f'"{c}"=%s' for c in insert_cols])
    update_sql = (
        f"UPDATE members SET {update_set} WHERE organization_id = %s AND email = %s"
    )

    inserted = 0
    updated = 0
    skipped = 0

    for r in rows_to_process:
        tessera = norm(r.get("Tessera"))
        if not tessera:
            skipped += 1
            continue

        first_name = norm(r.get("Nome"))
        last_name = norm(r.get("Cognome"))
        if not first_name or not last_name:
            skipped += 1
            continue

        email = tessera_to_email(tessera)
        birth_date = to_date_str(r.get("Data Nascita"))

        values_by_col = {
            "organization_id": org_id,
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "phone": None,
            "birth_date": birth_date,
            "notes": None,
            # extended fields
            "tessera": tessera,
            "luogo_nascita": norm(r.get("Luogo Nascita")),
            "codice_fiscale": norm(r.get("Codice Fiscale")),
            "categoria": norm(r.get("Cat.")),
            "straniero": norm(r.get("Straniero")),
            "indirizzo": norm(r.get("Indirizzo")),
            "cap": norm(r.get("Cap")),
            "citta": norm(r.get("Citta")),
            "prov": norm(r.get("Prov.")),
            "status": norm(r.get("Status")),
            "materiale_2026_consegnato": norm(r.get("Materiale 2026 consegnato")),
            "spedizione": norm(r.get("Spedizione")),
            "genere": norm(r.get("Genere")),
            "taglia_maglia_cotone": norm(r.get("TAGLIA MAGLIA COTONE")),
            "taglia_maglia_solar": norm(r.get("TAGLIA MAGLIA SOLAR")),
            "taglia_maglia_pulsar": norm(r.get("TAGLIA MAGLIA PULSAR")),
            "taglia_canotta_solar": norm(r.get("TAGLIA CANOTTA SOLAR")),
            "taglia_canotta_pulsar": norm(r.get("TAGLIA CANOTTA PULSAR")),
            "taglia_felpa_solar": norm(r.get("TAGLIA FELPA SOLAR")),
            "taglia_felpa_pulsar": norm(r.get("TAGLIA FELPA PULSAR")),
        }

        values = [values_by_col[c] for c in insert_cols]

        if email in existing_emails:
            cur.execute(update_sql, values + [org_id, email])
            updated += 1
        else:
            cur.execute(insert_sql, values)
            inserted += 1

    conn.commit()
    cur.close()
    conn.close()

    print(
        {
            "org_slug": org_slug,
            "target_total": target_total,
            "template_rows": len(template_rows),
            "inserted": inserted,
            "updated": updated,
            "skipped": skipped,
        }
    )


if __name__ == "__main__":
    main()

