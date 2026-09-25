import React, { useState, useEffect } from 'react';
import { Play, Upload, FileText, Target, RefreshCw, Check, AlertTriangle, ShieldCheck, X, Database, ShieldAlert, Cpu, Zap } from 'lucide-react';
import FindingCard from './FindingCard';
import { DEFAULT_TARGET_URL } from '../api';

/* ANIMATED SCAN PROGRESS STEPPER COMPONENT */
function ScanningStepper() {
  const stages = [
    { num: '01', title: 'DISCOVERING API', detail: 'Parsing OpenAPI endpoints & route parameters' },
    { num: '02', title: 'ANALYZING AUTH', detail: 'Extracting Bearer security requirements & tokens' },
    { num: '03', title: 'TESTING OBJECT ACCESS', detail: 'Probing BOLA cross-tenant vectors (User A vs User B)' },
    { num: '04', title: 'ANALYZING RESPONSES', detail: 'Auditing HTTP response payloads for excessive data exposure' },
    { num: '05', title: 'BUILDING EVIDENCE', detail: 'Constructing HTTP evidence & attack replay vectors' },
    { num: '06', title: 'SCAN COMPLETE', detail: 'Finalizing LLM threat intelligence report' },
  ];

  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
    }, 450);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-[#0b101d] border border-[#1b253b] rounded-2xl p-8 space-y-6 shadow-2xl glass-card text-center">
      <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
        <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center">
          <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin" />
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-bold font-mono text-white tracking-wider uppercase">
          SENTINEL X ACTIVE AUDIT PIPELINE
        </h3>
        <p className="text-xs text-slate-400 font-mono">
          Probing target API on <code className="text-cyan-400">{DEFAULT_TARGET_URL}</code>
        </p>
      </div>

      {/* STEP STAGES */}
      <div className="max-w-2xl mx-auto space-y-2.5 pt-2">
        {stages.map((stage, idx) => {
          const isActive = idx === currentStep;
          const isDone = idx < currentStep;

          return (
            <div
              key={idx}
              className={`flex items-center gap-4 p-3.5 rounded-xl border transition-all duration-300 font-mono text-xs ${
                isActive
                  ? 'bg-[#101b33] border-cyan-500/50 text-cyan-300 shadow-md shadow-cyan-500/10'
                  : isDone
                  ? 'bg-[#080d19] border-[#162238] text-slate-400'
                  : 'bg-[#050810]/50 border-[#111827] text-slate-600'
              }`}
            >
              <span className={`font-bold ${isActive ? 'text-cyan-400 font-black' : isDone ? 'text-emerald-400' : 'text-slate-600'}`}>
                {stage.num}
              </span>

              <div className="flex-1 text-left">
                <div className={`font-bold ${isActive ? 'text-cyan-300' : isDone ? 'text-slate-300' : 'text-slate-500'}`}>
                  {stage.title}
                </div>
                <div className="text-[10px] font-sans text-slate-400 leading-none mt-0.5">
                  {stage.detail}
                </div>
              </div>

              {isActive && (
                <span className="text-[10px] text-cyan-400 font-bold animate-pulse px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">
                  IN PROGRESS
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard({ scanData, loading, scanError, onRunScan, onReplayAttack }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetUrl, setTargetUrl] = useState(DEFAULT_TARGET_URL);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [showDocModal, setShowDocModal] = useState(false);
  const [geminiKey, setGeminiKey] = useState('');

  const summary = scanData?.summary || { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
  const findings = scanData?.findings || [];

  const filteredFindings = findings.filter((f) => {
    if (filterCategory === 'ALL') return true;
    if (filterCategory === 'BOLA') return f.category === 'BOLA' || f.vulnerability_type?.includes('BOLA');
    if (filterCategory === 'EXPOSURE') return f.category === 'EXPOSURE' || f.vulnerability_type?.includes('Exposure');
    return true;
  });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="mx-auto space-y-10" style={{ maxWidth: '1400px', width: 'min(92vw, 1400px)' }}>
      
      {/* 1. HERO SECTION */}
      <div className="relative bg-[#0e1526]/90 border border-[#1b253b] rounded-2xl p-8 md:p-10 shadow-2xl overflow-hidden glass-card">
        {/* Subtle Technical Radial Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xs font-semibold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            AI API Security Engine
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight uppercase font-mono">
            SECURE YOUR API <br />
            <span className="text-cyan-400">BEFORE ATTACKERS DO.</span>
          </h1>

          <p className="text-sm md:text-base text-slate-300 font-sans leading-relaxed max-w-2xl">
            AI-assisted API security testing with verified evidence for authorization and data-exposure vulnerabilities.
          </p>

          <div className="pt-3 flex items-center gap-4 flex-wrap">
            <button
              onClick={() => {
                const el = document.getElementById('scan-target-card');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-black text-xs uppercase px-7 py-3.5 rounded-xl flex items-center gap-2 transition shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-black" />
              ⚡ SCAN API
            </button>
            <button
              onClick={() => setShowDocModal(true)}
              className="bg-[#141d33] hover:bg-[#1d2b4a] text-slate-200 border border-[#233559] font-mono text-xs font-semibold px-6 py-3.5 rounded-xl flex items-center gap-2 transition cursor-pointer uppercase"
            >
              <FileText className="w-4 h-4 text-cyan-400" />
              VIEW DOCUMENTATION
            </button>
          </div>
        </div>
      </div>

      {/* 2. SCAN CONFIGURATION & TARGET SETUP */}
      <div id="scan-target-card" className="bg-[#0e1526] border border-[#1b253b] rounded-2xl p-6 md:p-8 space-y-6 shadow-xl glass-card">
        <div className="flex items-center justify-between border-b border-[#1b253b] pb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" /> API SECURITY AUDIT CONFIGURATION
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure OpenAPI spec, target URL, and authorized test credentials for scanning.
            </p>
          </div>

          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-3 py-1 rounded-full">
            ● AUTHORIZED TESTING MODE
          </span>
        </div>

        {/* STEPPER STEP BADGES */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-[11px]">
          <div className="bg-[#070b14] p-2.5 rounded-lg border border-[#182645] flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px]">1</span>
            <span className="text-slate-300 font-bold">API Specification</span>
          </div>
          <div className="bg-[#070b14] p-2.5 rounded-lg border border-[#182645] flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px]">2</span>
            <span className="text-slate-300 font-bold">Target URL</span>
          </div>
          <div className="bg-[#070b14] p-2.5 rounded-lg border border-[#182645] flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px]">3</span>
            <span className="text-slate-300 font-bold">Auth Credentials</span>
          </div>
          <div className="bg-[#070b14] p-2.5 rounded-lg border border-[#182645] flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px]">4</span>
            <span className="text-slate-300 font-bold">Start Scan</span>
          </div>
        </div>

        {/* SAFETY NOTICE BANNER */}
        <div className="bg-[#081224] border border-[#16274a] rounded-xl p-3.5 text-xs text-slate-300 flex items-center gap-3 font-sans">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            <strong className="text-amber-300 font-mono">SAFETY MANDATE:</strong> Only scan APIs you own or have explicit authorization to test. No credentials or tokens are stored permanently.
          </span>
        </div>

        {/* CONFIG INPUTS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* LEFT: OpenAPI Drag & Drop File Upload */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
              OpenAPI / Swagger (JSON or YAML)
            </label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-[#1f2d47] hover:border-cyan-500/50 rounded-xl p-6 text-center bg-[#070b14] transition cursor-pointer flex flex-col items-center justify-center space-y-2 group"
            >
              <input
                type="file"
                accept=".json,.yaml,.yml"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload-input"
              />
              <label htmlFor="file-upload-input" className="cursor-pointer flex flex-col items-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#11192b] group-hover:bg-cyan-500/10 flex items-center justify-center transition">
                  <Upload className="w-5 h-5 text-cyan-400" />
                </div>
                {selectedFile ? (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-cyan-300 font-semibold flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" /> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      className="text-[11px] font-mono text-rose-400 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-slate-200 font-medium">
                      Drag & drop your OpenAPI spec file here, or <span className="text-cyan-400 underline font-semibold">browse</span>
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono mt-1">
                      Defaults to local <code className="text-cyan-400">demo/openapi.json</code> if omitted
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* RIGHT: Target Endpoint & Audit Button */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <label className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
                Target API Base URL
              </label>
              <input
                type="text"
                className="w-full bg-[#050810] border border-[#1b253b] rounded-lg p-3 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 transition"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder={DEFAULT_TARGET_URL}
              />
            </div>

            <div className="p-3 bg-[#070b14] border border-[#182645] rounded-xl space-y-1.5 font-mono text-[11px]">
              <div className="text-slate-400 font-bold uppercase text-[10px]">AUTHORIZED IDENTITIES</div>
              <div className="text-cyan-300 flex justify-between">
                <span>User A (Victim):</span>
                <span className="text-slate-400">{scanData?.findings?.[0]?.victim || 'Auto-discovered'} / Bearer Token</span>
              </div>
              <div className="text-amber-300 flex justify-between">
                <span>User B (Attacker):</span>
                <span className="text-slate-400">{scanData?.findings?.[0]?.attacker || 'Auto-discovered'} / Bearer Token</span>
              </div>
            </div>
            {/* Gemini API Key Input */}
            <div className="mt-4">
              <label className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
                Gemini API Key
              </label>
              <input
                type="password"
                autoComplete="off"
                className="w-full bg-[#050810] border border-[#1b253b] rounded-lg p-3 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 transition"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
              />
            </div>
            { !geminiKey.trim() && (
              <p className="text-xs text-amber-400 mt-1">Gemini API key is required to run the security audit.</p>
            ) }

            <button
              onClick={() => onRunScan(selectedFile, '', targetUrl, null, geminiKey)}
              disabled={loading || !geminiKey.trim()}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-black text-xs uppercase px-5 py-3.5 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-black" />}
              {loading ? 'EXECUTING AUDIT PIPELINE...' : '⚡ START SECURITY AUDIT'}
            </button>
          </div>
        </div>
      </div>

      {/* ERROR STATE */}
      {scanError && (
        <div className="bg-red-950/70 border border-red-800 rounded-2xl p-6 text-red-200 flex items-center justify-between gap-4 font-mono text-xs shadow-xl animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
            <div>
              <div className="font-bold text-red-300 uppercase">Scan Execution Error</div>
              <div className="text-slate-300 font-sans text-xs mt-0.5">{scanError}</div>
            </div>
          </div>
          <button
            onClick={() => onRunScan(selectedFile, '', targetUrl, null, geminiKey)}
            className="bg-red-900 hover:bg-red-800 text-white font-mono text-xs px-4 py-2 rounded-lg transition"
          >
            Retry Scan
          </button>
        </div>
      )}

      {/* ANIMATED SCAN PROGRESS */}
      {loading && <ScanningStepper />}

      {/* 3. SECURITY OVERVIEW KPI STAT CARDS & ATTACK SURFACE COVERAGE */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-[#0e1526] border border-[#1b253b] rounded-xl p-5 shadow-lg space-y-1 glass-card hover:border-[#2a3c61] transition">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">ENDPOINTS SCANNED</div>
            <div className="text-3xl font-extrabold text-white font-mono">{scanData?.endpoints_scanned || 0}</div>
          </div>
          <div className="bg-[#0e1526] border border-[#1b253b] rounded-xl p-5 shadow-lg space-y-1 glass-card hover:border-[#2a3c61] transition">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">SECURITY TESTS</div>
            <div className="text-3xl font-extrabold text-cyan-400 font-mono">{scanData?.tests_run || 0}</div>
          </div>
          <div className="bg-[#0e1526] border border-[#1b253b] rounded-xl p-5 border-t-4 border-t-red-500 shadow-lg space-y-1 glass-card hover:border-[#2a3c61] transition">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">CRITICAL</div>
            <div className="text-3xl font-extrabold text-red-400 font-mono">{summary.critical}</div>
          </div>
          <div className="bg-[#0e1526] border border-[#1b253b] rounded-xl p-5 border-t-4 border-t-orange-500 shadow-lg space-y-1 glass-card hover:border-[#2a3c61] transition">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">HIGH</div>
            <div className="text-3xl font-extrabold text-orange-400 font-mono">{summary.high}</div>
          </div>
          <div className="bg-[#0e1526] border border-[#1b253b] rounded-xl p-5 border-t-4 border-t-amber-500 shadow-lg space-y-1 glass-card col-span-2 md:col-span-1 hover:border-[#2a3c61] transition">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">CONFIRMED FINDINGS</div>
            <div className="text-3xl font-extrabold text-amber-400 font-mono">{summary.confirmed || summary.total}</div>
          </div>
        </div>

        {/* API ATTACK-SURFACE COVERAGE METRICS PANEL */}
        {scanData?.coverage && (
          <div className="bg-[#0b101d] border border-[#1b253b] rounded-xl p-4 font-mono text-xs grid grid-cols-1 md:grid-cols-3 gap-4 shadow-lg glass-card">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              <div>
                <div className="text-slate-400 text-[10px]">AUTHENTICATION COVERAGE</div>
                <div className="text-cyan-300 font-bold">{scanData.coverage.auth_coverage_pct}% of endpoints</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <div className="text-slate-400 text-[10px]">BOLA AUTHORIZATION VECTORS</div>
                <div className="text-amber-300 font-bold">{scanData.coverage.bola_candidate_count} test candidates</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <div>
                <div className="text-slate-400 text-[10px]">DATA EXPOSURE VECTORS</div>
                <div className="text-rose-300 font-bold">{scanData.coverage.exposure_candidate_count} GET routes audited</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. FINDINGS SECTION */}
      <div className="space-y-6">
        <div className="border-b border-[#1b253b] pb-4 flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-base font-extrabold font-mono text-white uppercase tracking-wider">
            SECURITY FINDINGS
          </h2>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setFilterCategory('ALL')}
              className={`text-xs font-mono font-semibold px-3.5 py-2 rounded-lg transition cursor-pointer ${
                filterCategory === 'ALL'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ALL ({findings.length})
            </button>
            <button
              onClick={() => setFilterCategory('BOLA')}
              className={`text-xs font-mono font-semibold px-3.5 py-2 rounded-lg transition cursor-pointer ${
                filterCategory === 'BOLA'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              BOLA / IDOR ({findings.filter((f) => f.category === 'BOLA' || f.vulnerability_type?.includes('BOLA')).length})
            </button>
            <button
              onClick={() => setFilterCategory('EXPOSURE')}
              className={`text-xs font-mono font-semibold px-3.5 py-2 rounded-lg transition cursor-pointer ${
                filterCategory === 'EXPOSURE'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              DATA EXPOSURE ({findings.filter((f) => f.category === 'EXPOSURE' || f.vulnerability_type?.includes('Exposure')).length})
            </button>
          </div>
        </div>

        {/* EMPTY STATE BEFORE FIRST SCAN */}
        {!loading && filteredFindings.length === 0 && (
          <div className="bg-[#0e1526] border border-dashed border-[#1b253b] rounded-2xl p-14 text-center space-y-4 glass-card">
            <div className="w-14 h-14 rounded-full bg-[#141d33] border border-[#233559] flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7 text-slate-500" />
            </div>
            <div className="space-y-1">
              <h3 className="font-mono text-sm font-bold text-slate-200 uppercase">
                {scanData ? 'No Findings Match Category' : 'No Security Scan Yet'}
              </h3>
              <p className="text-xs text-slate-400 font-sans max-w-md mx-auto">
                {scanData
                  ? 'No security findings matched the selected category filter.'
                  : 'Upload an OpenAPI specification to begin.'}
              </p>
            </div>
          </div>
        )}

        {/* FINDINGS CARDS */}
        {!loading && (
          <div className="space-y-4">
            {filteredFindings.map((finding) => (
              <FindingCard
                key={finding.id}
                finding={finding}
                onReplay={onReplayAttack}
              />
            ))}
          </div>
        )}
      </div>

      {/* DOCUMENTATION MODAL */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1526] border border-[#1b253b] rounded-2xl w-full max-w-2xl p-6 space-y-6 shadow-2xl glass-card">
            <div className="flex items-center justify-between border-b border-[#1b253b] pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                  Sentinel X Architecture & Documentation
                </h3>
              </div>
              <button onClick={() => setShowDocModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto">
              <h4 className="font-mono font-bold text-cyan-400 uppercase text-xs">1. BOLA / IDOR Verification Heuristics</h4>
              <p>
                Sentinel X authenticates two test identities (User A / Victim & User B / Attacker) by dynamically discovering the target API's login endpoint. It probes object endpoints with User B's token. If User B receives <code className="text-emerald-400">HTTP 200 OK</code> containing User A's payload, BOLA is confirmed with evidence.
              </p>

              <h4 className="font-mono font-bold text-cyan-400 uppercase text-xs">2. Excessive Data Exposure Auditing</h4>
              <p>
                The exposure detector recursively inspects JSON response keys for credentials (<code className="text-rose-400">password_hash, api_key, ssn, credit_card</code>) and internal data (<code className="text-amber-400">phone, internal_notes, role</code>).
              </p>

              <h4 className="font-mono font-bold text-cyan-400 uppercase text-xs">3. Gemini AI Analysis Enrichment</h4>
              <p>
                Verified evidence payloads are analyzed by the LLM layer to produce executive threat summaries, business impact scores, reproduction procedures, and code fixes.
              </p>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowDocModal(false)}
                className="bg-[#162035] hover:bg-[#202d4a] text-slate-200 text-xs px-4 py-2 rounded-lg font-mono font-semibold cursor-pointer"
              >
                Close Documentation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
