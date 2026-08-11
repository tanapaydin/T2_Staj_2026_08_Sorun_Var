from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Comment, Report, User
from app.schemas import CommentCreate, CommentResponse

router = APIRouter(
    prefix="/comments",
    tags=["Comments"],
)


@router.get("/", response_model=list[CommentResponse])
def list_comments(
    report_id: UUID | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(Comment).order_by(Comment.created_at.desc())

    if report_id:
        query = query.filter(Comment.report_id == report_id)

    return query.all()


@router.post("/", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    comment_create: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = (
        db.query(Report)
        .filter(Report.id == comment_create.report_id)
        .first()
    )

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found.",
        )

    comment = Comment(
        report_id=comment_create.report_id,
        user_id=current_user.id,
        text=comment_create.text,
    )

    db.add(comment)
    db.commit()
    db.refresh(comment)

    return comment
