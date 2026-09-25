import json
import httpx
import sys

def main():
    print("[1] Reading demo/openapi.json...")
    with open("demo/openapi.json", "r") as f:
        spec = json.load(f)

    print("[2] Sending POST http://127.0.0.1:8000/api/scan...")
    payload = {
        "target_url": "http://127.0.0.1:9000",
        "openapi_spec": spec
    }

    try:
        r = httpx.post("http://127.0.0.1:8000/api/scan", json=payload, timeout=15.0)
    except Exception as e:
        print(f"Error connecting to backend: {e}")
        sys.exit(1)

    print(f"Backend Status Code: {r.status_code}")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"

    data = r.json()
    print(f"Scan ID: {data.get('scan_id')}")
    print(f"Total Findings: {len(data.get('findings', []))}")

    findings = data.get("findings", [])
    assert len(findings) > 0, "No findings returned!"

    required_keys = [
        "summary",
        "why_vulnerable",
        "impact",
        "severity_explanation",
        "confidence_explanation",
        "reproduction",
        "remediation"
    ]

    for i, finding in enumerate(findings):
        print(f"\n--- FINDING #{i+1}: {finding.get('vulnerability_type')} ({finding.get('endpoint')}) ---")
        ai_analysis = finding.get("ai_analysis")
        
        print(f"ai_analysis type: {type(ai_analysis)}")
        assert isinstance(ai_analysis, dict), f"Expected ai_analysis to be a dict, got {type(ai_analysis)}"
        
        for key in required_keys:
            val = ai_analysis.get(key)
            print(f"  - {key}: {val[:60] if val else 'MISSING'}...")
            assert key in ai_analysis, f"Missing key '{key}' in ai_analysis"
            assert val and len(str(val).strip()) > 0, f"Empty value for key '{key}'"

    print("\nSUCCESS: ALL TEST ASSERTIONS PASSED PERFECTLY!")

if __name__ == "__main__":
    main()
