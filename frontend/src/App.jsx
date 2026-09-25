import React, { useState, useEffect } from 'react';
import './index.css';
import Dashboard from './components/Dashboard';
import { runScan, replayAttack, checkBackendHealth, fetchScanResult, DEFAULT_TARGET_URL } from './api';
import { Shield, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

/* COMPACT TOAST NOTIFICATION SYSTEM */
function ToastNotification({ toast, onClose }) {
  if (!toast) return null;

  const typeStyles = {
    success: 'bg-emerald-950/90 text-emerald-300 border-emerald-800/80',
    error: 'bg-red-950/90 text-red-300 border-red-800/80',
    info: 'bg-[#0f1b33] text-cyan-300 border-[#20345e]',
  };

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />,
    info: <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />,
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md text-xs font-mono max-w-md ${typeStyles[toast.type] || typeStyles.info}`}>
        {icons[toast.type]}
        <span className="flex-1 leading-snug">{toast.message}</span>
        <button onClick={onClose} className="text-slate-400 hover:text-white p-0.5 cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [scanData, setScanData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [backendStatus, setBackendStatus] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    verifyBackendAndLoad();
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const verifyBackendAndLoad = async () => {
    const isOnline = await checkBackendHealth();
    setBackendStatus(isOnline);
    if (isOnline) {
      try {
        const latest = await fetchScanResult('latest');
        if (latest && latest.scan_id) {
          setScanData(latest);
        }
      } catch (e) {
        // Ready for user-initiated scan
      }
    } else {
      showToast('error', 'Backend engine disconnected. Ensure port 8000 is active.');
    }
  };

  const handleRunScan = async (file = null, specJsonStr = '', targetUrl = DEFAULT_TARGET_URL, geminiKey = '', authConfig = null) => {
    setLoading(true);
    setScanError(null);
    showToast('info', 'Initiating Sentinel X Security Audit Pipeline...');

    try {
      const data = await runScan(file, specJsonStr, targetUrl, authConfig, geminiKey);
      setScanData(data);
      showToast('success', `Scan complete! Discovered ${data.summary?.total || 0} verified security findings.`);
    } catch (err) {
      setScanError(err.message || 'Scan execution encountered an unexpected error.');
      showToast('error', `Scan failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReplayAttack = async (findingId) => {
    try {
      const res = await replayAttack(findingId);
      showToast('success', `Live attack replay executed: HTTP ${res.status_code} response payload verified.`);
      return res;
    } catch (err) {
      showToast('error', `Replay failed: ${err.message}`);
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Premium Compact Top Navigation */}
      <header className="h-16 bg-[#090d18]/90 border-b border-[#1b253b] px-6 sticky top-0 z-40 backdrop-blur-xl">
        <div className="mx-auto h-full flex items-center justify-between" style={{ maxWidth: '1400px', width: 'min(92vw, 1400px)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white font-mono">
                  SENTINEL<span className="text-cyan-400">X</span>
                </span>
                <span className="text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded uppercase tracking-wider">
                  AI API SECURITY ENGINE
                </span>
              </div>
            </div>
          </div>

          {/* Tiny Status Indicators */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2 bg-[#0c1424] px-3.5 py-1.5 rounded-full border border-[#1b253b]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <span className="text-slate-300">Sandbox Connected <span className="text-slate-500">{DEFAULT_TARGET_URL}</span></span>
            </div>

            <div className="hidden sm:flex items-center gap-2 bg-[#0e1526] px-3.5 py-1.5 rounded-full border border-[#1b253b]">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendStatus === null
                    ? 'bg-amber-400 animate-pulse'
                    : backendStatus
                    ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                    : 'bg-rose-500'
                }`}
              />
              <span className="text-slate-300">
                {backendStatus === null
                  ? 'Connecting...'
                  : backendStatus
                  ? 'Scanner Engine Online'
                  : 'Backend Offline'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 py-8">
        <Dashboard
          scanData={scanData}
          loading={loading}
          scanError={scanError}
          onRunScan={handleRunScan}
          onReplayAttack={handleReplayAttack}
        />
      </main>

      {/* Toast Notification Container */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />

      {/* Compact Polished Footer */}
      <footer className="bg-[#070b14] border-t border-[#1b253b] px-6 py-4 text-center text-[11px] font-mono text-slate-500 uppercase tracking-widest">
        SENTINEL X • AI API SECURITY ENGINE • AUTHORIZED SANDBOX
      </footer>
    </div>
  );
}
