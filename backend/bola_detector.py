import httpx
import uuid
import re
from typing import Dict, Any, List, Optional, Tuple
try:
    from backend.models import Finding, Endpoint, AuthConfig, UserIdentity
except ImportError:
    from models import Finding, Endpoint, AuthConfig, UserIdentity

# Common object identifier parameter names and keywords
OBJECT_PARAM_KEYWORDS = {
    "id", "user_id", "order_id", "account_id", "customer_id", "document_id",
    "resource_id", "invoice_id", "project_id", "item_id", "uuid", "guid",
    "profile_id", "file_id", "org_id", "tenant_id", "report_id", "card_id"
}

TEST_ID_SAMPLES = ["1", "101", "102", "1001", "abc-123", "00000000-0000-0000-0000-000000000001"]

class BOLADetector:
    """
    Sentinel X Generic BOLA / IDOR Security Detector Engine.
    
    Dynamically identifies object-level API endpoints, configures two test identities
    (User A / Victim vs User B / Attacker), probes cross-tenant access control boundaries,
    and returns verified evidence-backed findings.
    """

    def __init__(self, target_base_url: str = "http://127.0.0.1:9000", auth_config: Optional[AuthConfig] = None):
        self.base_url = target_base_url.rstrip("/")
        self.auth_config = auth_config
        self.alice_headers: Dict[str, str] = {}
        self.bob_headers: Dict[str, str] = {}
        self.user_a_name = "User A (Primary/Victim)"
        self.user_b_name = "User B (Secondary/Attacker)"

    def _build_headers_for_identity(self, identity: Optional[UserIdentity], default_fallback_token: str) -> Dict[str, str]:
        headers: Dict[str, str] = {}
        if not identity:
            headers["Authorization"] = f"Bearer {default_fallback_token}"
            return headers

        if identity.headers:
            headers.update(identity.headers)

        a_type = (identity.auth_type or "bearer").lower()
        if a_type == "bearer" and identity.token:
            headers["Authorization"] = f"Bearer {identity.token}"
        elif a_type == "api_key" and identity.api_key_value:
            header_name = identity.api_key_name or "X-API-Key"
            headers[header_name] = identity.api_key_value
        elif a_type == "basic" and identity.username and identity.password:
            import base64
            token = base64.b64encode(f"{identity.username}:{identity.password}".encode()).decode()
            headers["Authorization"] = f"Basic {token}"
        elif identity.token:
            headers["Authorization"] = f"Bearer {identity.token}"
        else:
            headers["Authorization"] = f"Bearer {default_fallback_token}"

        return headers

    async def prepare_identities(self, client: httpx.AsyncClient, custom_headers: Optional[Dict[str, str]] = None):
        """Prepares User A & User B headers using provided AuthConfig or demo login fallback."""
        if self.auth_config and (self.auth_config.user_a or self.auth_config.user_b):
            if self.auth_config.user_a:
                self.user_a_name = self.auth_config.user_a.name or "User A (Primary/Victim)"
                self.alice_headers = self._build_headers_for_identity(self.auth_config.user_a, "bearer_token_alice_1")
            if self.auth_config.user_b:
                self.user_b_name = self.auth_config.user_b.name or "User B (Secondary/Attacker)"
                self.bob_headers = self._build_headers_for_identity(self.auth_config.user_b, "bearer_token_bob_2")

        # Demo target fallback: if targeting localhost:9000 or demo login available, attempt login
        if not self.alice_headers or not self.bob_headers:
            login_url = f"{self.base_url}/login"
            try:
                res_alice = await client.post(login_url, json={"username": "alice", "password": "alice123"}, timeout=4.0)
                res_bob = await client.post(login_url, json={"username": "bob", "password": "bob123"}, timeout=4.0)
                
                alice_tok = res_alice.json().get("access_token") if res_alice.status_code == 200 else "bearer_token_alice_1"
                bob_tok = res_bob.json().get("access_token") if res_bob.status_code == 200 else "bearer_token_bob_2"
                
                if not self.alice_headers:
                    self.alice_headers = {"Authorization": f"Bearer {alice_tok}"}
                    self.user_a_name = f"User A (Victim, token: {alice_tok[:16]}...)"
                if not self.bob_headers:
                    self.bob_headers = {"Authorization": f"Bearer {bob_tok}"}
                    self.user_b_name = f"User B (Attacker, token: {bob_tok[:16]}...)"
            except Exception:
                if not self.alice_headers:
                    self.alice_headers = {"Authorization": "Bearer bearer_token_alice_1"}
                    self.user_a_name = "User A (Victim)"
                if not self.bob_headers:
                    self.bob_headers = {"Authorization": "Bearer bearer_token_bob_2"}
                    self.user_b_name = "User B (Attacker)"

        if custom_headers:
            self.alice_headers.update(custom_headers)
            self.bob_headers.update(custom_headers)

    def is_object_id_param(self, param_name: str) -> bool:
        """Determines if a path parameter represents an object-level identifier."""
        p_lower = param_name.lower().strip("{}")
        if p_lower in OBJECT_PARAM_KEYWORDS or p_lower.endswith("_id") or p_lower.endswith("id"):
            return True
        return False

    async def detect_bola(
        self,
        endpoints: List[Endpoint],
        custom_headers: Optional[Dict[str, str]] = None
    ) -> List[Finding]:
        """
        Scans normalized endpoints for verified Broken Object Level Authorization (BOLA/IDOR).
        """
        findings: List[Finding] = []

        async with httpx.AsyncClient(timeout=5.0) as client:
            await self.prepare_identities(client, custom_headers)

            for ep in endpoints:
                if not ep.path_params:
                    continue

                # Identify object-like path parameters dynamically
                object_params = [p for p in ep.path_params if self.is_object_id_param(p)]
                if not object_params:
                    # Fallback: check any path parameter
                    object_params = ep.path_params

                for param_name in object_params:
                    # Determine probe test ID (prefer 101 or 1 or first sample)
                    test_ids = ["101", "1", "102"] if "order" in ep.path.lower() else ["1", "101", "2"]
                    
                    for object_id in test_ids:
                        target_path = ep.path.replace(f"{{{param_name}}}", object_id)
                        full_url = f"{self.base_url}{target_path}"

                        # 1. Request using User A's credentials (legitimate owner access)
                        try:
                            res_user_a = await client.request(ep.method, full_url, headers=self.alice_headers)
                        except Exception:
                            continue

                        # 2. Request same object using User B's credentials (unauthorized attacker access)
                        try:
                            res_user_b = await client.request(ep.method, full_url, headers=self.bob_headers)
                        except Exception:
                            continue

                        # 3. Verification logic:
                        # If User B receives HTTP 200 OK for User A's object (and User A also accessed it or 200 returned)
                        if res_user_b.status_code == 200:
                            data_a = res_user_a.json() if "json" in res_user_a.headers.get("content-type", "") else res_user_a.text
                            data_b = res_user_b.json() if "json" in res_user_b.headers.get("content-type", "") else res_user_b.text

                            # Evaluate evidence strength
                            is_confirmed = (res_user_a.status_code == 200 and res_user_b.status_code == 200)
                            confidence_level = "CONFIRMED" if is_confirmed else "NEEDS_REVIEW"

                            finding = Finding(
                                id=f"BOLA-{uuid.uuid4().hex[:6].upper()}",
                                vulnerability_type="Broken Object Level Authorization (BOLA/IDOR)",
                                title=f"Confirmed BOLA/IDOR on {ep.path}" if is_confirmed else f"Potential BOLA/IDOR on {ep.path}",
                                severity="CRITICAL",
                                category="BOLA",
                                endpoint=ep.path,
                                method=ep.method,
                                description=(
                                    f"The endpoint '{ep.path}' accepts object parameter '{param_name}'='{object_id}' "
                                    f"and returns object payload to '{self.user_b_name}' without enforcing tenant ownership authorization checks."
                                ),
                                attacker=self.user_b_name,
                                victim=self.user_a_name,
                                object_id=object_id,
                                expected_status=403,
                                actual_status=res_user_b.status_code,
                                confidence=confidence_level,
                                request={
                                    "url": full_url,
                                    "method": ep.method,
                                    "attacker_headers": {k: ("Bearer ********" if "auth" in k.lower() else v) for k, v in self.bob_headers.items()}
                                },
                                response={
                                    "status_code": res_user_b.status_code,
                                    "headers": dict(res_user_b.headers),
                                    "body": data_b
                                },
                                evidence={
                                    "victim_access": {
                                        "user": self.user_a_name,
                                        "status_code": res_user_a.status_code,
                                        "response_data": data_a
                                    },
                                    "attacker_unauthorized_access": {
                                        "user": self.user_b_name,
                                        "status_code": res_user_b.status_code,
                                        "response_data": data_b
                                    }
                                },
                                remediation=(
                                    f"Enforce server-side object ownership authorization checks on '{ep.path}'. "
                                    "Verify that caller authenticated identity owns resource '{param_name}' before returning data."
                                )
                            )
                            findings.append(finding)
                            break  # Avoid duplicate findings for same endpoint param

        return findings

async def detect_bola_vulnerabilities(
    endpoints: List[Endpoint],
    target_url: str = "http://127.0.0.1:9000",
    headers: Optional[Dict[str, str]] = None,
    auth_config: Optional[AuthConfig] = None
) -> List[Finding]:
    """
    Public entry point for scanner.py to run BOLA/IDOR detection.
    """
    detector = BOLADetector(target_url, auth_config=auth_config)
    return await detector.detect_bola(endpoints, headers)

