import React, { useEffect, useState } from "react";
import { 
  getBrandAffiliateCampaigns, 
  getAffiliateCampaignDetails, 
  createAffiliateCampaign, 
  allocateAffiliateBudget, 
  reclaimAffiliateBudget, 
  getBrandProducts,
  getWalletBalance 
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Megaphone, 
  Plus, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Layers, 
  UserPlus, 
  Coins, 
  ArrowLeftRight,
  ShieldCheck,
  CheckCircle,
  HelpCircle
} from "lucide-react";

import { SaasCampaignBuilder } from "./SaasCampaignBuilder";
import { useNavigate } from "react-router-dom";

interface AffiliateCampaignsProps {
  brandCategory?: string;
  brandWebsiteUrl?: string;
}

export const AffiliateCampaigns: React.FC<AffiliateCampaignsProps> = ({ 
  brandCategory = "Product Based",
  brandWebsiteUrl = ""
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Campaign Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submittingCampaign, setSubmittingCampaign] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [deadline, setDeadline] = useState("");
  const [commType, setCommType] = useState<"percentage" | "fixed">("percentage");
  const [commValue, setCommValue] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  // Budget Modal
  const [budgetModalCampaign, setBudgetModalCampaign] = useState<any | null>(null);
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetAction, setBudgetAction] = useState<"allocate" | "reclaim">("allocate");
  const [submittingBudget, setSubmittingBudget] = useState(false);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [campData, prodData, walletData] = await Promise.all([
        getBrandAffiliateCampaigns(),
        getBrandProducts(),
        getWalletBalance()
      ]);
      setCampaigns(campData);
      setProducts(prodData);
      setWalletBalance(walletData.balance);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to load dashboard data", variant: "destructive" });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !deadline || !commValue.trim()) {
      toast({ title: "Validation Error", description: "Name, deadline, and commission are required.", variant: "destructive" });
      return;
    }

    setSubmittingCampaign(true);
    try {
      await createAffiliateCampaign({
        name,
        description: desc,
        image_url: imageUrl || undefined,
        start_date: startDate,
        deadline,
        commission_type: commType,
        commission_value: parseFloat(commValue),
        product_ids: selectedProductIds
      });
      toast({ title: "Campaign Created", description: "Your campaign is submitted for compliance review." });
      
      // Reset
      setName("");
      setDesc("");
      setImageUrl("");
      setDeadline("");
      setCommValue("");
      setSelectedProductIds([]);
      setShowCreateModal(false);
      
      await loadData(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to create campaign", variant: "destructive" });
    } finally {
      setSubmittingCampaign(false);
    }
  };

  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Validation Error", description: "Invalid amount input.", variant: "destructive" });
      return;
    }

    setSubmittingBudget(true);
    try {
      if (budgetAction === "allocate") {
        if (walletBalance < amount) {
          toast({ title: "Error", description: "Insufficient wallet balance", variant: "destructive" });
          setSubmittingBudget(false);
          return;
        }
        await allocateAffiliateBudget(budgetModalCampaign.id, amount);
        toast({ title: "Budget Allocated", description: `Added ₹${amount} to campaign budget.` });
      } else {
        const available = budgetModalCampaign.funds_allocated - budgetModalCampaign.funds_distributed;
        if (available < amount) {
          toast({ title: "Error", description: "Cannot reclaim more than campaign's free budget.", variant: "destructive" });
          setSubmittingBudget(false);
          return;
        }
        await reclaimAffiliateBudget(budgetModalCampaign.id, amount);
        toast({ title: "Budget Reclaimed", description: `Returned ₹${amount} back to wallet.` });
      }
      
      setBudgetAmount("");
      setBudgetModalCampaign(null);
      await loadData(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Budget transaction failed.", variant: "destructive" });
    } finally {
      setSubmittingBudget(false);
    }
  };

  const toggleProductSelect = (id: number) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Block */}
      <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Affiliate Campaigns</h2>
          <p className="text-xs text-gray-500 mt-1">
            Launch campaign rules and fund them using your brand wallet balance: <span className="font-extrabold text-indigo-650">₹{walletBalance.toLocaleString()}</span>
          </p>
        </div>
        
        <Button 
          onClick={() => {
            if (brandCategory !== "SaaS Based" && products.length === 0) {
              toast({ title: "Products Needed", description: "Please add products to your catalog first.", variant: "destructive" });
              return;
            }
            setShowCreateModal(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Launch Campaign
        </Button>
      </div>

      {/* Campaigns Listing */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-150 text-gray-400">
          <Clock className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
          <p className="font-semibold text-sm">Loading affiliate campaigns...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-150">
          <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-bold text-gray-700 text-base">No active affiliate campaigns</p>
          <p className="text-gray-400 text-xs mt-1">Create your first cost-per-conversion campaign to start partnering with creators.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map(c => {
            const freeBudget = c.funds_allocated - c.funds_distributed;
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6 hover:shadow-md transition duration-150">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-4 flex-1">
                    
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">{c.name}</h3>
                      
                      {c.campaign_approval === "pending_approval" ? (
                        <span className="bg-amber-50 border border-amber-200 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Pending Approval
                        </span>
                      ) : c.campaign_approval === "rejected" ? (
                        <span className="bg-red-50 border border-red-200 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Rejected
                        </span>
                      ) : c.is_active ? (
                        <span className="bg-green-50 border border-green-200 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Active
                        </span>
                      ) : (
                        <span className="bg-gray-50 border border-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Draft (Fund to activate)
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-550 leading-relaxed">{c.description || "No description provided."}</p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Allocated Budget</span>
                        <span className="font-extrabold text-sm text-gray-800">₹{c.funds_allocated.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Distributed</span>
                        <span className="font-extrabold text-sm text-gray-800">₹{c.funds_distributed.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Commission Rule</span>
                        <span className="font-extrabold text-sm text-indigo-650">
                          {c.commission_type === "percentage" ? `${c.commission_value}% per sale` : `₹${c.commission_value} fixed`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Deadline</span>
                        <span className="font-bold text-xs text-gray-700">
                          {new Date(c.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Drawer */}
                  <div className="flex flex-col justify-between sm:items-end gap-4 min-w-[200px]">
                    <div className="text-left sm:text-right space-y-1">
                      <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Free Campaign Budget</span>
                      <span className="text-xl font-black text-gray-800 block">₹{freeBudget.toLocaleString()}</span>
                    </div>

                    <div className="flex flex-col gap-2 w-full">
                      <Button
                        size="sm"
                        onClick={() => navigate(`/brand/affiliate-dashboard/${c.id}`)}
                        className="w-full text-xs bg-zinc-900 hover:bg-zinc-800 text-white font-semibold"
                      >
                        View Analytics & Partners
                      </Button>
                      <div className="flex gap-2 w-full">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setBudgetModalCampaign(c);
                            setBudgetAction("reclaim");
                          }}
                          className="flex-1 text-xs"
                          disabled={freeBudget <= 0}
                        >
                          Reclaim Budget
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setBudgetModalCampaign(c);
                            setBudgetAction("allocate");
                          }}
                          className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                        >
                          Add Budget
                        </Button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE CAMPAIGN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          {brandCategory === "SaaS Based" ? (
            <SaasCampaignBuilder
              products={products}
              brandWebsiteUrl={brandWebsiteUrl}
              onCancel={() => setShowCreateModal(false)}
              submitting={submittingCampaign}
              onSubmit={async (campaignData) => {
                setSubmittingCampaign(true);
                try {
                  await createAffiliateCampaign(campaignData);
                  toast({ title: "Campaign Created", description: "Your SaaS affiliate campaign has been submitted for compliance review." });
                  setShowCreateModal(false);
                  await loadData(true);
                } catch (err: any) {
                  toast({ title: "Error", description: err.message || "Failed to create campaign", variant: "destructive" });
                } finally {
                  setSubmittingCampaign(false);
                }
              }}
            />
          ) : (
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-600" />
                Launch Affiliate Campaign
              </h3>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Campaign Name</label>
                  <Input
                    type="text"
                    placeholder="e.g. Summer Skincare Referral Boost"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Campaign Description</label>
                  <Input
                    type="text"
                    placeholder="Tell creators how to promote..."
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">End Date (Deadline)</label>
                    <Input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Commission Type</label>
                    <select
                      className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm"
                      value={commType}
                      onChange={(e) => setCommType(e.target.value as any)}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Flat INR (₹)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Value</label>
                    <Input
                      type="number"
                      placeholder={commType === "percentage" ? "e.g. 10" : "e.g. 150"}
                      value={commValue}
                      onChange={(e) => setCommValue(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Product Picker */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Select Associated Store Products</label>
                  <div className="border border-gray-200 rounded-xl p-3 max-h-[150px] overflow-y-auto space-y-2 bg-gray-50/50">
                    {products.map(p => (
                      <div 
                        key={p.id}
                        onClick={() => toggleProductSelect(p.id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer border transition text-xs ${
                          selectedProductIds.includes(p.id)
                            ? "bg-indigo-50 border-indigo-200 text-indigo-900 font-semibold"
                            : "bg-white border-gray-100 hover:bg-gray-50"
                        }`}
                      >
                        <span>{p.name}</span>
                        <span className="font-bold">₹{p.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-3">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    disabled={submittingCampaign}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={submittingCampaign}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                  >
                    {submittingCampaign ? "Launching..." : "Launch Draft"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* BUDGET ALLOCATION MODAL */}
      {budgetModalCampaign && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-150 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Coins className="w-5 h-5 text-indigo-600" />
              {budgetAction === "allocate" ? "Add Campaign Funds" : "Reclaim Campaign Funds"}
            </h3>
            
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              {budgetAction === "allocate" 
                ? `Allocate budget to fund creator payouts. Your available wallet balance is ₹${walletBalance.toLocaleString()}.`
                : `Reclaim unspent pre-allocated funds from this campaign back to your wallet balance.`}
            </p>

            <form onSubmit={handleBudgetSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Amount (INR)</label>
                <Input
                  type="number"
                  placeholder="e.g. 5000"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setBudgetModalCampaign(null)}
                  disabled={submittingBudget}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={submittingBudget}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  {submittingBudget ? "Processing..." : budgetAction === "allocate" ? "Add Funds" : "Reclaim"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
