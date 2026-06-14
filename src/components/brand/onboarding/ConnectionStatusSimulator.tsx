import React, { useState } from "react";
import { CheckCircle2, RefreshCw, Terminal, Play } from "lucide-react";

interface ConnectionStatusSimulatorProps {
  gateway: string;
}

export const ConnectionStatusSimulator: React.FC<ConnectionStatusSimulatorProps> = ({ gateway }) => {
  const [status, setStatus] = useState<"listening" | "testing" | "success">("listening");
  const [logs, setLogs] = useState<string[]>([
    "Initializing Mipoe listener...",
    "Gateway security handshake complete.",
    "Status: Listening for conversion events..."
  ]);

  const handleTestPing = () => {
    if (status === "testing") return;
    setStatus("testing");
    setLogs((prev) => [...prev, `[Ping] Sending simulated test payload from ${gateway.toUpperCase()}...`]);
    
    setTimeout(() => {
      setLogs((prev) => [
        ...prev,
        `[Incoming] Received POST webhook event: 'payment.success'`,
        `[Verify] Verifying signature hash... PASS`,
        `[Process] Matching affiliate referral code... FOUND`,
        `[Sync] Synced to Mipoe API: Conversion created successfully!`,
        `[Success] HTTP 200 OK`
      ]);
      setStatus("success");
    }, 1800);
  };

  const resetSimulator = () => {
    setStatus("listening");
    setLogs([
      "Initializing Mipoe listener...",
      "Gateway security handshake complete.",
      "Status: Listening for conversion events..."
    ]);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-slate-100 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-5 h-5 text-indigo-450" />
          <div>
            <h5 className="font-bold text-xs text-slate-100">Live Integration Sandbox</h5>
            <p className="text-[10px] text-slate-400">Verify client-to-server webhook telemetry</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {status === "listening" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Listening
            </span>
          )}
          {status === "testing" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Testing Connection
            </span>
          )}
          {status === "success" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
              Verified Success
            </span>
          )}
        </div>
      </div>

      {/* Simulated Console Screen */}
      <div className="bg-slate-950 rounded-xl p-4 font-mono text-[10px] text-slate-350 border border-slate-800 h-40 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
        {logs.map((log, index) => {
          let color = "text-slate-400";
          if (log.includes("[Ping]")) color = "text-amber-400";
          if (log.includes("[Verify]")) color = "text-blue-400";
          if (log.includes("[Success]") || log.includes("successfully")) color = "text-emerald-400 font-semibold";
          return (
            <div key={index} className="flex gap-2">
              <span className="text-slate-650 select-none">{`>`}</span>
              <span className={color}>{log}</span>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center pt-1">
        <p className="text-[10px] text-slate-400">
          {status === "success" 
            ? "Connection test completed successfully. Ready for live traffic." 
            : `Click test connection to simulate a live event from ${gateway.toUpperCase()}.`}
        </p>
        
        <div className="flex gap-2">
          {status === "success" && (
            <button
              type="button"
              onClick={resetSimulator}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-all"
            >
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={handleTestPing}
            disabled={status === "testing"}
            className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3.5 py-2 rounded-lg transition-all shadow-md"
          >
            {status === "testing" ? (
              "Pinging..."
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                Test Connection
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
