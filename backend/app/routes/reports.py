# Reports Routes şu şekilde olacak:
# GET /reports: Tüm raporları listelemek için kullanılacak. Bu route, kullanıcı giriş yaptıktan sonra erişilebilir olacak.
# GET /reports/{id}: Belirli bir raporu görüntülemek için kullanılacak. Bu route, kullanıcı giriş yaptıktan sonra erişilebilir olacak.
# POST /reports: Yeni bir rapor oluşturmak için kullanılacak. Gerekli alanlar: title, description, category, latitude, longitude. Bu route, kullanıcı giriş yaptıktan sonra erişilebilir olacak.
# PATCH /reports/{id}: Belirli bir raporu güncellemek için kullanılacak. Gerekli alanlar: title, description, category, latitude, longitude. Bu route, kullanıcı giriş yaptıktan sonra erişilebilir olacak.
# DELETE /reports/{id}: Belirli bir raporu silmek için kullanılacak. Bu route, kullanıcı giriş yaptıktan sonra erişilebilir olacak.
# POST /reports/{id}/images: Belirli bir rapora resim eklemek için kullanılacak. Gerekli alanlar: image (dosya). Bu route, kullanıcı giriş yaptıktan sonra erişilebilir olacak.
# GET /reports/nearby: Belirli bir konumun yakınındaki raporları listelemek için kullanılacak. Gerekli alanlar: latitude, longitude, radius (opsiyonel, örneğin x km). Bu route, kullanıcı giriş yaptıktan sonra erişilebilir olacak.
# GET /reports/search: Belirli bir konumun yakınındaki raporları aramak için kullanılacak. Gerekli alanlar: latitude, longitude, radius (opsiyonel, örneğin x km), query (arama terimi). Bu route, kullanıcı giriş yaptıktan sonra erişilebilir olacak.
# GET /reports/statistics: Raporlar hakkında istatistikleri almak için kullanılacak. Bu route, kullanıcı giriş yaptıktan sonra erişilebilir olacak.
# GET /reports/statistics/category: Kategorilere göre rapor istatistiklerini almak için kullanılacak. Bu route, kullanıcı giriş yaptıktan sonra erişilebilir olacak.


from fastapi import APIRouter

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


@router.get("/")
def list_reports():
    return []


@router.post("/")
def create_report():
    return {"message": "report created"}