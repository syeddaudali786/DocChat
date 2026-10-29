import io
import logging

from pypdf import PdfReader

logger = logging.getLogger(__name__)

MIN_TEXT_CHARS = 50  # less than this in the whole file means it is empty or scanned


class PdfError(ValueError):
    """The file is a PDF we cannot use; the message is safe to show to the user."""


def extract_pages(data: bytes) -> tuple[int, list[tuple[int, str]]]:
    """Return (page_count, [(page_number, text)]) for pages that contain text (1-based numbers)."""
    try:
        reader = PdfReader(io.BytesIO(data))
        if reader.is_encrypted and not reader.decrypt(""):
            raise PdfError("Password-protected PDFs are not supported.")
        pages = [(number, (page.extract_text() or "").strip()) for number, page in enumerate(reader.pages, 1)]
    except PdfError:
        raise
    except Exception as exc:
        logger.warning("Could not parse PDF: %s", exc)
        raise PdfError("Could not read the PDF. The file may be corrupt.") from exc

    if not pages:
        raise PdfError("The PDF has no pages.")
    if sum(len(text) for _, text in pages) < MIN_TEXT_CHARS:
        raise PdfError(
            "No extractable text found. The PDF is empty or scanned (image-only); "
            "scanned PDFs are not supported."
        )
    return len(pages), [(number, text) for number, text in pages if text]
