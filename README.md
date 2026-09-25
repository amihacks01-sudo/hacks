# Sentinel X 🛡️
**AI API Security Engine — Hackathon MVP**

Sentinel X is an AI-powered API security testing scanner that ingests OpenAPI / Swagger specifications, auto-discovers API attack surfaces, conducts automated security probing for BOLA / IDOR and Excessive Data Exposure against an authorized target API sandbox, gathers HTTP request/response evidence, enriches findings with LLM threat intelligence, and presents findings in a SOC-grade cybersecurity dashboard.

---

## 📁 Directory Architecture

```
sentinel-x/
├── backend/
│   ├── main.py                # FastAPI Server & Scan API Endpoints
│   ├── scanner.py             # Security Scan Pipeline Orchestration
│   ├── openapi_parser.py      # OpenAPI 2.0 / 3.0 Spec Parser
│   ├── bola_detector.py       # Broken Object Level Authorization Probing
│   ├── exposure_detector.py   # Excessive Sensitive Data Leakage Probing
│   ├── llm.py                 # LLM Security Analysis & Remediation Engine
│   └── models.py              # Pydantic Data Contracts & Finding Models
├── vulnerable-api/
│   └── main.py                # Authorized Local Sandbox Target API (Port 8001)
├── frontend/
│   ├── index.html             # HTML Shell
│   ├── src/
│   │   ├── App.jsx            # Main React Shell & Header Navigation
│   │   ├── api.js             # API Integration Layer
│   │   └── components/
│   │       ├── Dashboard.jsx  # Security Ops Center Dashboard & Scan Controls
│   │       ├── FindingCard.jsx# Security Finding Component & Severity Badges
│   │       └── RequestViewer.jsx # Request / Response Evidence Modal & Inspector
│   └── package.json           # React + Tailwind CSS Dependencies
├── demo/
│   └── openapi.json           # Sample OpenAPI Spec for Demo Verification
├── requirements.txt           # Python Dependencies
├── .env                       # Environment Variables
├── .gitignore                 # Git Exclusions
└── README.md                  # Project Documentation
```

---

## 🚀 Quick Start Guide

### 1. Install Backend Dependencies
```bash
pip install -r requirements.txt
```

### 2. Start the Vulnerable Target Sandbox API (Port 8001)
```bash
python vulnerable-api/main.py
```

### 3. Start the Sentinel X Scanner Engine Backend (Port 8000)
```bash
python backend/main.py
```

### 4. Install & Run Frontend Cybersecurity Dashboard
```bash
cd frontend
npm install
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** to access the **Sentinel X AI Security Operations Center**.
