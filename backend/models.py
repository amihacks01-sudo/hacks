from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class Endpoint(BaseModel):
    """
    Normalized Endpoint model representing an API attack surface route.
    """
    path: str
    method: str  # GET, POST, PUT, DELETE, PATCH, etc.
    summary: Optional[str] = ""
    description: Optional[str] = ""
    parameters: List[Dict[str, Any]] = Field(default_factory=list)
    path_params: List[str] = Field(default_factory=list)
    query_params: List[str] = Field(default_factory=list)
    request_body: Optional[Dict[str, Any]] = None
    requires_auth: bool = False
    tags: List[str] = Field(default_factory=list)

class UserIdentity(BaseModel):
    name: Optional[str] = None
    auth_type: str = "bearer"  # bearer, api_key, basic, none
    token: Optional[str] = None
    api_key_name: Optional[str] = "X-API-Key"
    api_key_value: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    headers: Dict[str, str] = Field(default_factory=dict)

class AuthConfig(BaseModel):
    user_a: Optional[UserIdentity] = None  # Primary test identity / Victim
    user_b: Optional[UserIdentity] = None  # Secondary test identity / Attacker
    global_auth_type: str = "none"  # bearer, api_key, basic, none
    global_token: Optional[str] = None
    global_api_key_name: Optional[str] = "X-API-Key"
    global_api_key_value: Optional[str] = None
    global_username: Optional[str] = None
    global_password: Optional[str] = None

class CoverageMetrics(BaseModel):
    auth_coverage_pct: float = 0.0
    bola_candidate_count: int = 0
    exposure_candidate_count: int = 0
    confirmed_findings_count: int = 0
    needs_review_count: int = 0

class ScanRequest(BaseModel):
    target_url: str = Field(..., example="http://127.0.0.1:9000")
    openapi_spec: Optional[Dict[str, Any]] = None
    openapi_spec_url: Optional[str] = None
    auth_config: Optional[AuthConfig] = None
    auth_token: Optional[str] = None
    headers: Optional[Dict[str, str]] = None

class Finding(BaseModel):
    id: str
    vulnerability_type: str = "BOLA/IDOR"
    title: str
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW, INFO
    category: str  # BOLA, EXPOSURE, AUTH
    endpoint: str
    method: str
    description: str
    attacker: Optional[str] = None
    victim: Optional[str] = None
    object_id: Optional[str] = None
    expected_status: Optional[int] = 403
    actual_status: Optional[int] = 200
    confidence: str = "CONFIRMED"  # CONFIRMED, HIGH, SUSPECTED, NEEDS_REVIEW
    exposed_fields: List[str] = Field(default_factory=list)
    response_sample: Optional[Dict[str, Any]] = None
    request: Dict[str, Any] = Field(default_factory=dict)
    response: Dict[str, Any] = Field(default_factory=dict)
    evidence: Dict[str, Any] = Field(default_factory=dict)
    remediation: str = ""
    ai_analysis: Optional[Dict[str, Any]] = None

class ScanSummary(BaseModel):
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    info: int = 0
    total: int = 0
    confirmed: int = 0
    needs_review: int = 0

class ScanResponse(BaseModel):
    scan_id: str
    target_url: str
    status: str
    endpoints_scanned: int
    tests_run: int
    summary: ScanSummary
    coverage: Optional[CoverageMetrics] = None
    findings: List[Finding]
    scan_started_at: str
    scan_completed_at: str
    duration_seconds: float

class ReplayRequest(BaseModel):
    finding_id: str

class ReplayResponse(BaseModel):
    finding_id: str
    success: bool
    status_code: int
    timestamp: str
    request: Dict[str, Any]
    response: Dict[str, Any]



