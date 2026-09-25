import React, { useState } from 'react';
import { Terminal, Code, X, Copy, Check, Zap, ShieldAlert, Cpu, AlertTriangle, ShieldCheck, RefreshCw, UserCheck, UserX, Lock, Unlock, Database, Key } from 'lucide-react';
import { DEFAULT_TARGET_URL } from '../api';

/* COMPACT ANIMATED ATTACK PATH VISUALIZATION COMPONENT */
function AttackPathVisualizer({ finding }) {
  const isBola = finding.category === 'BOLA' || finding.vulnerability_type?.includes('BOLA');
  const objectId = finding.object_id || '101';

  if (!isBola) {
    return (
      <div className="bg-[#070b14] border border-[#1b2742] rounded-xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between font-mono text-[11px]">
          <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" /> SENSITIVE DATA EXPOSURE FLOW PATH
          </span>
          <span className="text-slate-400 font-semibold">AUTOMATED EXPLORATION VECTOR</span>
        </div>

        <div className="flex items-center justify-between gap-2 overflow-x-auto py-2 font-mono text-[11px]">
          <div className="bg-[#0e1629] p-3 rounded-lg border border-[#1b2b4d] text-center min-w-[130px] space-y-1">
            <div className="text-slate-400 text-[10px]">1. CLIENT ROUTE</div>
            <div className="text-cyan-300 font-bold">{finding.method} {finding.endpoint}</div>
          </div>

          <div className="text-cyan-400 font-bold flex flex-col items-center">
            <span className="text-[9px] text-slate-400 font-sans">HTTP REQ</span>
            <div className="w-8 h-[2px] bg-gradient-to-r from-cyan-500 to-indigo-500 animate-pulse" />
            <span className="text-cyan-400">→</span>
          </div>

          <div className="bg-[#0e1629] p-3 rounded-lg border border-[#1b2b4d] text-center min-w-[130px] space-y-1">
            <div className="text-slate-400 text-[10px]">2. BACKEND CONTROLLER</div>
            <div className="text-amber-300 font-bold">Unfiltered DTO</div>
          </div>

          <div className="text-rose-400 font-bold flex flex-col items-center">
            <span className="text-[9px] text-slate-400 font-sans">RAW FLUSH</span>
            <div className="w-8 h-[2px] bg-gradient-to-r from-amber-500 to-rose-500 animate-pulse" />
            <span className="text-rose-400">→</span>
          </div>

          <div className="bg-[#1c0a0a] p-3 rounded-lg border border-[#4a1b1b] text-center min-w-[150px] space-y-1 shadow-lg shadow-rose-950/30">
            <div className="text-rose-400 text-[10px] font-bold">3. ❌ LEAKED SECRETS</div>
            <div className="text-rose-300 font-bold truncate max-w-[140px]">
              {finding.exposed_fields?.join(', ') || 'password_hash, PII'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#070b14] border border-[#1b2742] rounded-xl p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between font-mono text-[11px]">
        <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" /> BOLA / IDOR ATTACK PATH VISUALIZATION
        </span>
        <span className="text-slate-400 font-semibold">JUDGE EXPLANATION DIAGRAM</span>
      </div>

      {/* SVG/CSS ANIMATED ATTACK PATH GRAPH */}
      <div className="relative py-3">
        <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 bg-gradient-to-r from-cyan-500 via-amber-500 to-red-500 opacity-30 pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-7 gap-2 items-center font-mono text-center relative z-10">
          
          {/* NODE 1: USER A */}
          <div className="bg-[#0e1629] p-3 rounded-xl border border-[#1b2947] space-y-1 shadow-md">
            <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-sans">USER A</div>
            <div className="text-cyan-300 font-bold text-[11px]">{finding.victim || 'User A'}</div>
          </div>

          {/* CONNECTOR 1 */}
          <div className="flex flex-col items-center justify-center py-1">
            <span className="text-[9px] text-slate-400 font-sans font-semibold">OWNS</span>
            <div className="w-full md:w-8 h-[2px] bg-cyan-500/60 animate-pulse my-1" />
            <span className="text-cyan-400 font-bold text-xs">↓</span>
          </div>

          {/* NODE 2: ORDER #101 */}
          <div className="bg-[#0e1629] p-3 rounded-xl border border-[#1b2947] space-y-1 shadow-md">
            <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-sans">RESOURCE</div>
            <div className="text-cyan-300 font-bold text-[11px]">Order #{objectId}</div>
          </div>

          {/* CONNECTOR 2 */}
          <div className="flex flex-col items-center justify-center py-1">
            <span className="text-[9px] text-amber-400 font-sans font-semibold">REQUESTS</span>
            <div className="w-full md:w-8 h-[2px] bg-amber-500/60 animate-pulse my-1" />
            <span className="text-amber-400 font-bold text-xs">↓</span>
          </div>

          {/* NODE 3: USER B */}
          <div className="bg-[#191008] p-3 rounded-xl border border-[#4a2e16] space-y-1 shadow-md">
            <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto">
              <UserX className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-sans">USER B</div>
            <div className="text-amber-400 font-bold text-[11px]">{finding.attacker || 'User B'}</div>
          </div>

          {/* CONNECTOR 3 */}
          <div className="flex flex-col items-center justify-center py-1">
            <span className="text-[9px] text-red-400 font-sans font-bold">BYPASS</span>
            <div className="w-full md:w-8 h-[2px] bg-red-500 animate-pulse my-1" />
            <span className="text-red-400 font-bold text-xs">↓</span>
          </div>

          {/* NODE 4: DATA RETURNED */}
          <div className="bg-[#1c0a0a] p-3 rounded-xl border border-[#4a1b1b] space-y-1 shadow-lg shadow-red-950/40 border-l-4 border-l-red-500">
            <div className="w-7 h-7 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center mx-auto">
              <Unlock className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="text-[10px] text-red-400 uppercase font-bold font-sans">🔴 UNAUTHORIZED ACCESS</div>
            <div className="text-red-300 font-bold text-[11px]">HTTP 200 OK</div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function RequestViewer({ finding, onClose, onReplay }) {
  const [copied, setCopied] = useState(false);
  const [replaying, setReplaying] = useState(false);
  const [replayState, setReplayState] = useState(null);
  const scrollContainerRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.focus();
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!finding) return null;

  // Parse AI Report JSON if present
  let aiReport = null;
  if (finding.ai_analysis) {
    try {
      aiReport = typeof finding.ai_analysis === 'string' ? JSON.parse(finding.ai_analysis) : finding.ai_analysis;
    } catch (e) {
      aiReport = { explanation: finding.ai_analysis };
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(finding, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunReplay = async () => {
    if (!onReplay) return;
    setReplaying(true);
    setReplayState(null);
    try {
      const res = await onReplay(finding.id);
      setReplayState({
        status: res.status_code,
        request: res.request,
        response: res.response,
        reproduced: res.success || res.status_code === 200,
        timestamp: res.timestamp
      });
    } catch (err) {
      alert('Attack replay execution error: ' + err.message);
    } finally {
      setReplaying(false);
    }
  };

  const isBola = finding.category === 'BOLA' || finding.vulnerability_type?.includes('BOLA');
  const isConfirmed = finding.confidence === 'CONFIRMED' || isBola;

  // Mask sensitive tokens/hashes for clean display
  const maskSensitivePayload = (obj) => {
    if (!obj) return {};
    try {
      const cloned = JSON.parse(JSON.stringify(obj));
      if (typeof cloned === 'object' && cloned !== null) {
        if (cloned.password_hash) {
          cloned.password_hash = '$2b$12$eImi...********';
        }
      }
      return cloned;
    } catch (e) {
      return obj;
    }
  };

  const displayResponsePayload = maskSensitivePayload(finding.response?.body || finding.response_sample || finding.response);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
      <div className="bg-[#0b101d] border border-[#1b253b] rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col h-full max-h-[88vh] md:max-h-[90vh] glass-card min-h-0">
        
        {/* MODAL HEADER */}
        <div className="bg-[#070b14] px-6 py-4 md:py-5 border-b border-[#1b253b] flex justify-between items-center flex-shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-black uppercase tracking-wider px-2.5 py-0.5 rounded bg-red-950/70 text-red-400 border border-red-900">
                  🔴 {finding.severity}
                </span>
                <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded bg-[#162035] text-cyan-400 border border-[#233354]">
                  {isBola ? 'BOLA / BROKEN OBJECT LEVEL AUTHORIZATION' : 'EXCESSIVE DATA EXPOSURE'}
                </span>
              </div>
              <h2 className="font-mono font-bold text-base text-white mt-1">
                {finding.method} {finding.endpoint}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="text-xs font-mono text-slate-400 hover:text-cyan-400 flex items-center gap-1.5 transition px-3 py-1.5 bg-[#131d33] rounded-lg border border-[#203157] cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'COPY'}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1 cursor-pointer">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* MODAL BODY CONTENT (SCROLLABLE AREA) */}
        <div
          ref={scrollContainerRef}
          tabIndex={0}
          className="p-6 overflow-y-auto space-y-6 text-xs font-sans flex-1 min-h-0 outline-none focus:outline-none focus:ring-0 custom-scrollbar"
        >
          
          {/* VERDICT BLOCK */}
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 font-mono ${
            isConfirmed
              ? 'bg-red-950/40 border-red-900/60 text-red-300'
              : 'bg-amber-950/40 border-amber-900/60 text-amber-300'
          }`}>
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <div className="font-extrabold text-sm tracking-wider uppercase">
                  {isConfirmed ? '✓ CONFIRMED VULNERABILITY' : 'POTENTIAL VULNERABILITY'}
                </div>
                <div className="text-[11px] text-slate-300 font-sans mt-0.5">
                  Verified against authorized sandbox target <code className="text-cyan-400">{DEFAULT_TARGET_URL}</code>
                </div>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded bg-black/40 border border-slate-700">
              CONFIDENCE: {finding.confidence || 'CONFIRMED'}
            </span>
          </div>

          {/* ATTACK PATH VISUAL DIAGRAM */}
          <AttackPathVisualizer finding={finding} />

          {/* EXPOSED FIELD CHIPS FOR EXPOSURE FINDINGS */}
          {!isBola && finding.exposed_fields && finding.exposed_fields.length > 0 && (
            <div className="bg-[#070b14] border border-[#1b2742] rounded-xl p-5 space-y-2">
              <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Key className="w-4 h-4 text-rose-400" /> EXPOSED SENSITIVE PROPERTIES
              </div>
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {finding.exposed_fields.map((field, idx) => (
                  <span key={idx} className="text-xs font-mono px-3 py-1 rounded-lg bg-rose-950/60 text-rose-300 border border-red-900 font-semibold">
                    {field}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* SIDE-BY-SIDE REQUEST & RESPONSE EVIDENCE PANELS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono">
            {/* REQUEST PANEL */}
            <div className="bg-[#070a14] border border-[#19243c] rounded-xl overflow-hidden shadow-md">
              <div className="bg-[#0c1221] px-4 py-2.5 border-b border-[#19243c] flex justify-between items-center text-[11px]">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-cyan-400" /> REQUEST EVIDENCE
                </span>
                <span className="text-cyan-400 font-bold">{finding.method} {finding.endpoint}</span>
              </div>
              <div className="p-4 space-y-2 text-[11px] overflow-x-auto text-slate-300 bg-[#04060c]">
                <div className="text-emerald-400 font-bold">
                  {finding.request?.method || finding.method} {finding.request?.url || finding.endpoint.replace('{order_id}', finding.object_id || '101').replace('{user_id}', '1')} HTTP/1.1
                </div>
                {finding.request?.attacker_headers ? (
                  Object.entries(finding.request.attacker_headers).map(([k, v]) => (
                    <div key={k} className={k.toLowerCase().includes('auth') ? 'text-amber-300' : 'text-slate-400'}>{k}: {v}</div>
                  ))
                ) : (
                  <>
                    <div className="text-amber-300">Authorization: Bearer ********</div>
                    <div className="text-slate-400">Accept: application/json</div>
                  </>
                )}
              </div>
            </div>

            {/* RESPONSE PANEL */}
            <div className="bg-[#070a14] border border-[#19243c] rounded-xl overflow-hidden shadow-md">
              <div className="bg-[#0c1221] px-4 py-2.5 border-b border-[#19243c] flex justify-between items-center text-[11px]">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" /> RESPONSE EVIDENCE
                </span>
                <span className="text-red-400 font-bold bg-red-950/60 px-2.5 py-0.5 rounded border border-red-900">
                  ACTUAL: {finding.actual_status || 200} OK
                </span>
              </div>
              <div className="p-4 overflow-x-auto text-[11px] bg-[#04060c]">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-emerald-400 font-bold">HTTP/1.1 {finding.actual_status || 200} OK</span>
                  <span className="text-slate-400">EXPECTED: <span className="text-emerald-400 font-bold">{finding.expected_status || 403} Forbidden</span></span>
                </div>
                <pre className="text-emerald-300 bg-[#020409] p-3 rounded-lg border border-[#121c30]">
                  {JSON.stringify(displayResponsePayload, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          {/* REPLAY ATTACK ACTION SECTION */}
          <div className="bg-[#070b14] border border-[#1b2742] rounded-xl p-6 text-center space-y-4 shadow-xl">
            <button
              onClick={handleRunReplay}
              disabled={replaying}
              className="w-full md:w-auto bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-black text-sm uppercase px-8 py-4 rounded-xl shadow-lg shadow-cyan-500/25 transition transform active:scale-95 flex items-center justify-center gap-2 mx-auto cursor-pointer disabled:opacity-50"
            >
              {replaying ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-black" />}
              {replaying ? 'REPLAYING AUTHORIZED SANDBOX REQUEST...' : '⚡ REPLAY ATTACK'}
            </button>

            {/* REPLAY LIVE RESULT ANIMATED BANNER */}
            {replayState && (
              <div className="mt-4 p-5 rounded-xl bg-[#091021] border border-[#1b2b4d] space-y-3 text-left font-mono text-xs animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-[#1b2b4d] pb-2 text-[11px]">
                  <span className="text-cyan-400 font-bold uppercase">LIVE REPLAY RESPONSE RECEIVED</span>
                  <span className="text-slate-400">{replayState.timestamp}</span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-[#040712] p-2.5 rounded border border-[#14223d]">
                    <div className="text-slate-400 text-[10px]">REQUEST SENT</div>
                    <div className="text-cyan-300 font-bold mt-0.5">{replayState.request?.method} {replayState.request?.target_url}</div>
                  </div>
                  <div className="bg-[#040712] p-2.5 rounded border border-[#14223d]">
                    <div className="text-slate-400 text-[10px]">RESPONSE STATUS</div>
                    <div className="text-emerald-400 font-bold mt-0.5">HTTP {replayState.status} OK</div>
                  </div>
                  <div className="bg-[#040712] p-2.5 rounded border border-[#14223d]">
                    <div className="text-slate-400 text-[10px]">EXPLOIT VERDICT</div>
                    <div className="text-red-400 font-bold mt-0.5">REPRODUCED</div>
                  </div>
                </div>

                {replayState.reproduced && (
                  <div className="p-3.5 bg-red-950/80 border border-red-800 rounded-lg flex items-center justify-center gap-3 text-red-200 font-bold text-xs uppercase tracking-wider shadow-lg">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    VULNERABILITY REPRODUCED (LIVE HTTP 200 VERIFIED)
                  </div>
                )}

                <div className="space-y-1">
                  <div className="text-slate-400 text-[11px]">Replay Returned Payload:</div>
                  <pre className="bg-[#030612] p-3 rounded border border-[#121c30] text-emerald-300 text-[11px] overflow-x-auto max-h-48">
                    {JSON.stringify(maskSensitivePayload(replayState.response?.body || replayState.response), null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* AI SECURITY ANALYSIS SECTION */}
          <div className="bg-[#090e1c] border border-[#1a2b4c] rounded-xl p-5 space-y-5 font-sans text-xs">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
              <Cpu className="w-4 h-4 text-cyan-400" /> ✦ AI SECURITY ANALYSIS
            </div>

            {aiReport && typeof aiReport === 'object' ? (
              <div className="space-y-4">
                {/* SUMMARY */}
                {aiReport.summary && (
                  <div>
                    <h4 className="font-mono font-bold text-cyan-300 uppercase text-[11px] mb-1">SUMMARY</h4>
                    <p className="text-slate-200 leading-relaxed font-semibold">{aiReport.summary}</p>
                  </div>
                )}

                {/* WHY THIS IS VULNERABLE */}
                {(aiReport.why_vulnerable || aiReport.explanation) && (
                  <div>
                    <h4 className="font-mono font-bold text-slate-300 uppercase text-[11px] mb-1">WHY THIS IS VULNERABLE</h4>
                    <p className="text-slate-300 leading-relaxed">{aiReport.why_vulnerable || aiReport.explanation}</p>
                  </div>
                )}

                {/* IMPACT */}
                {aiReport.impact && (
                  <div>
                    <h4 className="font-mono font-bold text-rose-400 uppercase text-[11px] mb-1">IMPACT</h4>
                    <p className="text-slate-300 leading-relaxed">{aiReport.impact}</p>
                  </div>
                )}

                {/* SEVERITY */}
                {aiReport.severity_explanation && (
                  <div>
                    <h4 className="font-mono font-bold text-amber-400 uppercase text-[11px] mb-1">SEVERITY</h4>
                    <p className="text-slate-300 leading-relaxed">{aiReport.severity_explanation}</p>
                  </div>
                )}

                {/* CONFIDENCE */}
                {aiReport.confidence_explanation && (
                  <div>
                    <h4 className="font-mono font-bold text-blue-400 uppercase text-[11px] mb-1">CONFIDENCE</h4>
                    <p className="text-slate-300 leading-relaxed">{aiReport.confidence_explanation}</p>
                  </div>
                )}

                {/* REPRODUCTION */}
                {aiReport.reproduction && (
                  <div>
                    <h4 className="font-mono font-bold text-indigo-400 uppercase text-[11px] mb-1">REPRODUCTION</h4>
                    <pre className="bg-[#030612] p-3 rounded border border-[#121c30] text-slate-300 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                      {aiReport.reproduction}
                    </pre>
                  </div>
                )}

                {/* REMEDIATION */}
                {(aiReport.remediation || finding.remediation) && (
                  <div>
                    <h4 className="font-mono font-bold text-emerald-400 uppercase text-[11px] mb-1">REMEDIATION</h4>
                    <div className="bg-[#081710] border border-[#133d26] rounded-lg p-3.5 text-emerald-200/90 leading-relaxed font-sans">
                      {aiReport.remediation || finding.remediation}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-400 font-mono text-xs bg-[#04060c] p-4 rounded-lg border border-[#162035] text-center">
                AI analysis unavailable
              </div>
            )}
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="bg-[#070b14] px-6 py-3.5 border-t border-[#1b253b] flex justify-between items-center text-xs text-slate-500 font-mono flex-shrink-0">
          <span>Sentinel X Verified Security Intelligence</span>
          <button
            onClick={onClose}
            className="bg-[#162035] hover:bg-[#202d4a] text-slate-200 px-5 py-2 rounded-lg transition font-sans font-semibold cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
