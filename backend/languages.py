"""Script-based language/OCR-pack mapping for multilingual extraction and detection."""
from __future__ import annotations

SCRIPT_TESSERACT = {
    "devanagari": "hin+mar+san+nep",
    "bengali": "ben+asm",
    "gujarati": "guj",
    "gurmukhi": "pan",
    "oriya": "ori",
    "tamil": "tam",
    "telugu": "tel",
    "kannada": "kan",
    "malayalam": "mal",
    "urdu": "urd",
}

# (script name, unicode range start, unicode range end)
UNICODE_RANGES = [
    ("devanagari", 0x0900, 0x097F),
    ("bengali", 0x0980, 0x09FF),
    ("gurmukhi", 0x0A00, 0x0A7F),
    ("gujarati", 0x0A80, 0x0AFF),
    ("oriya", 0x0B00, 0x0B7F),
    ("tamil", 0x0B80, 0x0BFF),
    ("telugu", 0x0C00, 0x0C7F),
    ("kannada", 0x0C80, 0x0CFF),
    ("malayalam", 0x0D00, 0x0D7F),
    ("urdu", 0x0600, 0x06FF),
]

SIMPLE_LANG_CODE = {
    "devanagari": "hi", "bengali": "bn", "gujarati": "gu", "gurmukhi": "pa",
    "oriya": "or", "tamil": "ta", "telugu": "te", "kannada": "kn",
    "malayalam": "ml", "urdu": "ur", "latin": "en",
}


def detect_script(text: str) -> list[str]:
    """Returns scripts present in text, most-frequent first. ['latin'] if none detected / empty."""
    counts: dict[str, int] = {}
    for ch in text:
        cp = ord(ch)
        for name, lo, hi in UNICODE_RANGES:
            if lo <= cp <= hi:
                counts[name] = counts.get(name, 0) + 1
                break
    if not counts:
        return ["latin"]
    return sorted(counts, key=counts.get, reverse=True)


def ocr_lang_for_script(script: str | None) -> str:
    """Tesseract lang= string. College docs routinely mix English with the local language."""
    if not script or script == "latin":
        return "eng"
    packs = SCRIPT_TESSERACT.get(script.lower())
    return f"eng+{packs}" if packs else "eng"


def simple_lang_code(script: str) -> str:
    return SIMPLE_LANG_CODE.get(script, "en")
