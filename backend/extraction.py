"""Single multilingual text extractor, replacing the four competing extractors.

Text -> extract(); OCR selected by detected script, not by assumed language,
since college documents routinely mix English with the local language.
"""
from __future__ import annotations

import io
import logging
from dataclasses import dataclass, field
from pathlib import Path

import fitz  # PyMuPDF
import pandas as pd
import pytesseract
from docx import Document
from PIL import Image

from languages import detect_script, ocr_lang_for_script

logger = logging.getLogger(__name__)

OCR_DPI = 300
MIN_TEXT_LEN_PER_PAGE = 20  # below this, a PDF page is treated as a scan and OCR'd


@dataclass
class ExtractedDoc:
    text: str
    pages: list[str] = field(default_factory=list)
    detected_langs: list[str] = field(default_factory=list)
    used_ocr: bool = False


def _ocr_image(img: Image.Image, lang_hint: str | None) -> str:
    script = lang_hint or (detect_script(pytesseract.image_to_string(img, lang="eng"))[0])
    tlang = ocr_lang_for_script(script)
    try:
        return pytesseract.image_to_string(img, lang=tlang)
    except pytesseract.TesseractError as e:
        logger.warning(f"OCR failed for lang={tlang}, falling back to eng: {e}")
        return pytesseract.image_to_string(img, lang="eng")


def _extract_pdf(data: bytes, lang_hint: str | None) -> ExtractedDoc:
    pages: list[str] = []
    used_ocr = False
    doc = fitz.open(stream=data, filetype="pdf")
    try:
        for page in doc:
            text = page.get_text().strip()
            if len(text) < MIN_TEXT_LEN_PER_PAGE:
                pix = page.get_pixmap(dpi=OCR_DPI)
                img = Image.open(io.BytesIO(pix.tobytes("png")))
                text = _ocr_image(img, lang_hint).strip()
                used_ocr = True
            pages.append(text)
    finally:
        doc.close()
    return ExtractedDoc(text="\n\n".join(pages), pages=pages, used_ocr=used_ocr)


def _extract_image(data: bytes, lang_hint: str | None) -> ExtractedDoc:
    img = Image.open(io.BytesIO(data))
    text = _ocr_image(img, lang_hint).strip()
    return ExtractedDoc(text=text, pages=[text], used_ocr=True)


def _extract_docx(data: bytes) -> ExtractedDoc:
    doc = Document(io.BytesIO(data))
    parts = [p.text for p in doc.paragraphs if p.text.strip()]
    for table in doc.tables:
        for row in table.rows:
            cells = [c.text.strip() for c in row.cells]
            if any(cells):
                parts.append(" | ".join(cells))
    text = "\n".join(parts)
    return ExtractedDoc(text=text, pages=[text])


def _extract_tabular(data: bytes, filename: str) -> ExtractedDoc:
    ext = Path(filename).suffix.lower()
    df = pd.read_csv(io.BytesIO(data)) if ext == ".csv" else pd.read_excel(io.BytesIO(data))
    text = df.to_markdown(index=False)
    return ExtractedDoc(text=text, pages=[text])


def extract(file_bytes: bytes, filename: str, lang_hint: str | None = None) -> ExtractedDoc:
    """lang_hint is an optional script name (e.g. 'gujarati') to skip auto-detection on OCR."""
    ext = Path(filename).suffix.lower()
    if ext == ".pdf":
        result = _extract_pdf(file_bytes, lang_hint)
    elif ext in (".jpg", ".jpeg", ".png"):
        result = _extract_image(file_bytes, lang_hint)
    elif ext == ".docx":
        result = _extract_docx(file_bytes)
    elif ext in (".xlsx", ".csv"):
        result = _extract_tabular(file_bytes, filename)
    elif ext in (".txt", ".md"):
        text = file_bytes.decode("utf-8", errors="ignore")
        result = ExtractedDoc(text=text, pages=[text])
    else:
        result = ExtractedDoc(text="", pages=[])
    result.detected_langs = detect_script(result.text) if result.text else ["latin"]
    return result
