import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Sparkles } from "lucide-react";
import { API_BASE } from "@/lib/api";

const AffiliateRedirect: React.FC = () => {
  const { code } = useParams<{ code: string }>();

  useEffect(() => {
    if (code) {
      // Direct pass-through redirect to the backend tracking redirector
      window.location.replace(`${API_BASE}/api/brand/affiliate/public/redirect/${code}`);
    } else {
      window.location.replace("/");
    }
  }, [code]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-screen bg-slate-50 relative overflow-hidden">
      {/* Decorative gradients for premium aesthetic */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-violet-200/40 rounded-full blur-3xl -translate-x-12 -translate-y-12"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl translate-x-12 translate-y-12"></div>
      
      <div className="text-center space-y-5 relative z-10 p-6 max-w-sm w-full bg-white/70 backdrop-blur-md rounded-2xl border border-gray-150 shadow-xl animate-in fade-in zoom-in duration-300">
        <div className="relative inline-flex">
          <div className="p-4 bg-indigo-50 rounded-2xl">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
          <div className="absolute -top-1 -right-1 bg-amber-400 text-white p-1 rounded-lg animate-bounce">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>
        
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-gray-800 tracking-tight">Redirecting to store...</h2>
          <p className="text-xs text-gray-500 max-w-[280px] mx-auto leading-relaxed">
            Please wait while we establish a secure referral session.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AffiliateRedirect;
