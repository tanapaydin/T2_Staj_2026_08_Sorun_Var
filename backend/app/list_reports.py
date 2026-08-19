import json
from app.database import SessionLocal
from app.models import Report


def list_reports():
    db = SessionLocal()
    try:
        reports = db.query(Report).all()
        out = []
        for r in reports:
            out.append({
                "id": str(r.id),
                "title": r.title,
                "description": r.description,
                "category": r.category,
                "latitude": r.latitude,
                "longitude": r.longitude,
                "status": r.status,
                "progress": r.progress,
                "priority": r.priority,
                "view_count": r.view_count,
            })
        print(json.dumps(out, ensure_ascii=False, indent=2))
    finally:
        db.close()


if __name__ == "__main__":
    list_reports()
