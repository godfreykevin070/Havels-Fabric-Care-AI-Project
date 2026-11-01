"""Run with: python -m app.seed"""
from app.db.init_db import init_db
from app.db.session import SessionLocal
from app.seed.demo_data import seed


def main() -> None:
    init_db()
    db = SessionLocal()
    try:
        result = seed(db)
        print("Seed result:", result)
    finally:
        db.close()


if __name__ == "__main__":
    main()