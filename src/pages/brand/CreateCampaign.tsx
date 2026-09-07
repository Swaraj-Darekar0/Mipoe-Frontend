import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BrandLayout from "@/layouts/BrandLayout";
import { UgcCampaignBuilder } from "@/components/brand/UgcCampaignBuilder";
import { ClippingCampaignBuilder } from "@/components/brand/ClippingCampaignBuilder";
import { getBrandProfile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const CreateCampaign: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [businessCategory, setBusinessCategory] = useState<string>("Personal Agency");
  const [brandId, setBrandId] = useState<string>("1");
  const [checkingCompliance, setCheckingCompliance] = useState<boolean>(true);

  // Compliance check: ensure brand is verified before creating campaigns
  useEffect(() => {
    let isMounted = true;
    const checkCompliance = async () => {
      try {
        const profile = await getBrandProfile();
        if (!isMounted) return;

        if (profile.category) {
          setBusinessCategory(profile.category);
        }
        if (profile.id) {
          setBrandId(String(profile.id));
        }
        if (profile.onboarding_status !== "verified") {
          toast({
            title: "Access Restricted",
            description: "Please complete business verification to create campaigns.",
            variant: "destructive",
          });
          navigate("/brand/dashboard");
        }
      } catch (err) {
        console.error("Compliance check failed", err);
      } finally {
        if (isMounted) {
          setCheckingCompliance(false);
        }
      }
    };

    checkCompliance();
    return () => {
      isMounted = false;
    };
  }, [navigate, toast]);

  // Determine builder type from URL query parameter
  const campaignTypeParam = searchParams.get("type")?.toLowerCase();
  const isClipping = campaignTypeParam === "clipping";

  return (
    <BrandLayout>
      <div className="w-full max-w-4xl mx-auto py-2 sm:py-4">
        {checkingCompliance ? (
          <div className="flex flex-col items-center justify-center min-h-[360px] bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-8 text-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
            <p className="text-sm font-semibold text-zinc-700">Verifying brand authorization...</p>
            <p className="text-xs text-zinc-400 mt-1">Preparing campaign studio workspace</p>
          </div>
        ) : isClipping ? (
          <ClippingCampaignBuilder
            businessCategory={businessCategory}
            brandId={brandId}
          />
        ) : (
          <UgcCampaignBuilder
            businessCategory={businessCategory}
            brandId={brandId}
          />
        )}
      </div>
    </BrandLayout>
  );
};

export default CreateCampaign;