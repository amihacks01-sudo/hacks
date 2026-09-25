import httpx
import uuid
import json
import re
from typing import Dict, Any, List, Optional, Set
try:
    from backend.models import Finding, Endpoint
except ImportError:
    from models import Finding, Endpoint

# Category classification for sensitive response fields
HIGH_SEVERITY_FIELDS: Set[str] = {
    "password", "password_hash", "token", "access_token", "refresh_token",
    "secret", "api_key", "private_key", "ssn", "credit_card", "security_question"
}

MEDIUM_SEVERITY_FIELDS: Set[str] = {
    "phone", "email", "internal_notes", "role"
}

ALL_SENSITIVE_FIELDS: Set[str] = HIGH_SEVERITY_FIELDS.union(MEDIUM_SEVERITY_FIELDS)

class ExposureDetector:
    """
    Sentinel X Excessive Data Exposure Detector Engine.
    
    Deterministically audits HTTP response payloads for excessive sensitive fields
    (credentials, secrets, PII, internal notes, roles) without using an LLM.
    """

    def __init__(self, target_base_url: str = "http://127.0.0.1:9000"):
        self.base_url = target_base_url.rstrip("/")

    def _extract_keys(self, data: Any, found_keys: Optional[Set[str]] = None) -> Set[str]:
        """Recursively extracts all keys from dictionary/JSON structures."""
        if found_keys is None:
            found_keys = set()

        if isinstance(data, dict):
            for k, v in data.items():
                found_keys.add(str(k).lower())
                self._extract_keys(v, found_keys)
        elif isinstance(data, list):
            for item in data:
                self._extract_keys(item, found_keys)

        return found_keys

    async def scan_endpoint_exposure(
        self,
        endpoint: Endpoint,
        client: httpx.AsyncClient,
        headers: Optional[Dict[str, str]] = None
    ) -> Optional[Finding]:
        """Audits a single endpoint response for sensitive data leakage."""
        if endpoint.method.upper() != "GET":
            return None

        # Dynamically substitute any path parameter with sample value '1' or '101'
        sample_val = "101" if "order" in endpoint.path.lower() else "1"
        test_path = re.sub(r"\{[^}]+\}", sample_val, endpoint.path)
        full_url = f"{self.base_url}{test_path}"

        try:
            resp = await client.get(full_url, headers=headers or {}, timeout=5.0)
            if resp.status_code != 200:
                return None

            try:
                body_json = resp.json()
            except Exception:
                return None

            all_keys = self._extract_keys(body_json)
            detected_fields = [k for k in all_keys if k in ALL_SENSITIVE_FIELDS]

            if not detected_fields:
                return None

            # Determine severity
            has_high_secret = any(k in HIGH_SEVERITY_FIELDS for k in detected_fields)
            severity = "HIGH" if has_high_secret else "MEDIUM"

            sample_dict = body_json if isinstance(body_json, dict) else {"data": body_json}

            finding = Finding(
                id=f"EXP-{uuid.uuid4().hex[:6].upper()}",
                vulnerability_type="Excessive Data Exposure",
                title=f"Potential Excessive Data Exposure on {endpoint.path}",
                severity=severity,
                category="EXPOSURE",
                endpoint=endpoint.path,
                method=endpoint.method,
                description=(
                    f"The HTTP GET response payload from '{endpoint.path}' exposes sensitive internal properties: "
                    f"{', '.join(detected_fields)}. Returning internal attributes increases attack surface and risks credential leakage."
                ),
                confidence="HIGH",
                exposed_fields=detected_fields,
                response_sample=sample_dict,
                request={
                    "url": full_url,
                    "method": endpoint.method,
                    "headers": {k: ("Bearer ********" if "auth" in k.lower() else v) for k, v in (headers or {}).items()}
                },
                response={
                    "status_code": resp.status_code,
                    "headers": dict(resp.headers),
                    "body": sample_dict
                },
                evidence={
                    "detected_sensitive_fields": detected_fields,
                    "severity_reason": "High severity credentials/secrets detected" if has_high_secret else "Medium severity personal/internal fields detected",
                    "leaked_field_count": len(detected_fields)
                },
                remediation=(
                    "Implement output data transfer objects (DTOs) or field-level exclusion filters "
                    "to mask or omit sensitive parameters before flushing HTTP responses."
                )
            )

            return finding

        except Exception:
            return None

    async def detect_exposure(
        self,
        endpoints: List[Endpoint],
        headers: Optional[Dict[str, str]] = None
    ) -> List[Finding]:
        """Scans a list of endpoints for excessive data exposure."""
        findings: List[Finding] = []
        async with httpx.AsyncClient(timeout=5.0) as client:
            for ep in endpoints:
                f = await self.scan_endpoint_exposure(ep, client, headers)
                if f:
                    findings.append(f)
        return findings

async def detect_excessive_data_exposure(
    endpoints: List[Endpoint],
    target_url: str = "http://127.0.0.1:9000",
    headers: Optional[Dict[str, str]] = None
) -> List[Finding]:
    """
    Public entry point for scanner.py to run Excessive Data Exposure detection.
    """
    detector = ExposureDetector(target_url)
    return await detector.detect_exposure(endpoints, headers)

