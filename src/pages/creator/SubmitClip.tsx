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
      <div className="flex flex-col items-center justify-center h-72 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
        <p className="text-xs text-zinc-500 font-medium">Redirecting to campaign view...</p>
      </div>
    </CreatorLayout>
  );
};

export default SubmitClip;
