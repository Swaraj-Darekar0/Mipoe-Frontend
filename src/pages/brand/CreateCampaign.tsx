import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BrandLayout from "@/layouts/BrandLayout";
import { UgcCampaignBuilder } from "@/components/brand/UgcCampaignBuilder";
import { ClippingCampaignBuilder } from "@/components/brand/ClippingCampaignBuilder";
import { PortalPageHeader } from "@/components/ui/PortalPrimitives";
import { Button } from "@/components/ui/button";
import { getBrandProfile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";

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
      <div className="w-full max-w-4xl mx-auto py-2 sm:py-4 space-y-6">
        <PortalPageHeader
          eyebrow="CAMPAIGN STUDIO"
          title={isClipping ? "Clipping" : "Influencer UGC"}
          highlighted="Studio"
          subtitle={
            isClipping
              ? "Configure source footage, view benchmarks, and CPV payouts for short-form editors."
              : "Set creator tiers, content briefs, and verified view payouts for UGC reels."
          }
          accent="brand"
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/brand/dashboard")}
              className="w-full sm:w-auto gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          }
        />

        {checkingCompliance ? (
          <div className="flex flex-col items-center justify-center min-h-[340px] bg-white rounded-2xl border border-black/10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] p-8 text-center">
            <Loader2 className="w-7 h-7 text-brand-blue animate-spin mb-3" />
            <p className="font-display text-sm font-semibold text-ink">
              Verifying brand authorization...
            </p>
            <p className="font-mono text-xs text-steel mt-1">
              Preparing campaign studio workspace
            </p>
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