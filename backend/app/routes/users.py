from fastapi import APIRouter

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.get("/me")
def me():
    return {"message": "current user"}