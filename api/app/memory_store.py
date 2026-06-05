"""Memory store — gerencia ficheiros de memória do GHOST."""
import json
import os
from pathlib import Path
from datetime import datetime
from typing import Optional


GHOST_DIR = Path.home() / "ghost"
MEMORY_FILE = GHOST_DIR / "MEMORY.md"
MEMORY_DIR = GHOST_DIR / "memory"
OBSIDIAN_VAULT = GHOST_DIR / "brain" / "Obsidian" / "Ghost-Brain"


def list_memory_files() -> list[dict]:
    """Lista todos os ficheiros de memória disponíveis."""
    files = []
    # MEMORY.md
    if MEMORY_FILE.exists():
        stat = MEMORY_FILE.stat()
        files.append({
            "name": "MEMORY.md",
            "path": str(MEMORY_FILE),
            "size": stat.st_size,
            "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            "type": "long_term",
        })
    # Daily files
    if MEMORY_DIR.exists():
        for f in sorted(MEMORY_DIR.iterdir()):
            if f.suffix == ".md" and f.name != "index.md" and f.name != "lessons.md" and f.name != "people.md":
                stat = f.stat()
                files.append({
                    "name": f.name,
                    "path": str(f),
                    "size": stat.st_size,
                    "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "type": "daily",
                })
        # index, lessons, people
        for extra in ["index.md", "lessons.md", "people.md"]:
            p = MEMORY_DIR / extra
            if p.exists():
                stat = p.stat()
                files.append({
                    "name": extra,
                    "path": str(p),
                    "size": stat.st_size,
                    "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "type": "reference",
                })
    return files


def read_file_content(path: str) -> Optional[dict]:
    """Lê conteúdo de um ficheiro de memória."""
    p = Path(path)
    if not p.exists() or not p.is_file():
        return None
    content = p.read_text(encoding="utf-8")
    lines = content.split("\n")
    return {
        "content": content,
        "line_count": len(lines),
        "size": p.stat().st_size,
    }


def save_file_content(path: str, content: str) -> dict:
    """Guarda conteúdo num ficheiro de memória."""
    p = Path(path)
    # Safety: ensure the path is inside ghost dir
    ghost = Path.home() / "ghost"
    try:
        p.relative_to(ghost)
    except ValueError:
        raise PermissionError("Só é permitido escrever dentro de ~/ghost/")
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")
    lines = content.split("\n")
    return {
        "status": "saved",
        "path": str(p),
        "line_count": len(lines),
        "size": p.stat().st_size,
    }


def get_stats() -> dict:
    """Estatísticas sobre as memórias."""
    total_files = 0
    total_bytes = 0
    by_type = {}

    for f in list_memory_files():
        total_files += 1
        total_bytes += f["size"]
        t = f["type"]
        by_type[t] = by_type.get(t, 0) + 1

    return {
        "total_files": total_files,
        "total_bytes": total_bytes,
        "by_type": by_type,
    }
