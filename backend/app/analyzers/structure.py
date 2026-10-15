from pathlib import Path
from typing import Any, Dict, List, Set

IGNORE_DIRS: Set[str] = {
    "node_modules",
    ".git",
    "__pycache__",
    ".venv",
    "venv",
    "env",
    "dist",
    "build",
    ".next",
    ".cache",
    ".idea",
    ".vscode",
    ".pytest_cache",
}

LANGUAGE_EXTENSIONS: Dict[str, str] = {
    ".py": "Python",
    ".ts": "TypeScript",
    ".tsx": "TypeScript (React)",
    ".js": "JavaScript",
    ".jsx": "JavaScript (React)",
    ".html": "HTML",
    ".css": "CSS",
    ".scss": "SCSS",
    ".go": "Go",
    ".rs": "Rust",
    ".java": "Java",
    ".cpp": "C++",
    ".c": "C",
    ".cs": "C#",
    ".php": "PHP",
    ".rb": "Ruby",
    ".sql": "SQL",
    ".json": "JSON",
    ".yaml": "YAML",
    ".yml": "YAML",
    ".toml": "TOML",
    ".md": "Markdown",
}


def analyze_structure(root_path: Path) -> Dict[str, Any]:
    """
    Safely inspects project directory structure, counts files and lines,
    detects primary programming languages, frameworks, and entry points.
    """
    total_files = 0
    total_lines = 0
    languages: Dict[str, int] = {}
    technologies: Set[str] = set()
    entry_points: List[str] = []
    file_tree: List[str] = []

    for item in root_path.rglob("*"):
        # Skip ignored directories
        if any(part in IGNORE_DIRS for part in item.parts):
            continue

        if item.is_file():
            total_files += 1
            rel_path = str(item.relative_to(root_path)).replace("\\", "/")

            if len(file_tree) < 50:
                file_tree.append(rel_path)

            ext = item.suffix.lower()
            lang = LANGUAGE_EXTENSIONS.get(ext)
            if lang:
                languages[lang] = languages.get(lang, 0) + 1

            # Count lines safely (for text files < 2MB)
            try:
                if item.stat().st_size < 2 * 1024 * 1024 and ext in LANGUAGE_EXTENSIONS:
                    with open(item, "r", encoding="utf-8", errors="ignore") as f:
                        lines = sum(1 for _ in f)
                        total_lines += lines
            except Exception:
                pass

            # Detect entry points
            lower_name = item.name.lower()
            if lower_name in {"main.py", "app.py", "server.py", "index.js", "server.js", "main.tsx", "index.tsx", "app.tsx", "main.go", "main.rs"}:
                entry_points.append(rel_path)

            # Framework indicators by file presence
            if lower_name == "vite.config.ts" or lower_name == "vite.config.js":
                technologies.add("Vite")
            elif lower_name == "next.config.js" or lower_name == "next.config.mjs" or lower_name == "next.config.ts":
                technologies.add("Next.js")
            elif lower_name == "tsconfig.json":
                technologies.add("TypeScript")
            elif lower_name == "dockerfile":
                technologies.add("Docker")
            elif lower_name == "docker-compose.yml" or lower_name == "docker-compose.yaml":
                technologies.add("Docker Compose")
            elif lower_name == "manage.py":
                technologies.add("Django")

    # Add primary languages to technologies
    top_languages = sorted(languages.items(), key=lambda x: x[1], reverse=True)
    for lang, _ in top_languages[:3]:
        clean_lang = lang.split(" ")[0]
        technologies.add(clean_lang)

    return {
        "total_files": total_files,
        "total_lines": total_lines,
        "languages": [lang for lang, _ in top_languages],
        "technologies": sorted(list(technologies)),
        "entry_points": entry_points,
        "file_tree_sample": file_tree,
    }
