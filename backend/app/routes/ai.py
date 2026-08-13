from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.services.ai_service import analyze_image


router = APIRouter(
    prefix="/ai",
    tags=["AI"],
)


@router.post("/analyze-image")
async def analyze_report_image(
    image: UploadFile = File(...),
    selected_categories: str = Form(""),
):
    """
    Fotoğrafı AI ile analiz eder.

    Kullanıcı kategori seçmişse:
    - AI açıklama oluşturur.
    - Mevcut kategorilere dokunmaz.

    Kullanıcı kategori seçmemişse:
    - AI açıklama oluşturur.
    - AI uygun kategori önerir.

    Bu endpoint misafir kullanıcılar için de açıktır.
    """

    if (
        not image.content_type
        or not image.content_type.startswith("image/")
    ):
        raise HTTPException(
            status_code=400,
            detail="Geçerli bir görsel dosyası yüklenmelidir.",
        )

    categories = [
        category.strip()
        for category in selected_categories.split(",")
        if category.strip()
    ]

    suffix = Path(
        image.filename or ""
    ).suffix or ".jpg"

    temporary_path = None

    try:
        image_bytes = await image.read()

        if not image_bytes:
            raise HTTPException(
                status_code=400,
                detail="Fotoğraf boş.",
            )

        with NamedTemporaryFile(
            delete=False,
            suffix=suffix,
        ) as temporary_file:
            temporary_file.write(image_bytes)
            temporary_path = temporary_file.name

        result = analyze_image(
            temporary_path,
            selected_categories=categories,
        )

        return result

    except HTTPException:
        raise

    except Exception as error:
        print(
            "AI ANALİZ HATASI:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail="Fotoğraf yapay zeka tarafından analiz edilemedi.",
        )

    finally:
        if temporary_path:
            try:
                Path(
                    temporary_path
                ).unlink(
                    missing_ok=True
                )
            except Exception:
                pass


@router.post("/generate-description")
async def generate_description(
    image: UploadFile = File(...),
    selected_categories: str = Form(""),
):
    """
    Fotoğraftan otomatik açıklama oluşturur.
    """

    return await analyze_report_image(
        image=image,
        selected_categories=selected_categories,
    )


@router.post("/suggest-category")
async def suggest_category(
    image: UploadFile = File(...),
):
    """
    Fotoğrafa göre kategori önerir.
    """

    result = await analyze_report_image(
        image=image,
        selected_categories="",
    )

    return {
        "category": result.get("category"),
    }


@router.post("/moderate-text")
async def moderate_text(
    text: str = Form(...),
):
    """
    Metin moderasyonu.
    """

    return {
        "allowed": True,
        "text": text,
    }