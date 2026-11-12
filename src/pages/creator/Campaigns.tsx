import React, { useEffect, useState } from "react";
import CreatorLayout from "@/layouts/CreatorLayout";
import CampaignCard from "@/components/creator/CampaignCard";
import { fetchAllCampaigns, Campaign, getUserId, checkAuthStatus } from "@/lib/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { SlidersHorizontal, Loader2 } from "lucide-react";
import { CategoryFilter } from "@/components/ui/CategoryFilter";
import { PortalPageHeader } from "@/components/ui/PortalPrimitives";
import MarketplaceExplorer from "./MarketplaceExplorer";

const CampaignsPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(getUserId()));
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campaignType = searchParams.get("type");
  const { toast } = useToast();

  const categoriesList = [
    { value: "all", label: "All Categories" },
    { value: "promotional", label: "Promotional (YouTube, Gaming, Business)" },
    { value: "fashion", label: "Fashion" },
    { value: "beauty", label: "Beauty" },
    { value: "electronics", label: "Electronics" },
    { value: "home_kitchen", label: "Home & Kitchen" },
    { value: "fitness_wellness", label: "Fitness & Wellness" },
    { value: "software_tools", label: "Software Tools" },
    { value: "gaming", label: "Gaming" },
    { value: "education", label: "Education" },
    { value: "finance_crypto", label: "Finance & Crypto" }
  ];

  // Verify authentication on mount
  useEffect(() => {
    let isMounted = true;
    const verifyAuth = async () => {
      const currentId = getUserId();
      if (currentId) {
        if (isMounted) setIsAuthenticated(true);
        return;
      }
      try {
        const res = await checkAuthStatus();
        if (isMounted) {
          setIsAuthenticated(Boolean(res.authenticated && res.user_id));
        }
      } catch {
        if (isMounted) setIsAuthenticated(false);
      }
    };
    verifyAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const getCampaigns = async () => {
      try {
        setLoading(true);
        const allCampaigns = await fetchAllCampaigns();
        setCampaigns(allCampaigns);
      } catch (err: any) {
        setError(err.message || "Failed to load campaigns.");
        toast({
          title: "Error",
          description: err.message || "Failed to load campaigns.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    getCampaigns();
  }, [isAuthenticated, toast]);

  const handleCardClick = (id: number) => {
    navigate(`/creator/dashboard/${id}`);
  };

  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
  const filteredCampaigns = campaigns.filter(
    (campaign) => 
      (!campaign.deadline || new Date(campaign.deadline) >= todayStart) &&
      (!campaignType || campaign.campaign_type === campaignType) &&
      (selectedCategory === "all" || campaign.category === selectedCategory)
  );

  if (!isAuthenticated) {
    return <MarketplaceExplorer isAuthenticated={false} />;
  }

  return (
    <CreatorLayout>
      <div className="space-y-6">
        <PortalPageHeader
          eyebrow={
            campaignType === "influencer"
              ? "01 // INFLUENCER BRIEFS"
              : campaignType === "clipping"
              ? "01 // CLIPPING BRIEFS"
              : "01 // LIVE MARKETPLACE"
          }
          title={
            campaignType === "influencer"
              ? "Influencer"
              : campaignType === "clipping"
              ? "Clipping"
              : "Active"
          }
          highlighted="Campaigns"
          accent="creator"
          subtitle={
            campaignType === "influencer"
              ? "Shoot authentic vertical reels for verified Indian brands with budget locked upfront."
              : campaignType === "clipping"
              ? "Clip founder podcasts and drops, then get paid per 1,000 verified views."
              : "Pick an open brand deal with upfront escrow and direct UPI payouts."
          }
          action={
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 h-10 px-4 rounded-xl border font-medium text-xs transition-colors duration-150 cursor-pointer shrink-0 ${
                showFilters
                  ? "bg-ink text-white border-ink"
                  : "bg-white border-black/15 text-ink hover:bg-black/[0.03] hover:border-black/25"
              }`}
            >
              <SlidersHorizontal size={14} />
              <span>Filters</span>
              {selectedCategory !== "all" && (
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full font-mono text-[9px] font-bold ${
                    showFilters ? "bg-lava text-white" : "bg-lava text-white"
                  }`}
                >
                  1
                </span>
              )}
            </button>
          }
        />

        {/* Modular Category Filter Panel */}
        <CategoryFilter
          categories={categoriesList}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          isOpen={showFilters}
          theme="light"
          accent="creator"
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 rounded-2xl border border-black/10 bg-white gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-lava" />
            <p className="font-mono text-xs uppercase tracking-wider text-slate">
              Loading Open Briefs...
            </p>
          </div>
        ) : error ? (
          <div className="text-center text-rose-700 font-medium py-6 px-4 bg-rose-50 rounded-2xl border border-rose-500/25 text-sm">
            {error}
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-20 text-slate font-medium bg-white rounded-2xl border border-black/10">
            No campaigns found matching the selected category.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign) => (
              <div key={campaign.id} className="cursor-pointer" onClick={() => handleCardClick(campaign.id)}>
                <CampaignCard {...campaign} />
              </div>
            ))}
          </div>
        )}
      </div>
    </CreatorLayout>
  );
};
export default CampaignsPage;