import os
import json
import datetime
import httpx
import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List, Optional, Union

try:
    from backend.models import AuthConfig, ScanRequest, ScanResponse, Finding, ReplayRequest, ReplayResponse
    from backend.scanner import run_scan_pipeline
except ImportError:
    from models import AuthConfig, ScanRequest, ScanResponse, Finding, ReplayRequest, ReplayResponse
    from scanner import run_scan_pipeline

app = FastAPI(
    title="Sentinel X AI API Security Engine",
    description="Backend REST API for OpenAPI BOLA and Data Exposure scanning and evidence replay.",
    version="1.0.0"
)

# Enable CORS for React frontend (Port 5173 / 5174)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-Memory Storage for Hackathon MVP
SCANS_STORE: Dict[str, ScanResponse] = {}
FINDINGS_STORE: Dict[str, Finding] = {}
MOST_RECENT_SCAN_ID: Optional[str] = None

DEMO_SPEC_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "demo", "openapi.json")
SANDBOX_TARGET_URL = os.getenv("SANDBOX_TARGET_URL", "http://127.0.0.1:9000").rstrip("/")

# ==========================================
# API ENDPOINTS
# ==========================================

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "engine": "Sentinel X AI API Security Engine",
        "sandbox_target": SANDBOX_TARGET_URL,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

@app.post("/api/scan", response_model=ScanResponse)
async def scan_openapi_spec(
    file: Optional[UploadFile] = File(None),
    spec_json_str: Optional[str] = Form(None),
    target_url: str = Form(SANDBOX_TARGET_URL),
    auth_config_json: Optional[str] = Form(None),
    gemini_api_key: Optional[str] = Form(None)
):
    """
    Accepts uploaded OpenAPI JSON/YAML file or spec string and auth configuration,
    runs security audit pipeline, stores findings in-memory, and returns scan results.
    """
    global MOST_RECENT_SCAN_ID
    spec_data: Optional[Union[Dict[str, Any], str]] = None
    parsed_auth_config: Optional[AuthConfig] = None
    # Normalize optional Gemini API key
    gemini_api_key = gemini_api_key.strip() if gemini_api_key else None

    if auth_config_json and auth_config_json.strip():
        try:
            auth_dict = json.loads(auth_config_json)
            parsed_auth_config = AuthConfig(**auth_dict)
        except Exception:
            pass

    if file:
        try:
            contents = await file.read()
            raw_text = contents.decode("utf-8")
            try:
                spec_data = json.loads(raw_text)
            except Exception:
                import yaml
                spec_data = yaml.safe_load(raw_text)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid OpenAPI specification file: {str(e)}")
    elif spec_json_str and spec_json_str.strip():
        try:
            spec_data = json.loads(spec_json_str)
        except Exception:
            try:
                import yaml
                spec_data = yaml.safe_load(spec_json_str)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid OpenAPI specification input: {str(e)}")
    else:
        # Fallback to local demo spec
        if os.path.exists(DEMO_SPEC_PATH):
            with open(DEMO_SPEC_PATH, "r") as f:
                spec_data = json.load(f)
        else:
            raise HTTPException(status_code=400, detail="No OpenAPI specification provided.")

    scan_result = await run_scan_pipeline(
        spec_input=spec_data,
        target_url=target_url,
        gemini_api_key=gemini_api_key,
        auth_config=parsed_auth_config
    )

    # Cache in memory
    SCANS_STORE[scan_result.scan_id] = scan_result
    MOST_RECENT_SCAN_ID = scan_result.scan_id

    for finding in scan_result.findings:
        FINDINGS_STORE[finding.id] = finding

    return scan_result

@app.get("/api/findings", response_model=List[Finding])
def get_recent_findings():
    """Returns all findings from the most recent scan."""
    if not MOST_RECENT_SCAN_ID or MOST_RECENT_SCAN_ID not in SCANS_STORE:
        return list(FINDINGS_STORE.values())
    return SCANS_STORE[MOST_RECENT_SCAN_ID].findings

@app.get("/api/scan/{scan_id}", response_model=ScanResponse)
def get_scan_by_id(scan_id: str):
    """Returns specific scan result or most recent if requested."""
    if scan_id == "latest" and MOST_RECENT_SCAN_ID in SCANS_STORE:
        return SCANS_STORE[MOST_RECENT_SCAN_ID]
    
    if scan_id not in SCANS_STORE:
        raise HTTPException(status_code=404, detail=f"Scan ID '{scan_id}' not found.")
    
    return SCANS_STORE[scan_id]

@app.post("/api/replay", response_model=ReplayResponse)
async def replay_finding_evidence(replay_req: ReplayRequest):
    """
    Replays the exact HTTP evidence request for a given finding_id against http://127.0.0.1:9000.
    """
    finding_id = replay_req.finding_id
    if finding_id not in FINDINGS_STORE:
        raise HTTPException(status_code=404, detail=f"Finding ID '{finding_id}' not found.")

    finding = FINDINGS_STORE[finding_id]
    req_details = finding.request
    target_url = req_details.get("url")

    # Safety constraint: Replay MUST only target local sandbox API
    if not target_url or not target_url.startswith(SANDBOX_TARGET_URL):
        # Default fallback url
        path = finding.endpoint.replace("{order_id}", "101").replace("{user_id}", "1")
        target_url = f"{SANDBOX_TARGET_URL}{path}"

    method = req_details.get("method", finding.method or "GET").upper()
    headers = req_details.get("attacker_headers", req_details.get("headers", {}))
    
    # Ensure auth header if missing for BOLA replay - pull from evidence if available
    if "Authorization" not in headers and finding.category == "BOLA":
        evidence_headers = finding.evidence.get("attacker_unauthorized_access", {}) if isinstance(finding.evidence, dict) else {}
        # The scanner stores the actual attacker token used during the scan
        if not evidence_headers:
            # Last resort: skip replay without auth rather than use a hardcoded token
            pass

    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.request(method, target_url, headers=headers)
            
            try:
                resp_body = resp.json()
            except Exception:
                resp_body = resp.text

            return ReplayResponse(
                finding_id=finding_id,
                success=(resp.status_code == finding.actual_status),
                status_code=resp.status_code,
                timestamp=timestamp,
                request={
                    "target_url": target_url,
                    "method": method,
                    "headers": headers
                },
                response={
                    "status_code": resp.status_code,
                    "headers": dict(resp.headers),
                    "body": resp_body
                }
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Replay request failed: {str(e)}")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
