from pathlib import Path
import re
from typing import Any, Dict, List, Set

IGNORE_DIRS: Set[str] = {
    "node_modules",
    ".git",
    "__pycache__",
    ".venv",
    "venv",
    "dist",
    "build",
}


def analyze_api_integration(root_path: Path) -> List[Dict[str, Any]]:
    """
    Scans frontend files for API calls and backend files for endpoint definitions,
    detecting mismatches, hardcoded URLs, and missing environment variables.
    """
    findings: List[Dict[str, Any]] = []

    frontend_calls: List[Dict[str, Any]] = []
    backend_endpoints: Set[str] = set()
    env_keys_declared: Set[str] = set()
    env_keys_used: List[Dict[str, Any]] = []

    # 1. Read .env / .env.example keys
    for env_file in root_path.rglob(".env*"):
        if any(part in IGNORE_DIRS for part in env_file.parts):
            continue
        try:
            with open(env_file, "r", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key = line.split("=")[0].strip()
                        env_keys_declared.add(key)
        except Exception:
            pass

    # Regex patterns
    fetch_pattern = re.compile(r"""(?:fetch|axios(?:\.(?:get|post|put|delete|patch))?)\s*\(\s*[`'"](/api[a-zA-Z0-9_\-\/{}$]*)['"`]""", re.IGNORECASE)
    hardcoded_url_pattern = re.compile(r"""['"`](http:\/\/(?:localhost|127\.0\.0\.1):\d{2,5}[a-zA-Z0-9_\-\/]*)['"`]""")
    fastapi_pattern = re.compile(r"""@(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*['"]([a-zA-Z0-9_\-\/{}]*)['"]""", re.IGNORECASE)
    express_pattern = re.compile(r"""(?:app|router)\.(get|post|put|delete)\s*\(\s*['"]([a-zA-Z0-9_\-\/{}]*)['"]""", re.IGNORECASE)
    env_usage_pattern = re.compile(r"""(?:import\.meta\.env\.|process\.env\.)([A-Z0-9_]{3,})""")

    for item in root_path.rglob("*"):
        if any(part in IGNORE_DIRS for part in item.parts):
            continue
        if not item.is_file():
            continue

        ext = item.suffix.lower()
        rel_path = str(item.relative_to(root_path)).replace("\\", "/")

        if ext in {".ts", ".tsx", ".js", ".jsx"}:
            try:
                with open(item, "r", encoding="utf-8", errors="ignore") as f:
                    for line_no, line in enumerate(f, start=1):
                        # Detect frontend API calls
                        for match in fetch_pattern.finditer(line):
                            endpoint = match.group(1)
                            frontend_calls.append({
                                "endpoint": endpoint,
                                "file_path": rel_path,
                                "line_number": line_no,
                                "line": line.strip(),
                            })

                        # Detect hardcoded localhost URLs in client code
                        for match in hardcoded_url_pattern.finditer(line):
                            url = match.group(1)
                            findings.append({
                                "rule_id": "INT-HARDCODED-BACKEND-URL",
                                "title": "Hardcoded Backend URL in Client Source Code",
                                "category": "Integration",
                                "severity": "Medium",
                                "file_path": rel_path,
                                "line_number": line_no,
                                "description": f"Hardcoded address '{url}' found in source code. This will fail when deployed to production or preview environments.",
                                "recommendation": "Replace hardcoded origin URLs with configurable environment variables (e.g. VITE_API_BASE_URL).",
                                "code_snippet": line.strip()[:140],
                                "impact": "Prevents zero-configuration environment switching between local dev, staging, and production.",
                                "confidence": "High",
                            })

                        # Detect env var usage
                        for match in env_usage_pattern.finditer(line):
                            var_name = match.group(1)
                            env_keys_used.append({
                                "key": var_name,
                                "file_path": rel_path,
                                "line_number": line_no,
                            })

                        # Detect express routes in JS/TS
                        for match in express_pattern.finditer(line):
                            backend_endpoints.add(match.group(2))
            except Exception:
                pass

        elif ext == ".py":
            try:
                with open(item, "r", encoding="utf-8", errors="ignore") as f:
                    for line_no, line in enumerate(f, start=1):
                        for match in fastapi_pattern.finditer(line):
                            endpoint = match.group(2)
                            backend_endpoints.add(endpoint)
            except Exception:
                pass

    # Cross-reference frontend calls against detected backend endpoints
    if backend_endpoints and frontend_calls:
        # Normalize and compare
        clean_backend_routes = {
            re.sub(r"\{[a-zA-Z0-9_]+\}", "*", ep).rstrip("/")
            for ep in backend_endpoints if ep
        }

        for call in frontend_calls:
            call_path = call["endpoint"].split("?")[0].rstrip("/")
            normalized_call = re.sub(r"\$\{[a-zA-Z0-9_.]+\}", "*", call_path)
            normalized_call = re.sub(r"\/[0-9a-fA-F-]{4,}", "/*", normalized_call)

            # Check if any backend route matches
            has_match = any(
                b_route in normalized_call or normalized_call in b_route
                for b_route in clean_backend_routes
            )

            if not has_match and len(backend_endpoints) > 2:
                findings.append({
                    "rule_id": "INT-UNMATCHED-ENDPOINT",
                    "title": f"Unmatched API Endpoint Contract: '{call['endpoint']}'",
                    "category": "Integration",
                    "severity": "High",
                    "file_path": call["file_path"],
                    "line_number": call["line_number"],
                    "description": f"The frontend calls endpoint '{call['endpoint']}', but no matching decorator was discovered in backend route definitions.",
                    "recommendation": f"Verify backend route decorators or update the frontend API path to match the backend specification.",
                    "code_snippet": call["line"][:140],
                    "impact": "Clients will receive HTTP 404 Not Found at runtime when attempting this network invocation.",
                    "confidence": "Medium",
                })

    # Check for undeclared environment variables
    for usage in env_keys_used:
        var = usage["key"]
        # Filter standard built-ins
        if var in {"NODE_ENV", "MODE", "BASE_URL", "DEV", "PROD", "SSR"}:
            continue
        if env_keys_declared and var not in env_keys_declared:
            findings.append({
                "rule_id": "INT-MISSING-ENV-DECLARATION",
                "title": f"Undeclared Environment Variable '{var}'",
                "category": "Configuration",
                "severity": "Low",
                "file_path": usage["file_path"],
                "line_number": usage["line_number"],
                "description": f"Environment variable '{var}' is referenced in code but missing from .env.example or template configuration.",
                "recommendation": f"Add '{var}' with a placeholder value to your .env.example file so team members and CI pipelines know to configure it.",
                "code_snippet": f"import.meta.env.{var}",
                "impact": "New environment setups or automated deployments may fail due to missing configuration keys.",
                "confidence": "High",
            })

    return findings
