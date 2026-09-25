import json
import httpx
import sys

def test_demo_api():
    print("\n--- TEST A: EXISTING LOCALHOST:9000 DEMO API ---")
    with open("demo/openapi.json", "r") as f:
        spec = json.load(f)

    r = httpx.post(
        "http://127.0.0.1:8000/api/scan",
        data={"target_url": "http://127.0.0.1:9000", "spec_json_str": json.dumps(spec)},
        timeout=15.0
    )
    print(f"Demo Scan Status Code: {r.status_code}")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"

    data = r.json()
    findings = data.get("findings", [])
    print(f"Demo Total Findings: {len(findings)}")
    assert len(findings) >= 2, f"Expected findings, got {len(findings)}"

    bola_found = any(f["category"] == "BOLA" for f in findings)
    exp_found = any(f["category"] == "EXPOSURE" for f in findings)
    assert bola_found, "Demo BOLA finding missing!"
    assert exp_found, "Demo Exposure finding missing!"
    print("PASS: Demo API BOLA and Exposure findings verified!")

def test_second_mock_api():
    print("\n--- TEST B: SECOND MOCK API WITH DIFFERENT ENDPOINTS (/customers/{customer_id}, /invoices/{invoice_id}) ---")
    
    mock_spec_yaml = """
openapi: 3.0.0
info:
  title: E-Commerce Invoicing API
  version: 1.0.0
paths:
  /customers/{customer_id}:
    get:
      summary: Get Customer Profile
      parameters:
        - name: customer_id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: OK
  /invoices/{invoice_id}:
    get:
      summary: Get Invoice Details
      parameters:
        - name: invoice_id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: OK
  /projects/{project_id}:
    get:
      summary: Get Project Data
      parameters:
        - name: project_id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: OK
"""

    auth_config = {
        "user_a": {"name": "Tenant Alpha", "auth_type": "bearer", "token": "alpha_token_123"},
        "user_b": {"name": "Tenant Beta", "auth_type": "bearer", "token": "beta_token_456"}
    }

    r = httpx.post(
        "http://127.0.0.1:8000/api/scan",
        data={
            "target_url": "http://127.0.0.1:9000",
            "spec_json_str": mock_spec_yaml,
            "auth_config_json": json.dumps(auth_config)
        },
        timeout=15.0
    )
    print(f"Mock API Scan Status Code: {r.status_code}")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"

    data = r.json()
    print(f"Mock Endpoints Scanned: {data.get('endpoints_scanned')}")
    assert data.get("endpoints_scanned") == 3, f"Expected 3 endpoints, got {data.get('endpoints_scanned')}"

    print(f"Mock Tests Run: {data.get('tests_run')}")
    print(f"Mock Coverage Metrics: {data.get('coverage')}")
    assert data.get("coverage", {}).get("bola_candidate_count") == 3

    print("PASS: Generic OpenAPI discovery and BOLA test planning for second API verified successfully!")

def main():
    test_demo_api()
    test_second_mock_api()
    print("\nSUCCESS: ALL GENERIC API SCANNER QA TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    main()
