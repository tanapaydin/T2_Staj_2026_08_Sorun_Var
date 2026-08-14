import os
import base64

from google import genai
from google.genai import types


CATEGORIES = [
    "road",
    "trash",
    "lighting",
    "construction",
    "water",
    "park",
    "traffic",
    "noise",
]


def analyze_image(
    image_path: str,
    selected_categories: list[str] | None = None,
):
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise RuntimeError("GEMINI_API_KEY bulunamadı.")

    client = genai.Client(api_key=api_key)

    with open(image_path, "rb") as file:
        image_bytes = file.read()

    prompt = f"""
Sen Türkiye'deki belediye sorunlarını analiz eden bir asistansın.

Fotoğraftaki sorunu dikkatlice analiz et.

Geçerli kategoriler:
{", ".join(CATEGORIES)}

Kullanıcının seçtiği kategoriler:
{selected_categories or []}

Kurallar:
1. Fotoğrafa gerçekten görünen soruna göre cevap ver.
2. Kullanıcı bir veya daha fazla kategori seçtiyse kategori önerme.
3. Kullanıcı kategori seçmediyse fotoğrafa göre en uygun TEK kategoriyi seç.
4. Açıklama Türkçe olsun.
5. Açıklama kısa, doğal ve belediye raporuna uygun olsun.
6. Fotoğrafta kesin olarak görülemeyen şeyleri uydurma.

SADECE aşağıdaki JSON formatında cevap ver:

{{
  "category": "road",
  "description": "Fotoğrafta görülen sorunun kısa açıklaması."
}}

Kategori kullanıcı tarafından zaten seçilmişse "category" alanını null yap:

{{
  "category": null,
  "description": "Fotoğrafta görülen sorunun kısa açıklaması."
}}
"""

    response = client.models.generate_content(
       model="gemini-3.5-flash",
        contents=[
            types.Part.from_bytes(
                data=image_bytes,
                mime_type="image/jpeg",
            ),
            prompt,
        ],
    )

    text = response.text.strip()

    # Markdown JSON işaretlerini temizle
    if text.startswith("```"):
        text = text.replace("```json", "")
        text = text.replace("```", "")
        text = text.strip()

    import json

    result = json.loads(text)

    category = result.get("category")
    description = result.get("description", "")

    if category is not None and category not in CATEGORIES:
        category = None

    return {
        "category": "road",
        "title": "Yolda çukur",
        "description": "Yol yüzeyinde sürüş güvenliğini etkileyen bir çukur tespit edildi.",
    } 
        "category": category,
        "description": description,
    }
