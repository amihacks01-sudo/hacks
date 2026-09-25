import os
import json
import httpx
from typing import Dict, Any, Union, Optional
from dotenv import load_dotenv

load_dotenv()

class LLMAnalyzer:
    """
    Sentinel X AI Security Analysis Layer.
    
    Receives verified vulnerability findings from the scanner and produces structured
    explanations, impact analyses, severity justifications, reproduction steps, and fixes.
    Does NOT discover vulnerabilities; operates strictly on verified scanner evidence.
    """

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.provider = os.getenv("LLM_PROVIDER", "gemini").strip().lower()

    async def analyze_finding(self, finding_input: Union[Dict[str, Any], Any], api_key: Optional[str] = None) -> Dict[str, Any]:
        """
        Input: Verified finding object/dict containing:
        - vulnerability_type, endpoint, method, severity, attacker, victim,
          object_id, expected_status, actual_status, request, response, evidence, remediation

        Output: Structured Dictionary
        {
          "summary": "...",
          "why_vulnerable": "...",
          "impact": "...",
          "severity_explanation": "...",
          "confidence_explanation": "...",
          "reproduction": "...",
          "remediation": "..."
        }
        """
        if hasattr(finding_input, "dict"):
            finding = finding_input.dict()
        elif isinstance(finding_input, dict):
            finding = finding_input
        else:
            finding = {}

        vuln_type = finding.get("vulnerability_type", finding.get("category", "API Vulnerability"))
        endpoint = finding.get("endpoint", "")
        method = finding.get("method", "GET")
        severity = finding.get("severity", "HIGH")
        attacker = finding.get("attacker", "User B (Attacker)")
        victim = finding.get("victim", "User A (Victim)")
        object_id = finding.get("object_id", "101")
        expected_st = finding.get("expected_status", 403)
        actual_st = finding.get("actual_status", 200)
        confidence = finding.get("confidence", "CONFIRMED")
        remediation_text = finding.get("remediation", "")
        exposed_fields = finding.get("exposed_fields", [])

        req_info = json.dumps(finding.get("request", {}), indent=2)
        resp_info = json.dumps(finding.get("response", {}), indent=2)
        evidence_info = json.dumps(finding.get("evidence", {}), indent=2)

                # 1. Attempt LLM API call if GEMINI_API_KEY is configured
        effective_api_key = (
            api_key.strip()
            if api_key and api_key.strip()
            else self.api_key
        )
        if effective_api_key and effective_api_key != "your_gemini_api_key_here":
            try:
                prompt = f"""
You are the Sentinel X Senior Security Intelligence Engineer.
A deterministic security scanner has VERIFIED the following API vulnerability against an authorized local sandbox.
Your task is to analyze the HTTP evidence and produce a structured JSON security report.

DO NOT invent findings or alter the evidence. Operates strictly on the provided evidence.

VULNERABILITY VERIFIED EVIDENCE:
- Vulnerability Type: {vuln_type}
- Endpoint: {method} {endpoint}
- Assigned Severity: {severity}
- Attacker Identity: {attacker}
- Victim Identity: {victim}
- Targeted Object ID: {object_id}
- Expected HTTP Status: {expected_st}
- Actual HTTP Status Observed: {actual_st}
- Scanner Confidence: {confidence}

Request Evidence:
{req_info}

Response Evidence:
{resp_info}

Raw Evidence Details:
{evidence_info}

Original Remediation Guidance:
{remediation_text}

Respond ONLY with a single valid JSON object adhering strictly to this schema:
{{
  "summary": "Concise 1-sentence executive summary of the verified finding.",
  "why_vulnerable": "Detailed explanation of why the backend controller is vulnerable based on evidence.",
  "impact": "Business and technical impact of exploiting this issue.",
  "severity_explanation": "Justification of why this finding is assigned {severity} severity.",
  "confidence_explanation": "Explanation of why the scanner evidence confirms this issue with {confidence} confidence.",
  "reproduction": "Step-by-step reproduction instructions.",
  "remediation": "Concise code-level fix recommendation."
}}
"""
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key={effective_api_key}"
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(
                        url,
                        json={
                            "contents": [{"parts": [{"text": prompt}]}],
                            "generationConfig": {"response_mime_type": "application/json"}
                        }
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            raw_text = candidates[0]["content"]["parts"][0]["text"]
                            parsed = json.loads(raw_text)
                            if isinstance(parsed, dict) and "summary" in parsed and "why_vulnerable" in parsed:
                                return parsed
            except Exception:
                pass

        # 2. Deterministic Structured Fallback Engine
        # Ensures the application functions reliably without an external API key
        if "BOLA" in str(vuln_type).upper() or "IDOR" in str(vuln_type).upper():
            return {
                "summary": f"Confirmed BOLA/IDOR on {endpoint} allows {attacker} to access {victim}'s resource (Object ID {object_id}).",
                "why_vulnerable": f"The endpoint '{endpoint}' authenticates the caller token but fails to verify if the authenticated caller owns object '{object_id}' before returning the payload.",
                "impact": f"An authenticated user can access confidential resources belonging to other tenants by manipulating the object identifier parameter.",
                "severity_explanation": f"{severity} severity assigned because an attacker can achieve unauthorized cross-tenant data access.",
                "confidence_explanation": f"Confirmed because the scanner observed HTTP {actual_st} OK for {attacker} while requesting an object owned by {victim}, where HTTP {expected_st} Forbidden was expected.",
                "reproduction": f"1. Authenticate as {attacker}.\n2. Send HTTP {method} to '{endpoint.replace('{order_id}', object_id)}' with Bearer token.\n3. Observe HTTP {actual_st} returning {victim}'s object payload.",
                "remediation": remediation_text or "Enforce server-side object ownership checks before returning the resource: Validate 'request.user.id == resource.owner_id'."
            }
        elif "EXPOSURE" in str(vuln_type).upper():
            fields_str = ", ".join(exposed_fields) if exposed_fields else "password_hash, phone, internal_notes, role"
            return {
                "summary": f"Potential excessive data exposure identified on {endpoint} leaking sensitive attributes ({fields_str}).",
                "why_vulnerable": f"The endpoint '{endpoint}' serializes raw database entity objects containing sensitive internal fields without applying output data filtering schemas.",
                "impact": f"Exposing credentials or internal notes increases attack surface and facilitates account takeovers and social engineering.",
                "severity_explanation": f"{severity} severity assigned because unmasked sensitive credentials and internal notes are exposed in HTTP response payloads.",
                "confidence_explanation": f"High confidence because response inspection deterministically identified sensitive keys: {fields_str}.",
                "reproduction": f"1. Issue HTTP {method} to '{endpoint.replace('{user_id}', '1')}'.\n2. Inspect returned JSON response body.\n3. Verify unmasked sensitive keys ({fields_str}).",
                "remediation": remediation_text or "Utilize output Data Transfer Objects (DTOs) or field-level exclusion filters to strip sensitive properties before flushing HTTP responses."
            }
        else:
            return {
                "summary": f"Security concern verified on {method} {endpoint}.",
                "why_vulnerable": f"Endpoint '{endpoint}' exhibits insecure handling based on scanner HTTP evidence.",
                "impact": "Potential authorization or data exposure threat requiring developer inspection.",
                "severity_explanation": f"Assigned {severity} severity based on scanner heuristic evaluation.",
                "confidence_explanation": f"Confirmed via scanner HTTP request/response comparison.",
                "reproduction": f"1. Send HTTP {method} to '{endpoint}'.\n2. Audit response status and payload.",
                "remediation": remediation_text or "Apply standard OWASP API Security Top 10 hardening guidelines."
            }

# Global instance
_analyzer = LLMAnalyzer()

async def analyze_finding(finding: Union[Dict[str, Any], Any], api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Public entry point for scanner.py to run AI Analysis on a verified finding.
    """
    return await _analyzer.analyze_finding(finding, api_key=api_key)
