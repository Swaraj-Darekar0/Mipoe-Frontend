import React, { useEffect, useState } from "react";
import CreatorLayout from "@/layouts/CreatorLayout";
import { AffiliateCampaignCard } from "@/components/creator/AffiliateCampaignCard";
import { 
  getCreatorAffiliateCampaigns, 
  joinAffiliateCampaign, 
  getWalletBalance, 
  CreatorAffiliateCampaign,
  getUserId 
} from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Coins, 
  Search, 
  SlidersHorizontal, 
  Loader2, 
  Megaphone
} from "lucide-react";
import { CategoryFilter } from "@/components/ui/CategoryFilter";
import { PortalPageHeader, MetricCell } from "@/components/ui/PortalPrimitives";

const CreatorAffiliateCampaignsPage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState<CreatorAffiliateCampaign[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<number | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<"explore" | "joined">("explore");
  
  // Search & Category Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const categoriesList = [
    { value: "all", label: "All Categories" },
    { value: "promotional", label: "Promotional" },
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

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const userId = getUserId();
      if (!userId) {
        const campsData = await getCreatorAffiliateCampaigns();
        setCampaigns(campsData);
        setWalletBalance(0);
        return;
      }
      const [campsData, walletData] = await Promise.all([
        getCreatorAffiliateCampaigns(),
        getWalletBalance()
      ]);
      setCampaigns(campsData);
      setWalletBalance(walletData.balance);
    } catch (err: any) {
      toast({
        title: "Load Error",
        description: err.message || "Failed to load affiliate campaigns.",
        variant: "destructive"
      });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleJoinCampaign = async (id: number) => {
    const userId = getUserId();
    if (!userId) {
      navigate(`/login?role=creator&redirect=${encodeURIComponent("/creator/affiliate-campaigns")}`);
      return;
    }
    setJoiningId(id);
    try {
      await joinAffiliateCampaign(id);
      toast({
        title: "Joined Successfully!",
        description: "Your unique reference code and link have been generated.",
        className: "bg-emerald-600 border-emerald-500 text-white"
      });
      await loadData(true);
    } catch (err: any) {
      toast({
        title: "Join Failed",
        description: err.message || "Could not join the affiliate program.",
        variant: "destructive"
      });
    } finally {
      setJoiningId(null);
    }
  };

  const handleCardClick = (id: number) => {
    navigate(`/creator/affiliate-campaigns/${id}`);
  };

  const filteredCampaigns = campaigns.filter(c => {
    const matchesTab = activeTab === "explore" ? !c.joined : c.joined;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || c.creator_requirements?.category === selectedCategory;
    return matchesTab && matchesSearch && matchesCategory;
  });

  const joinedCount = campaigns.filter(c => c.joined).length;
  const exploreCount = campaigns.filter(c => !c.joined).length;

  return (
    <CreatorLayout>
      <div className="space-y-8">
        <PortalPageHeader
          eyebrow="02 // AFFILIATE PROGRAMS"
          title="Affiliate"
          highlighted="Campaigns"
          accent="creator"
          subtitle="Partner with brands, promote SaaS subscriptions or product orders, and earn ongoing commissions on conversions."
          action={
            <div className="bg-white border border-black/10 p-4 rounded-2xl flex items-center gap-3.5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] w-full md:w-auto md:min-w-[210px] shrink-0">
              <div className="p-2.5 bg-lava/10 border border-lava/20 rounded-xl">
                <Coins className="w-5 h-5 text-lava" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-steel font-bold block uppercase tracking-widest">Your Balance</span>
                <span className="font-mono font-bold tabular-nums text-xl text-ink block mt-0.5">
                  ₹{walletBalance.toLocaleString()}
                </span>
              </div>
            </div>
          }
        />

        {/* Stats Summary Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCell
            label="Live Affiliate Drops"
            value={campaigns.length}
            sublabel="Open affiliate offers"
          />
          <MetricCell
            label="Joined Campaigns"
            value={joinedCount}
            sublabel="Active partner links"
            valueClassName="text-emerald-700"
          />
          <MetricCell
            label="Explore Options"
            value={exploreCount}
            sublabel="Available to join"
            valueClassName="text-lava"
          />
        </div>

        {/* Tabs & Search Filter Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-black/10">
          <div className="flex bg-black/[0.04] p-1 rounded-xl border border-black/10 w-full sm:w-fit">
            <button
              onClick={() => setActiveTab("explore")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                activeTab === "explore" 
                  ? "bg-white text-ink shadow-xs border border-black/5" 
                  : "text-slate hover:text-ink"
              }`}
            >
              Explore ({exploreCount})
            </button>
            <button
              onClick={() => setActiveTab("joined")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                activeTab === "joined" 
                  ? "bg-white text-ink shadow-xs border border-black/5" 
                  : "text-slate hover:text-ink"
              }`}
            >
              Joined ({joinedCount})
            </button>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-steel absolute left-3 top-3" />
              <Input
                type="text"
                placeholder="Search programs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border-black/10 rounded-xl pl-9 text-xs h-10 text-ink placeholder:text-steel focus:border-lava"
              />
            </div>

            <Button
              variant={showFilters ? "creator" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 h-10 px-4 rounded-xl text-xs font-semibold shrink-0"
            >
              <SlidersHorizontal size={14} />
              <span>Filters</span>
              {selectedCategory !== "all" && (
                <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-mono font-bold ${
                  showFilters ? "bg-white text-lava" : "bg-lava text-white"
                }`}>
                  1
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Modular Category Filter Panel */}
        <CategoryFilter
          categories={categoriesList}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          isOpen={showFilters}
          theme="light"
          accent="creator"
        />

        {/* Content list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate">
            <Loader2 className="w-8 h-8 animate-spin text-lava mb-3" />
            <p className="font-semibold text-sm">Syncing affiliate marketplace campaigns...</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="bg-white border border-dashed border-black/15 rounded-2xl p-10 sm:p-12 text-center max-w-xl mx-auto">
            <Megaphone className="w-10 h-10 text-steel mx-auto mb-3" />
            <h3 className="font-display font-bold text-ink text-base">No programs found</h3>
            <p className="text-slate text-xs mt-1.5 leading-relaxed">
              {activeTab === "joined" 
                ? "You haven't joined any affiliate campaign programs yet. Switch to the Explore tab to discover active campaigns."
                : "No matching campaigns discovered. Try checking other categories or modify your search."}
            </p>
            {activeTab === "joined" && (
              <Button
                variant="creator"
                onClick={() => setActiveTab("explore")}
                className="mt-5 text-xs rounded-xl"
              >
                Explore Campaign Marketplace
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCampaigns.map((camp) => (
              <AffiliateCampaignCard
                key={camp.id}
                campaign={camp}
                onJoin={handleJoinCampaign}
                joiningId={joiningId}
                onCardClick={handleCardClick}
              />
            ))}
          </div>
        )}
      </div>
    </CreatorLayout>
  );
};

export default CreatorAffiliateCampaignsPage;
