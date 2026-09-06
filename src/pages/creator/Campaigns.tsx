import React, { useEffect, useState } from "react";
import CreatorLayout from "@/layouts/CreatorLayout";
import CampaignCard from "@/components/creator/CampaignCard";
import { fetchAllCampaigns, Campaign } from "@/lib/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Card, Skeleton } from "@heroui/react";
import { SlidersHorizontal } from "lucide-react";
import { CategoryFilter } from "@/components/ui/CategoryFilter";

const CampaignsPage = () => {
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

  useEffect(() => {
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
  }, [toast]);

  const handleCardClick = (id: number) => {
    navigate(`/creator/dashboard/${id}`);
  };

  const filteredCampaigns = campaigns.filter(
    (campaign) => 
      (!campaignType || campaign.campaign_type === campaignType) &&
      (selectedCategory === "all" || campaign.category === selectedCategory)
  );

  return (
    <CreatorLayout>
      <div className="space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
              {campaignType === "influencer"
                ? "Influencer Campaigns"
                : campaignType === "clipping"
                ? "Clipping Campaigns"
                : "Campaign Marketplace"}
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              {campaignType === "influencer"
                ? "Collaborate with brands on customized content creation."
                : campaignType === "clipping"
                ? "Clip long form videos and earn based on performance views."
                : "Discover new campaigns and start earning today."}
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 h-10 px-4 rounded-xl border font-semibold text-xs transition-all duration-300 active:scale-95 cursor-pointer shrink-0 w-fit ${
              showFilters 
                ? "bg-orange-500 text-white border-orange-500 shadow-xs" 
                : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300"
            }`}
          >
            <SlidersHorizontal size={14} />
            <span>Filters</span>
            {selectedCategory !== "all" && (
              <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
                showFilters ? "bg-white text-orange-600" : "bg-orange-500 text-white"
              }`}>
                1
              </span>
            )}
          </button>
        </header>

        {/* Modular Category Filter Panel */}
        <CategoryFilter
          categories={categoriesList}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          isOpen={showFilters}
          theme="light"
        />

        {loading ? (
          <Card className="w-[200px] space-y-5 p-4 bg-white border border-zinc-200" radius="lg">
            <Skeleton className="rounded-lg">
              <div className="h-24 rounded-lg bg-zinc-200" />
            </Skeleton>
            <div className="space-y-3">
              <Skeleton className="w-3/5 rounded-lg">
                <div className="h-3 w-3/5 rounded-lg bg-zinc-100" />
              </Skeleton>
              <Skeleton className="w-4/5 rounded-lg">
                <div className="h-3 w-4/5 rounded-lg bg-zinc-100" />
              </Skeleton>
            </div>
          </Card>
        ) : error ? (
          <div className="text-center text-rose-600 font-medium py-8 bg-rose-50 rounded-2xl border border-rose-200">{error}</div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 font-medium bg-white rounded-2xl border border-zinc-200/80">
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