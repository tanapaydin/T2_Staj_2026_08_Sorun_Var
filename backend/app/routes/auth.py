# Auth Routes Şu şekilde Olacak:
# POST /auth/register: Kullanıcı kaydı için kullanılacak. Gerekli alanlar: name, email, password
# POST /auth/login: Kullanıcı girişi için kullanılacak. Gerekli alanlar: email, password
# GET /auth/me: Kullanıcının kendi bilgilerini almak için kullanılacak. Bu route, kullanıcı giriş yaptıktan sonra erişilebilir olacak.
# POST /auth/logout: Kullanıcının oturumunu kapatmak için kullanılacak. Bu route, kullanıcı giriş yaptıktan sonra erişilebilir olacak.
# POST /auth/refresh: Kullanıcının oturumunu yenilemek için kullanılacak. Bu route, kullanıcı giriş yaptıktan sonra erişilebilir olacak.
# POST /auth/verify-email: Kullanıcının e-posta adresini doğrulamak için kullanılacak. Gerekli alanlar: token (e-posta doğrulama tokenı). Bu route, kullanıcı giriş yaptıktan sonra erişilebilir olacak.
# POST /auth/resend-verification-email: Kullanıcının e-posta doğrulama e-postasını yeniden göndermek için kullanılacak. Bu route, kullanıcı giriş yaptıktan sonra erişilebilir olacak.
# POST /auth/forgot-password: Kullanıcının şifresini unuttuğunda şifre sıfırlama e-postası göndermek için kullanılacak. Gerekli alanlar: email. Bu route, kullanıcı giriş yaptıktan sonra erişilebilir olacak.

from fastapi import APIRouter

router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
)


@router.post("/register")
def register():
    return {"message": "register endpoint"}


@router.post("/login")
def login():
    return {"message": "login endpoint"}