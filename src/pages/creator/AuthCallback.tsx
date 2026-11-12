import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Immediately forward to /login so the user experiences the unified video & loader flow
    const searchParams = new URLSearchParams(location.search);
    if (!searchParams.has("oauth_callback")) {
      searchParams.set("oauth_callback", "true");
    }
    const newSearch = searchParams.toString();
    navigate(`/login?${newSearch}${location.hash}`, { replace: true });
  }, [navigate, location]);

  return (
    <div className="min-h-screen w-full bg-canvas text-ink flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white border border-black/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8 text-center space-y-4">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-black/8">
          <span className="font-display text-lg font-bold tracking-tight text-ink">
            sellr.
          </span>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-steel">
            AUTH // HANDSHAKE
          </span>
        </div>

        <div className="mx-auto w-12 h-12 rounded-xl bg-black/[0.03] border border-black/[0.06] flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-lava" />
        </div>

        <div className="space-y-1">
          <h1 className="font-display text-lg font-bold tracking-tight text-ink">
            Completing Sign In
          </h1>
          <p className="font-mono text-[11px] text-slate">
            Forwarding OAuth session to workspace...
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;