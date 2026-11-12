import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import CreatorLayout from "@/layouts/CreatorLayout";
import { Loader2 } from "lucide-react";

const SubmitClip = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (campaignId) {
      navigate(`/creator/dashboard/${campaignId}?submit=true`, { replace: true });
    } else {
      navigate("/creator/dashboard", { replace: true });
    }
  }, [campaignId, navigate]);

  return (
    <CreatorLayout>
      <div className="flex flex-col items-center justify-center h-72 gap-3 rounded-2xl bg-white border border-black/10 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <Loader2 className="h-6 w-6 animate-spin text-lava" />
        <p className="font-mono text-xs font-bold uppercase tracking-wider text-slate">
          Redirecting to campaign view...
        </p>
      </div>
    </CreatorLayout>
  );
};

export default SubmitClip;
