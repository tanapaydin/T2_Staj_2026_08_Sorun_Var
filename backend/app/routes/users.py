from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.schemas import UserResponse
from app.models import User

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user
