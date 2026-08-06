def validate_category(category: str) -> bool:
    allowed = [
        "road",
        "trash",
        "lighting",
        "construction",
    ]
    return category in allowed