import time
import datetime
import uuid
import json
from typing import Dict, Any, List, Optional
import os
import copy

try:
    from backend.models import ScanResponse, ScanSummary, Finding, Endpoint, AuthConfig, CoverageMetrics
    from backend.openapi_parser import parse_openapi, OpenAPIParser
    from backend.bola_detector import detect_bola_vulnerabilities
    from backend.exposure_detector import detect_excessive_data_exposure
    from .llm import analyze_finding
except ImportError:
    from models import ScanResponse, ScanSummary, Finding, Endpoint, AuthConfig, CoverageMetrics
    from openapi_parser import parse_openapi, OpenAPIParser
    from bola_detector import detect_bola_vulnerabilities
    from exposure_detector import detect_excessive_data_exposure
    from llm import analyze_finding


class SentinelScanner:
    """
    Sentinel X Central Scanner Engine.
    
    Orchestrates the security auditing lifecycle:
    1. OpenAPI specification parsing & endpoint discovery
    2. Testable route identification & Security Test Planning
    3. BOLA / IDOR vulnerability probing with User A / User B auth
    4. Excessive sensitive data exposure auditing
    5. Evidence collection & severity aggregation
    """

    async def scan_openapi(
        self,
        spec_input: Any,
        target_url: str = "http://127.0.0.1:9000",
        custom_headers: Optional[Dict[str, str]] = None,
        auth_config: Optional[AuthConfig] = None,
        gemini_api_key: Optional[str] = None
    ) -> ScanResponse:
        start_time = time.time()
        start_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        scan_id = f"SCAN-{uuid.uuid4().hex[:8].upper()}"

        # 1. Parse OpenAPI & Discover endpoints
        parser = OpenAPIParser(spec_input)
        discovered_endpoints: List[Endpoint] = parser.extract_endpoints()
        base_target_url = parser.get_base_url(target_url)

        tests_run_count = 0
        findings: List[Finding] = []

        # Coverage metrics setup
        auth_endpoints_count = len([ep for ep in discovered_endpoints if ep.requires_auth])
        bola_candidates_count = len([ep for ep in discovered_endpoints if ep.path_params])
        exposure_candidates_count = len([ep for ep in discovered_endpoints if ep.method.upper() == "GET"])

        # 2. Run BOLA / IDOR Probing
        tests_run_count += bola_candidates_count
        bola_findings = await detect_bola_vulnerabilities(
            endpoints=discovered_endpoints,
            target_url=base_target_url,
            headers=custom_headers,
            auth_config=auth_config
        )
        findings.extend(bola_findings)

        # 3. Run Excessive Data Exposure Probing
        tests_run_count += exposure_candidates_count
        exposure_findings = await detect_excessive_data_exposure(
            endpoints=discovered_endpoints,
            target_url=base_target_url,
            headers=custom_headers
        )
        findings.extend(exposure_findings)

        # Enrich each finding with AI analysis using Gemini LLM
        for f in findings:
            try:
                ai_result = await analyze_finding(f, api_key=gemini_api_key)
                f.ai_analysis = ai_result
            except Exception as e:
                f.ai_analysis = {"error": str(e)}
        # 5. Aggregating Severity & Coverage Statistics
        summary = ScanSummary()
        confirmed_count = 0
        needs_review_count = 0

        for f in findings:
            sev = f.severity.upper()
            if sev == "CRITICAL":
                summary.critical += 1
            elif sev == "HIGH":
                summary.high += 1
            elif sev == "MEDIUM":
                summary.medium += 1
            elif sev == "LOW":
                summary.low += 1
            else:
                summary.info += 1
            summary.total += 1

            if f.confidence == "CONFIRMED":
                confirmed_count += 1
            else:
                needs_review_count += 1

        summary.confirmed = confirmed_count
        summary.needs_review = needs_review_count

        tot_ep = len(discovered_endpoints)
        auth_pct = round((auth_endpoints_count / tot_ep * 100.0), 1) if tot_ep > 0 else 0.0

        coverage = CoverageMetrics(
            auth_coverage_pct=auth_pct,
            bola_candidate_count=bola_candidates_count,
            exposure_candidate_count=exposure_candidates_count,
            confirmed_findings_count=confirmed_count,
            needs_review_count=needs_review_count
        )

        end_time = time.time()
        end_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        duration = round(end_time - start_time, 3)

        return ScanResponse(
            scan_id=scan_id,
            target_url=base_target_url,
            status="completed",
            endpoints_scanned=tot_ep,
            tests_run=tests_run_count,
            summary=summary,
            coverage=coverage,
            findings=findings,
            scan_started_at=start_iso,
            scan_completed_at=end_iso,
            duration_seconds=duration
        )

# Global scanner instance & utility function
_scanner_instance = SentinelScanner()

async def run_scan_pipeline(
    spec_input: Any,
    target_url: str = "http://127.0.0.1:9000",
    headers: Optional[Dict[str, str]] = None,
    auth_config: Optional[AuthConfig] = None,
    gemini_api_key: Optional[str] = None
) -> ScanResponse:
    """
    Public entry point to execute the Sentinel X security scan pipeline.
    """
    return await _scanner_instance.scan_openapi(
        spec_input,
        target_url,
        headers,
        auth_config=auth_config,
        gemini_api_key=gemini_api_key
    )

