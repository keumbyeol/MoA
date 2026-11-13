
import argparse

from app.core.database import SessionLocal
from app.services.sync_service import sync_youth_policies


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--max-pages",
        type=int,
        default=1,
    )
    args = parser.parse_args()

    db = SessionLocal()

    try:
        result = sync_youth_policies(
            db,
            page_size=100,
            max_pages=args.max_pages,
        )
        print("\n청년정책 수집 완료")
        print(result)
    finally:
        db.close()


if __name__ == "__main__":
    main()
