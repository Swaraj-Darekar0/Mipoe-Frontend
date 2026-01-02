import React, { useEffect, useState } from "react";
import CreatorLayout from "@/layouts/CreatorLayout";
import CampaignCard from "@/components/creator/CampaignCard";
import { fetchAllCampaigns, Campaign } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Card, Skeleton } from "@heroui/react";

const CampaignFilters = () => (
  <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 md:-mx-10 px-6 md:px-10" style={{ scrollbarWidth: 'none' }}>
    <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-primary text-black px-4">
      <p className="font-body text-sm font-bold leading-normal">High CPM</p>
    </button>
    <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-transparent border border-white/50 px-4">
      <p className="font-body text-white text-sm font-medium leading-normal">Beauty</p>
    </button>
    <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-transparent border border-white/50 px-4">
      <p className="font-body text-white text-sm font-medium leading-normal">Tech</p>
    </button>
    <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-transparent border border-white/50 px-4">
      <p className="font-body text-white text-sm font-medium leading-normal">Fast Approval</p>
    </button>
    <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-transparent border border-white/50 px-4">
      <p className="font-body text-white text-sm font-medium leading-normal">Ending Soon</p>
    </button>
    <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-transparent border border-white/50 px-4">
      <p className="font-body text-white text-sm font-medium leading-normal">Gaming</p>
    </button>
  </div>
);

const CampaignsPage = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

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

  return (
    <CreatorLayout>
      <div className="space-y-8">
        <header>
          <h1 className="font-display text-4xl font-bold text-white">Campaign Marketplace</h1>
          <p className="text-gray-400 mt-2">Discover new campaigns and start earning.</p>
        </header>

        {/* <CampaignFilters /> */}

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
        ) : (
          <div className="columns-1 md:columns-2 xl:columns-3 gap-6">
            {campaigns.map((campaign) => (
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