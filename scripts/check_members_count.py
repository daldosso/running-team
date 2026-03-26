import os

import psycopg2


def load_database_url(env_path: str) -> str:
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if line.startswith("DATABASE_URL="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise RuntimeError("DATABASE_URL not found in .env")


def main() -> None:
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    env_path = os.path.abspath(env_path)
    database_url = load_database_url(env_path)

    conn = psycopg2.connect(database_url)
    cur = conn.cursor()

    cur.execute("SELECT id FROM organizations WHERE slug=%s LIMIT 1", ("run-fast",))
    org_id = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM members WHERE organization_id=%s", (org_id,))
    members_count = cur.fetchone()[0]

    print({"org_slug": "run-fast", "members_count": members_count})

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()

