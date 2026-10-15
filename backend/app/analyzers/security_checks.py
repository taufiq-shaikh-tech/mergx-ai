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

# Rule definitions: (rule_id, title, category, severity, regex_pattern, recommendation, impact)
SECURITY_RULES = [
    (
        "SEC-HARDCODED-AWS-KEY",
        "Hardcoded AWS Access Key ID Detected",
        "Security",
        "Critical",
        re.compile(r"""(?i)(?:aws_access_key_id|aws_key)?\s*[:=]\s*['"](AKIA[0-9A-Z]{16})['"]"""),
        "Store cloud provider credentials in secure environment variables or IAM roles.",
        "Compromised cloud credentials grant unauthorized actors programmatic access to your infrastructure.",
    ),
    (
        "SEC-HARDCODED-GITHUB-TOKEN",
        "Hardcoded GitHub Personal Access Token",
        "Security",
        "Critical",
        re.compile(r"""(ghp_[a-zA-Z0-9]{36})"""),
        "Revoke the exposed personal access token immediately and inject secrets via GitHub Actions or vault manager.",
        "Attackers can leverage this token to access or tamper with private source repositories and releases.",
    ),
    (
        "SEC-HARDCODED-PRIVATE-KEY",
        "Unencrypted Private Key Block in Source Code",
        "Security",
        "Critical",
        re.compile(r"""(-----BEGIN [A-Z ]*PRIVATE KEY-----)"""),
        "Never commit private keys to source control. Utilize a secrets manager or HSM.",
        "Leaked private keys compromise TLS communication and identity signatures across your fleet.",
    ),
    (
        "SEC-SQL-INJECTION-CONCAT",
        "Potential SQL Injection via Dynamic Query Construction",
        "Security",
        "High",
        re.compile(r"""(?i)(?:execute|raw|cursor\.execute)\s*\(\s*(?:f['"].*(?:SELECT|INSERT|UPDATE|DELETE).+\{.+['"]|['"].*(?:SELECT|INSERT|UPDATE|DELETE).*['"]\s*\+)"""),
        "Refactor to use parameterized SQL queries or ORM models instead of dynamic string concatenation.",
        "Allows malicious input to alter query syntax, exfiltrating or modifying entire database tables.",
    ),
    (
        "SEC-COMMAND-INJECTION",
        "Unsafe Command Execution with Shell=True",
        "Security",
        "High",
        re.compile(r"""(?:subprocess\.(?:Popen|run|call)\s*\(.+shell\s*=\s*True|os\.system\s*\()"""),
        "Pass arguments as a validated array to subprocess without invoking the system shell (shell=False).",
        "Untrusted inputs passed into shell commands can execute arbitrary operating system processes.",
    ),
    (
        "SEC-UNSAFE-EVAL",
        "Dangerous Dynamic Evaluation Construct (eval/exec)",
        "Security",
        "High",
        re.compile(r"""(?<!\w)(?:eval|exec)\s*\([^)]+\)"""),
        "Replace eval/exec with safe serialization parsers like json.loads() or ast.literal_eval().",
        "Executing dynamically evaluated strings leads to remote code execution (RCE).",
    ),
    (
        "SEC-PERMISSIVE-CORS",
        "Permissive CORS Wildcard with Credentials Enabled",
        "Security",
        "Medium",
        re.compile(r"""allow_origins\s*=\s*\[\s*["']\*["']\s*\].+allow_credentials\s*=\s*True""", re.DOTALL),
        "Specify explicit trusted domain origins instead of wildcard '*' when credentials are permitted.",
        "Enables cross-origin sites to execute authenticated credentialed requests on behalf of legitimate users.",
    ),
    (
        "SEC-DANGEROUS-HTML-RENDER",
        "Dangerous Raw HTML Rendering (dangerouslySetInnerHTML)",
        "Security",
        "Medium",
        re.compile(r"""(?:dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html|\.innerHTML\s*=)"""),
        "Sanitize HTML content using DOMPurify before injection, or use standard text elements.",
        "Permits Cross-Site Scripting (XSS) if unvalidated user-controlled text is rendered into the DOM.",
    ),
    (
        "SEC-HARDCODED-PASSWORD",
        "Likely Hardcoded Password or Secret in Configuration",
        "Security",
        "Medium",
        re.compile(r"""(?i)(?:password|secret_key|jwt_secret)\s*[:=]\s*['"][^"'\s]{8,}['"]"""),
        "Move secrets to environment variables and do not commit default credentials into code.",
        "Anyone with read access to the codebase can authenticate as privileged administrative entities.",
    ),
]


def redact_sensitive(text: str) -> str:
    """Masks secrets and sensitive tokens with asterisks."""
    text = re.sub(r"""(AKIA[0-9A-Z]{4})[0-9A-Z]{12}""", r"\1************", text)
    text = re.sub(r"""(ghp_[a-zA-Z0-9]{4})[a-zA-Z0-9]{32}""", r"\1********************************", text)
    text = re.sub(r"""(?i)(password|secret|jwt_secret)\s*[:=]\s*['"][^'"]+['"]""", r"\1 = '********'", text)
    return text


def analyze_security(root_path: Path) -> List[Dict[str, Any]]:
    """
    Performs rule-based static security checks over source code files,
    redacting secret tokens and returning structured finding dictionaries.
    """
    findings: List[Dict[str, Any]] = []

    for item in root_path.rglob("*"):
        if any(part in IGNORE_DIRS for part in item.parts):
            continue
        if not item.is_file():
            continue

        ext = item.suffix.lower()
        if ext not in {".py", ".ts", ".tsx", ".js", ".jsx", ".json", ".yaml", ".yml", ".env", ".env.local"}:
            continue

        rel_path = str(item.relative_to(root_path)).replace("\\", "/")

        try:
            with open(item, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            lines = content.splitlines()

            for rule_id, title, category, severity, pattern, rec, impact in SECURITY_RULES:
                # Check for line-by-line matches
                for line_no, raw_line in enumerate(lines, start=1):
                    if pattern.search(raw_line):
                        snippet = redact_sensitive(raw_line.strip()[:140])
                        findings.append({
                            "rule_id": rule_id,
                            "title": title,
                            "category": category,
                            "severity": severity,
                            "file_path": rel_path,
                            "line_number": line_no,
                            "description": f"{title} discovered in {rel_path} at line {line_no}.",
                            "recommendation": rec,
                            "code_snippet": snippet,
                            "impact": impact,
                            "confidence": "High",
                        })
                        # Stop at first match per rule per file to avoid flooding
                        break
        except Exception:
            pass

    return findings
