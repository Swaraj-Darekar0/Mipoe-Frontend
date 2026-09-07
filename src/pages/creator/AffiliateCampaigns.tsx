import React, { useEffect, useState } from "react";
import CreatorLayout from "@/layouts/CreatorLayout";
import { AffiliateCampaignCard } from "@/components/creator/AffiliateCampaignCard";
import { 
  getCreatorAffiliateCampaigns, 
  joinAffiliateCampaign, 
  getWalletBalance, 
  CreatorAffiliateCampaign 
} from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Coins, 
  Search, 
  SlidersHorizontal, 
  Loader2, 
  Megaphone, 
  Sparkles, 
  Target, 
  Award,
  Layers
} from "lucide-react";
import { CategoryFilter } from "@/components/ui/CategoryFilter";

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
    setJoiningId(id);
    try {
      await joinAffiliateCampaign(id);
      toast({
        title: "Joined Successfully!",
        description: "Your unique reference code and link have been generated.",
        className: "bg-emerald-600 border-emerald-500 text-white shadow-md"
      });
      // Silent reload to update join statuses
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

  // Filter logic
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
      <div className="space-y-8 animate-in fade-in duration-200">
        
        {/* Header Block */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1.5">
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-zinc-900 flex items-center gap-2.5">
              Affiliate Campaigns
              <Sparkles className="w-6 h-6 text-orange-500 shrink-0" />
            </h1>
            <p className="text-zinc-500 text-sm max-w-xl">
              Partner with brands, promote SaaS subscriptions or product orders, and earn ongoing commissions on conversions.
            </p>
          </div>

          {/* Quick Balance Stat */}
          <div className="bg-white border border-zinc-200/80 p-4 rounded-2xl flex items-center gap-3.5 shadow-xs max-w-xs w-full shrink-0">
            <div className="p-3 bg-orange-50 rounded-xl">
              <Coins className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Your Balance</span>
              <span className="font-black text-xl text-zinc-900 block mt-0.5">₹{walletBalance.toLocaleString()}</span>
            </div>
          </div>
        </header>

        {/* Stats Summary Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-white border-zinc-200/80 rounded-2xl shadow-xs">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-2.5 bg-zinc-100 rounded-xl">
                <Target className="w-5 h-5 text-zinc-700" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Total Active Programs</span>
                <span className="text-lg font-black text-zinc-900 block mt-0.5">{campaigns.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-zinc-200/80 rounded-2xl shadow-xs">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-2.5 bg-emerald-50 rounded-xl">
                <Award className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Joined Campaigns</span>
                <span className="text-lg font-black text-zinc-900 block mt-0.5">{joinedCount}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-zinc-200/80 rounded-2xl shadow-xs">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-2.5 bg-orange-50 rounded-xl">
                <Layers className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Explore Options</span>
                <span className="text-lg font-black text-zinc-900 block mt-0.5">{exploreCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs & Search Filter Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 border-t border-zinc-100">
          
          {/* Custom Tabs */}
          <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200/80 w-fit">
            <button
              onClick={() => setActiveTab("explore")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "explore" 
                  ? "bg-white text-zinc-900 shadow-xs" 
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Explore Campaigns ({exploreCount})
            </button>
            <button
              onClick={() => setActiveTab("joined")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "joined" 
                  ? "bg-white text-zinc-900 shadow-xs" 
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Joined Campaigns ({joinedCount})
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <Input
                type="text"
                placeholder="Search programs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border-zinc-200/80 rounded-xl pl-9 text-xs h-10 text-zinc-900 placeholder:text-zinc-400 focus:border-orange-500"
              />
            </div>

            <Button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 h-10 px-4 rounded-xl border font-bold text-xs transition-all duration-200 shrink-0 ${
                showFilters 
                  ? "bg-orange-500 border-orange-500 text-white shadow-xs" 
                  : "bg-white border-zinc-200/80 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300"
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
        />

        {/* Content list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-3" />
            <p className="font-semibold text-sm">Syncing affiliate marketplace campaigns...</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="bg-white border border-dashed border-zinc-200 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-xs">
            <Megaphone className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
            <h3 className="font-bold text-zinc-900 text-base">No programs found</h3>
            <p className="text-zinc-500 text-xs mt-1.5 leading-relaxed">
              {activeTab === "joined" 
                ? "You haven't joined any affiliate campaign programs yet. Switch to the Explore tab to discover active campaigns."
                : "No matching campaigns discovered. Try checking other categories or modify your search."}
            </p>
            {activeTab === "joined" && (
              <Button
                onClick={() => setActiveTab("explore")}
                className="mt-5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs rounded-xl shadow-xs"
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
