import React, { useState } from 'react';
import { ShieldAlert, Terminal, Play, CheckCircle2, AlertTriangle, Key } from 'lucide-react';
import RequestViewer from './RequestViewer';

export default function FindingCard({ finding, onReplay }) {
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [replaying, setReplaying] = useState(false);
  const [replaySuccess, setReplaySuccess] = useState(false);

  // Parse AI Report JSON if string
  let aiReport = null;
  if (finding.ai_analysis) {
    try {
      aiReport = typeof finding.ai_analysis === 'string' ? JSON.parse(finding.ai_analysis) : finding.ai_analysis;
    } catch (e) {
      aiReport = { explanation: finding.ai_analysis };
    }
  }

  const severityStyles = {
    CRITICAL: {
      bg: 'bg-red-950/60',
      text: 'text-red-400',
      border: 'border-red-900/80',
      accent: 'border-l-red-500',
      badgeIcon: '🔴',
    },
    HIGH: {
      bg: 'bg-orange-950/60',
      text: 'text-orange-400',
      border: 'border-orange-900/80',
      accent: 'border-l-orange-500',
      badgeIcon: '🟠',
    },
    MEDIUM: {
      bg: 'bg-amber-950/60',
      text: 'text-amber-400',
      border: 'border-amber-900/80',
      accent: 'border-l-amber-500',
      badgeIcon: '🟡',
    },
    LOW: {
      bg: 'bg-blue-950/60',
      text: 'text-blue-400',
      border: 'border-blue-900/80',
      accent: 'border-l-blue-500',
      badgeIcon: '🔵',
    },
  };

  const style = severityStyles[finding.severity] || severityStyles.HIGH;
  const isBola = finding.category === 'BOLA' || finding.vulnerability_type?.includes('BOLA');

  const handleReplayClick = async (e) => {
    e.stopPropagation();
    if (!onReplay) return;
    setReplaying(true);
    try {
      await onReplay(finding.id);
      setReplaySuccess(true);
      setTimeout(() => setReplaySuccess(false), 3000);
      setShowEvidenceModal(true);
    } catch (err) {
      alert('Replay failed: ' + err.message);
    } finally {
      setReplaying(false);
    }
  };

  return (
    <div
      onClick={() => setShowEvidenceModal(true)}
      className={`bg-[#0e1526]/90 backdrop-blur-md border border-[#1b253b] rounded-2xl p-6 transition-all duration-200 border-l-4 ${style.accent} hover:border-[#2b3c5e] shadow-xl mb-5 cursor-pointer group glass-card`}
    >
      {/* HEADER BAR */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-[#1b253b]/80">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span
            className={`text-[11px] font-mono font-black tracking-wider uppercase px-3 py-1 rounded-lg border ${style.bg} ${style.text} ${style.border}`}
          >
            {style.badgeIcon} {finding.severity}
          </span>
          <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-lg bg-[#141d33] text-cyan-400 border border-[#203157]">
            {isBola ? 'BOLA / IDOR' : 'DATA EXPOSURE'}
          </span>
        </div>

        <span className="text-[11px] font-mono font-extrabold px-3 py-1 rounded-lg bg-emerald-950/50 text-emerald-400 border border-emerald-900/60 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          {finding.confidence === 'CONFIRMED' || isBola ? '✓ CONFIRMED' : 'POTENTIAL'}
        </span>
      </div>

      {/* ENDPOINT ROUTE BADGE */}
      <div className="mt-4">
        <span className="text-xs font-mono font-bold text-emerald-400 bg-[#060a14] px-2.5 py-1 rounded border border-[#162138] mr-2">
          {finding.method}
        </span>
        <code className="text-sm font-mono text-cyan-300 font-semibold bg-[#060a14] px-3 py-1.5 rounded-lg border border-[#162138]">
          {finding.endpoint}
        </code>
      </div>

      {/* VULNERABILITY TITLE & SUMMARY */}
      <div className="mt-3 space-y-1">
        <h3 className="font-semibold text-slate-100 text-base">
          {finding.title}
        </h3>
        <p className="text-xs text-slate-300 font-sans leading-relaxed">
          {aiReport?.summary || aiReport?.explanation || finding.description}
        </p>
      </div>

      {/* EXPOSED FIELD CHIPS (FOR EXPOSURE FINDINGS) */}
      {!isBola && finding.exposed_fields && finding.exposed_fields.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[#1b253b]/60 space-y-2">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-rose-400" /> EXPOSED SENSITIVE PROPERTIES:
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {finding.exposed_fields.map((field, idx) => (
              <span
                key={idx}
                className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-rose-950/40 text-rose-300 border border-red-900/50 font-medium"
              >
                {field}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* EXPECTED vs ACTUAL METRICS TABLE (FOR BOLA FINDINGS) */}
      {isBola && (
        <div className="mt-4 pt-3 border-t border-[#1b253b]/60 grid grid-cols-3 gap-3 font-mono text-center text-xs">
          <div className="bg-[#060a14] p-2.5 rounded-lg border border-[#1b253b]">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">EXPECTED</div>
            <div className="text-emerald-400 font-extrabold mt-0.5">{finding.expected_status || 403} Forbidden</div>
          </div>
          <div className="bg-[#1a0a0a] p-2.5 rounded-lg border border-[#4a1b1b]">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">ACTUAL</div>
            <div className="text-red-400 font-extrabold mt-0.5">{finding.actual_status || 200} OK ⚠️</div>
          </div>
          <div className="bg-[#060a14] p-2.5 rounded-lg border border-[#1b253b]">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">CONFIDENCE</div>
            <div className="text-cyan-400 font-extrabold mt-0.5">{finding.confidence || 'CONFIRMED'}</div>
          </div>
        </div>
      )}

      {/* CARD BOTTOM ACTIONS */}
      <div className="mt-5 pt-4 border-t border-[#1b253b] flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={handleReplayClick}
          disabled={replaying}
          className="text-xs font-mono font-bold uppercase px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black flex items-center gap-2 transition shadow-md shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
        >
          {replaySuccess ? <CheckCircle2 className="w-4 h-4 text-black" /> : <Play className="w-4 h-4 fill-black" />}
          {replaying ? 'REPLAYING...' : replaySuccess ? 'REPLAYED' : '⚡ REPLAY ATTACK'}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowEvidenceModal(true);
          }}
          className="text-xs font-mono font-semibold px-4 py-2 rounded-xl bg-[#141d33] hover:bg-[#1d2b4a] text-cyan-300 border border-[#233559] flex items-center gap-2 transition cursor-pointer"
        >
          <Terminal className="w-4 h-4 text-cyan-400" />
          VIEW EVIDENCE
        </button>
      </div>

      {/* REQUEST EVIDENCE MODAL */}
      {showEvidenceModal && (
        <RequestViewer
          finding={finding}
          onClose={() => setShowEvidenceModal(false)}
          onReplay={onReplay}
        />
      )}
    </div>
  );
}
