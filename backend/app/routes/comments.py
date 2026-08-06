from fastapi import APIRouter

router = APIRouter(
    prefix="/comments",
    tags=["Comments"],
)


@router.get("/")
def list_comments():
    return []


@router.post("/")
def create_comment():
    return {"message": "comment created"}