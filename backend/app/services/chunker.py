import re


def chunk_pages(pages: list[tuple[int, str]], size: int, overlap: int) -> list[tuple[int, str]]:
    """Split each page into ~size-character chunks with overlap; chunks never cross pages.

    Cuts at a sentence end (or a space) in the second half of the window when possible.
    """
    chunks: list[tuple[int, str]] = []
    for page_number, text in pages:
        text = re.sub(r"\s+", " ", text).strip()
        start = 0
        while start < len(text):
            end = min(start + size, len(text))
            if end < len(text):
                cut = text.rfind(". ", start + size // 2, end)
                if cut == -1:
                    cut = text.rfind(" ", start + size // 2, end)
                if cut != -1:
                    end = cut + 1
            piece = text[start:end].strip()
            if piece:
                chunks.append((page_number, piece))
            if end >= len(text):
                break
            start = max(end - overlap, start + 1)
    return chunks
