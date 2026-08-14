# AI Routes şu şekilde olacak:
# POST /ai/analyze-image: Kullanıcının yüklediği bir resmi analiz etmek için kullanılacak. Gerekli alanlar: image (dosya). Bu route, kullanıcı giriş yaptıktan sonra erişilebilir olacak.
# POST /ai/moderate-text: Kullanıcının gönderdiği bir metni moderasyon için analiz etmek için kullanılacak. Gerekli alanlar: text (string). Bu route, kullanıcı giriş yaptıktan sonra erişilebilir olacak.
# POST /ai/generate-description: Kullanıcının yüklediği bir resmi analiz ederek, rapor için otomatik bir açıklama oluşturmak için kullanılacak. Gerekli alanlar: image (dosya). Bu route, kullanıcı giriş yaptıktan sonra erişilebilir olacak.
# POST /ai/suggest-category: Kullanıcının yüklediği bir resmi analiz ederek, rapor için uygun bir kategori önermek için kullanılacak. Gerekli alanlar: image (dosya). Bu route, kullanıcı giriş yaptıktan sonra erişilebilir olacak.
 

from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.models import User

router = APIRouter(
    prefix="/ai",
    tags=["AI"],
)


@router.post("/suggest-category")
def suggest_category(current_user: User = Depends(get_current_user)):
    return {"category": "road"}
