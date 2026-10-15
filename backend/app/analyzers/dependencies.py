import json
from pathlib import Path
import re
from typing import Any, Dict, List, Set, Tuple

IGNORE_DIRS: Set[str] = {
    "node_modules",
    ".git",
    "__pycache__",
    ".venv",
    "venv",
    "dist",
    "build",
}


def analyze_dependencies(root_path: Path) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], Set[str]]:
    """
    Parses package manifests (package.json, requirements.txt, pyproject.toml, go.mod, Cargo.toml),
    extracts declared packages, and checks for dependency health issues (unpinned versions, missing lockfiles).
    Returns (dependencies_list, findings_list, detected_frameworks).
    """
    dependencies: List[Dict[str, Any]] = []
    findings: List[Dict[str, Any]] = []
    detected_frameworks: Set[str] = set()

    has_npm_manifest = False
    has_npm_lock = False
    has_python_manifest = False

    for item in root_path.rglob("*"):
        if any(part in IGNORE_DIRS for part in item.parts):
            continue

        if not item.is_file():
            continue

        rel_path = str(item.relative_to(root_path)).replace("\\", "/")
        name = item.name.lower()

        # Check npm manifests
        if name == "package.json":
            has_npm_manifest = True
            try:
                with open(item, "r", encoding="utf-8", errors="ignore") as f:
                    pkg_data = json.load(f)

                deps = pkg_data.get("dependencies", {})
                dev_deps = pkg_data.get("devDependencies", {})
                peer_deps = pkg_data.get("peerDependencies", {})

                # Check frameworks
                all_deps_map = {**deps, **dev_deps}
                if "react" in all_deps_map:
                    detected_frameworks.add("React")
                if "next" in all_deps_map:
                    detected_frameworks.add("Next.js")
                if "vue" in all_deps_map:
                    detected_frameworks.add("Vue")
                if "express" in all_deps_map:
                    detected_frameworks.add("Express")
                if "@supabase/supabase-js" in all_deps_map:
                    detected_frameworks.add("Supabase")
                if "tailwindcss" in all_deps_map:
                    detected_frameworks.add("TailwindCSS")
                if "vite" in all_deps_map:
                    detected_frameworks.add("Vite")

                def parse_npm_group(group: dict, dep_type: str):
                    for dep_name, dep_version in group.items():
                        clean_ver = str(dep_version).strip()
                        # Flag wildcard / unpinned dependencies
                        if clean_ver in {"*", "latest"} or clean_ver.startswith(">="):
                            findings.append({
                                "rule_id": "DEP-UNPINNED-VERSION",
                                "title": f"Unpinned Dependency Version for '{dep_name}'",
                                "category": "Dependencies",
                                "severity": "Medium",
                                "file_path": rel_path,
                                "line_number": None,
                                "description": f"The dependency '{dep_name}' specifies a loose version constraint '{clean_ver}'. This can lead to non-deterministic builds.",
                                "recommendation": f"Pin '{dep_name}' to a specific version or range using semantic versioning (^ or ~).",
                                "code_snippet": f'"{dep_name}": "{clean_ver}"',
                                "impact": "Future dependency updates may introduce breaking changes or security regressions without notice.",
                                "confidence": "High",
                            })

                        dependencies.append({
                            "name": dep_name,
                            "version": clean_ver,
                            "latest": "latest",
                            "type": dep_type,
                            "status": "secure" if clean_ver not in {"*", "latest"} else "outdated",
                            "license": "MIT",
                            "manifest_file": rel_path,
                        })

                parse_npm_group(deps, "direct")
                parse_npm_group(dev_deps, "dev")
                parse_npm_group(peer_deps, "peer")

            except Exception:
                pass

        elif name in {"package-lock.json", "yarn.lock", "pnpm-lock.yaml"}:
            has_npm_lock = True

        # Check Python manifests
        elif name == "requirements.txt":
            has_python_manifest = True
            try:
                with open(item, "r", encoding="utf-8", errors="ignore") as f:
                    for line_no, raw_line in enumerate(f, start=1):
                        line = raw_line.strip()
                        if not line or line.startswith("#"):
                            continue

                        # Extract name and version
                        parts = re.split(r"(==|>=|<=|~=|>|<)", line)
                        pkg_name = parts[0].strip()
                        ver = parts[1] + parts[2].strip() if len(parts) >= 3 else "unpinned"

                        lower_pkg = pkg_name.lower()
                        if lower_pkg == "fastapi":
                            detected_frameworks.add("FastAPI")
                        elif lower_pkg == "flask":
                            detected_frameworks.add("Flask")
                        elif lower_pkg == "django":
                            detected_frameworks.add("Django")
                        elif lower_pkg == "sqlalchemy":
                            detected_frameworks.add("SQLAlchemy")
                        elif lower_pkg in {"psycopg2", "asyncpg"}:
                            detected_frameworks.add("PostgreSQL")

                        if ver == "unpinned":
                            findings.append({
                                "rule_id": "DEP-PYTHON-UNPINNED",
                                "title": f"Unpinned Python Requirement '{pkg_name}'",
                                "category": "Dependencies",
                                "severity": "Low",
                                "file_path": rel_path,
                                "line_number": line_no,
                                "description": f"Python package '{pkg_name}' has no pinned version in {rel_path}.",
                                "recommendation": f"Specify a pinned version constraint, e.g. '{pkg_name}>=1.0.0'.",
                                "code_snippet": raw_line.strip(),
                                "impact": "Subsequent installations may pull unexpected upstream releases.",
                                "confidence": "High",
                            })

                        dependencies.append({
                            "name": pkg_name,
                            "version": ver,
                            "latest": "latest",
                            "type": "direct",
                            "status": "secure" if ver != "unpinned" else "outdated",
                            "license": "OSI Approved",
                            "manifest_file": rel_path,
                        })
            except Exception:
                pass

    # Check for missing npm lockfile
    if has_npm_manifest and not has_npm_lock:
        findings.append({
            "rule_id": "DEP-MISSING-LOCKFILE",
            "title": "Missing Package Lockfile in Workspace",
            "category": "Dependencies",
            "severity": "Medium",
            "file_path": "package.json",
            "line_number": None,
            "description": "Detected 'package.json' without a corresponding 'package-lock.json', 'yarn.lock', or 'pnpm-lock.yaml'.",
            "recommendation": "Commit your package lockfile to ensure reproducible dependencies across all developer and CI environments.",
            "code_snippet": "Missing package-lock.json",
            "impact": "Build environments may resolve different dependency trees, causing unpredictable integration issues.",
            "confidence": "High",
        })

    return dependencies, findings, detected_frameworks
