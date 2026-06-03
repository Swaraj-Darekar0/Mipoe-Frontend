import React, { useEffect, useState } from "react";
import CreatorLayout from "@/layouts/CreatorLayout";
import CampaignCard from "@/components/creator/CampaignCard";
import { fetchAllCampaigns, Campaign } from "@/lib/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Card, Skeleton } from "@heroui/react";

const CampaignsPage = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campaignType = searchParams.get("type"); // "influencer" | "clipping" | null
  const { toast } = useToast();

  const categoriesList = [
    { value: "all", label: "All Categories" },
    { value: "youtube_promotional", label: "YouTube Promotional" },
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
        <header>
          <h1 className="font-display text-4xl font-bold text-white">
            {campaignType === "influencer"
              ? "Influencer Campaigns"
              : campaignType === "clipping"
              ? "Clipping Campaigns"
              : "Campaign Marketplace"}
          </h1>
          <p className="text-gray-400 mt-2">
            {campaignType === "influencer"
              ? "Collaborate with brands on customized content creation."
              : campaignType === "clipping"
              ? "Clip long form videos and earn based on performance views."
              : "Discover new campaigns and start earning."}
          </p>
        </header>

        {/* Filter categories bar */}
        <div 
          className="flex gap-3 overflow-x-auto pb-2 -mx-6 md:-mx-10 px-6 md:px-10" 
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categoriesList.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`flex h-9 shrink-0 items-center justify-center rounded-full px-4 transition-all duration-200 ${
                  isSelected 
                    ? "bg-primary text-black font-bold shadow-md shadow-primary/20 scale-105" 
                    : "bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20"
                }`}
              >
                <p className="font-body text-xs font-semibold leading-normal">{cat.label}</p>
              </button>
            );
          })}
        </div>

        {loading ? (
          <Card className="w-[200px] space-y-5 p-4" radius="lg">
            <Skeleton className="rounded-lg">
              <div className="h-24 rounded-lg bg-default-300" />
            </Skeleton>
            <div className="space-y-3">
              <Skeleton className="w-3/5 rounded-lg">
                <div className="h-3 w-3/5 rounded-lg bg-default-200" />
              </Skeleton>
              <Skeleton className="w-4/5 rounded-lg">
                <div className="h-3 w-4/5 rounded-lg bg-default-200" />
              </Skeleton>
              <Skeleton className="w-2/5 rounded-lg">
                <div className="h-3 w-2/5 rounded-lg bg-default-300" />
              </Skeleton>
            </div>
          </Card>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-medium">
            No campaigns found matching the selected category.
          </div>
        ) : (
          <div className="columns-1 md:columns-2 xl:columns-3 gap-6">
            {filteredCampaigns.map((campaign) => (
              <div key={campaign.id} className="break-inside-avoid mb-6 cursor-pointer" onClick={() => handleCardClick(campaign.id)}>
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