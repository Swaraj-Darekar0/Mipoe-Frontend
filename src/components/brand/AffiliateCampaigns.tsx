import React, { useEffect, useState } from "react";
import {
  getBrandAffiliateCampaigns,
  createAffiliateCampaign,
  allocateAffiliateBudget,
  reclaimAffiliateBudget,
  getBrandProducts,
  getWalletBalance,
  uploadCampaignImage,
  deleteAffiliateCampaign,
} from "@/lib/api";
import { compressImage } from "@/utils/imageCompression";
import { ImageCropInput } from "@/components/ui/ImageCropInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog, StatusPill } from "@/components/ui/PortalPrimitives";
import { useToast } from "@/hooks/use-toast";
import {
  Megaphone,
  Plus,
  Loader2,
  Coins,
  Trash2,
} from "lucide-react";

import { SaasCampaignBuilder } from "./SaasCampaignBuilder";
import { useNavigate } from "react-router-dom";

interface AffiliateCampaignsProps {
  brandCategory?: string;
  brandWebsiteUrl?: string;
}

export const AffiliateCampaigns: React.FC<AffiliateCampaignsProps> = ({
  brandCategory = "Product Based",
  brandWebsiteUrl = "",
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
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

  // Delete Confirmation Dialog
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [campData, prodData, walletData] = await Promise.all([
        getBrandAffiliateCampaigns(),
        getBrandProducts(),
        getWalletBalance(),
      ]);
      setCampaigns(campData);
      setProducts(prodData);
      setWalletBalance(walletData.balance);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to load dashboard data",
        variant: "destructive",
      });
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
      toast({
        title: "Validation Error",
        description: "Name, deadline, and commission are required.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingCampaign(true);
    try {
      let finalImageUrl = imageUrl;
      if (imageFile) {
        try {
          const compressed = await compressImage(imageFile);
          finalImageUrl = await uploadCampaignImage(compressed);
        } catch {
          throw new Error("Failed to compress or upload cover image");
        }
      }

      await createAffiliateCampaign({
        name,
        description: desc,
        image_url: finalImageUrl || undefined,
        start_date: startDate,
        deadline,
        commission_type: commType,
        commission_value: parseFloat(commValue),
        product_ids: selectedProductIds,
      });
      toast({
        title: "Campaign Created",
        description: "Your campaign is submitted for compliance review.",
      });

      // Reset
      setName("");
      setDesc("");
      setImageUrl("");
      setImageFile(null);
      setImagePreview("");
      setDeadline("");
      setCommValue("");
      setSelectedProductIds([]);
      setShowCreateModal(false);

      await loadData(true);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setSubmittingCampaign(false);
    }
  };

  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Validation Error",
        description: "Invalid amount input.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingBudget(true);
    try {
      if (budgetAction === "allocate") {
        if (walletBalance < amount) {
          toast({
            title: "Error",
            description: "Insufficient wallet balance",
            variant: "destructive",
          });
          setSubmittingBudget(false);
          return;
        }
        await allocateAffiliateBudget(budgetModalCampaign.id, amount);
        toast({
          title: "Budget Allocated",
          description: `Added ₹${amount} to campaign budget.`,
        });
      } else {
        const available =
          budgetModalCampaign.funds_allocated - budgetModalCampaign.funds_distributed;
        if (available < amount) {
          toast({
            title: "Error",
            description: "Cannot reclaim more than campaign's free budget.",
            variant: "destructive",
          });
          setSubmittingBudget(false);
          return;
        }
        await reclaimAffiliateBudget(budgetModalCampaign.id, amount);
        toast({
          title: "Budget Reclaimed",
          description: `Returned ₹${amount} back to wallet.`,
        });
      }

      setBudgetAmount("");
      setBudgetModalCampaign(null);
      await loadData(true);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Budget transaction failed.",
        variant: "destructive",
      });
    } finally {
      setSubmittingBudget(false);
    }
  };

  const confirmDeleteCampaign = async () => {
    if (deleteConfirmId === null) return;
    setDeleting(true);
    try {
      await deleteAffiliateCampaign(deleteConfirmId);
      toast({
        title: "Campaign Deleted",
        description: "Your campaign has been deleted successfully.",
      });
      setDeleteConfirmId(null);
      await loadData(true);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete campaign",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const toggleProductSelect = (id: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Overview Block */}
      <div className="bg-white p-6 rounded-2xl border border-black/10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-ink tracking-tight">
            Affiliate Campaigns
          </h2>
          <p className="text-xs text-slate mt-1">
            Launch campaign rules and fund them using your brand wallet balance:{" "}
            <span className="font-mono font-bold tabular-nums text-brand-blue">
              ₹{walletBalance.toLocaleString()}
            </span>
          </p>
        </div>

        <Button
          variant="brand"
          onClick={() => {
            const isSaas = brandCategory?.toLowerCase().includes("saas");
            if (!isSaas && products.length === 0) {
              toast({
                title: "Products Needed",
                description: "Please add products to your catalog first.",
                variant: "destructive",
              });
              return;
            }
            setShowCreateModal(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Launch Campaign
        </Button>
      </div>

      {/* Campaigns Listing */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-black/10 text-slate">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-blue mb-2" />
          <p className="font-medium text-sm">Loading affiliate campaigns...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-black/10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
          <Megaphone className="w-10 h-10 text-steel mx-auto mb-3" />
          <p className="font-display font-bold text-ink text-base">
            No active affiliate campaigns
          </p>
          <p className="text-slate text-xs mt-1">
            Create your first cost-per-conversion campaign to start partnering with creators.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c) => {
            const freeBudget = c.funds_allocated - c.funds_distributed;
            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-black/10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] p-6"
              >
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-4 flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start sm:items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-lg font-bold text-ink">
                          {c.name}
                        </h3>

                        {c.campaign_approval === "pending_approval" ? (
                          <StatusPill tone="warning">Pending Approval</StatusPill>
                        ) : c.campaign_approval === "rejected" ? (
                          <StatusPill tone="danger">Rejected</StatusPill>
                        ) : c.is_active ? (
                          <StatusPill tone="success" showDot>
                            Active
                          </StatusPill>
                        ) : (
                          <StatusPill tone="neutral">
                            Draft (Fund to activate)
                          </StatusPill>
                        )}
                      </div>

                      <button
                        type="button"
                        title="Delete Campaign"
                        onClick={() => setDeleteConfirmId(c.id)}
                        className="text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors duration-150 inline-flex items-center gap-1.5 text-xs font-medium shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate leading-relaxed">
                      {c.description || "No description provided."}
                    </p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-black/[0.03] p-4 rounded-xl border border-black/[0.06]">
                      <div>
                        <span className="font-mono text-[10px] text-steel font-medium block uppercase tracking-wider">
                          Allocated Budget
                        </span>
                        <span className="font-mono font-bold tabular-nums text-sm text-ink">
                          ₹{c.funds_allocated.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] text-steel font-medium block uppercase tracking-wider">
                          Distributed
                        </span>
                        <span className="font-mono font-bold tabular-nums text-sm text-ink">
                          ₹{c.funds_distributed.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] text-steel font-medium block uppercase tracking-wider">
                          Commission Rule
                        </span>
                        <span className="font-mono font-bold tabular-nums text-sm text-brand-blue">
                          {c.commission_type === "percentage"
                            ? `${c.commission_value}% per sale`
                            : `₹${c.commission_value} fixed`}
                        </span>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] text-steel font-medium block uppercase tracking-wider">
                          Deadline
                        </span>
                        <span className="font-mono font-semibold tabular-nums text-xs text-ink">
                          {new Date(c.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Drawer */}
                  <div className="flex flex-col justify-between md:items-end gap-4 md:min-w-[220px]">
                    <div className="text-left md:text-right space-y-1">
                      <span className="font-mono text-[10px] text-steel block font-medium uppercase tracking-wider">
                        Free Campaign Budget
                      </span>
                      <span className="font-mono text-xl font-bold tabular-nums text-ink block">
                        ₹{freeBudget.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 w-full">
                      <Button
                        size="sm"
                        variant="ink"
                        onClick={() =>
                          navigate(`/brand/affiliate-dashboard/${c.id}`)
                        }
                        className="w-full text-xs"
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
                          variant="brand"
                          onClick={() => {
                            setBudgetModalCampaign(c);
                            setBudgetAction("allocate");
                          }}
                          className="flex-1 text-xs"
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
      <Dialog
        open={showCreateModal}
        onOpenChange={(open) => {
          if (!open && !submittingCampaign) setShowCreateModal(false);
        }}
      >
        {brandCategory?.toLowerCase().includes("saas") ? (
          <DialogContent className="max-w-2xl p-0 border-0 bg-transparent shadow-none max-h-[92vh] overflow-y-auto [&>button]:hidden">
            <DialogTitle className="sr-only">
              Launch SaaS Affiliate Campaign
            </DialogTitle>
            <DialogDescription className="sr-only">
              Configure SaaS affiliate campaign milestones, attribution URL, and reward structure.
            </DialogDescription>
            <SaasCampaignBuilder
              products={products}
              brandWebsiteUrl={brandWebsiteUrl}
              onCancel={() => setShowCreateModal(false)}
              submitting={submittingCampaign}
              onSubmit={async (campaignData) => {
                setSubmittingCampaign(true);
                try {
                  await createAffiliateCampaign(campaignData);
                  toast({
                    title: "Campaign Created",
                    description:
                      "Your SaaS affiliate campaign has been submitted for compliance review.",
                  });
                  setShowCreateModal(false);
                  await loadData(true);
                } catch (err: any) {
                  toast({
                    title: "Error",
                    description: err.message || "Failed to create campaign",
                    variant: "destructive",
                  });
                } finally {
                  setSubmittingCampaign(false);
                }
              }}
            />
          </DialogContent>
        ) : (
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-black/10 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-lg font-bold text-ink flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-brand-blue" />
                Launch Affiliate Campaign
              </DialogTitle>
              <DialogDescription className="text-xs text-slate">
                Set your commission model and link store products before funding the campaign.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1">
                <ImageCropInput
                  accent="brand"
                  value={imagePreview || ""}
                  onChange={(file, previewUrl) => {
                    setImagePreview(previewUrl);
                    setImageFile(file);
                  }}
                  aspectRatio="16:9"
                  label="Campaign Cover Image"
                  placeholder="Upload a campaign cover image"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-mono text-[10px] font-medium text-steel uppercase tracking-wider">
                  Campaign Name
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Summer Skincare Referral Boost"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block font-mono text-[10px] font-medium text-steel uppercase tracking-wider">
                  Campaign Description
                </label>
                <Input
                  type="text"
                  placeholder="Tell creators how to promote..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-mono text-[10px] font-medium text-steel uppercase tracking-wider">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-mono text-[10px] font-medium text-steel uppercase tracking-wider">
                    End Date (Deadline)
                  </label>
                  <Input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-mono text-[10px] font-medium text-steel uppercase tracking-wider">
                    Commission Type
                  </label>
                  <select
                    title="Commission Type"
                    className="w-full h-10 px-3 rounded-xl border border-black/10 bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                    value={commType}
                    onChange={(e) => setCommType(e.target.value as any)}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Flat INR (₹)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-mono text-[10px] font-medium text-steel uppercase tracking-wider">
                    Value
                  </label>
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
                <label className="block font-mono text-[10px] font-medium text-steel uppercase tracking-wider">
                  Select Associated Store Products
                </label>
                <div className="border border-black/10 rounded-xl p-3 max-h-[150px] overflow-y-auto space-y-2 bg-black/[0.02]">
                  {products.map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => toggleProductSelect(p.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-colors duration-150 text-xs text-left ${
                        selectedProductIds.includes(p.id)
                          ? "bg-brand-blue/[0.08] border-brand-blue/30 text-ink font-semibold"
                          : "bg-white border-black/10 text-ink hover:bg-black/[0.02]"
                      }`}
                    >
                      <span className="truncate pr-2">{p.name}</span>
                      <span className="font-mono font-bold tabular-nums shrink-0">
                        ₹{p.price}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-3 gap-2">
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
                  variant="brand"
                  disabled={submittingCampaign}
                >
                  {submittingCampaign ? "Launching..." : "Launch Draft"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>

      {/* BUDGET ALLOCATION MODAL */}
      <Dialog
        open={!!budgetModalCampaign}
        onOpenChange={(open) => {
          if (!open && !submittingBudget) setBudgetModalCampaign(null);
        }}
      >
        <DialogContent className="max-w-md bg-white border border-black/10 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold text-ink flex items-center gap-2">
              <Coins className="w-5 h-5 text-brand-blue" />
              {budgetAction === "allocate"
                ? "Add Campaign Funds"
                : "Reclaim Campaign Funds"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate leading-relaxed">
              {budgetAction === "allocate"
                ? `Allocate budget to fund creator payouts. Your available wallet balance is ₹${walletBalance.toLocaleString()}.`
                : "Reclaim unspent pre-allocated funds from this campaign back to your wallet balance."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBudgetSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block font-mono text-[10px] font-medium text-steel uppercase tracking-wider">
                Amount (INR)
              </label>
              <Input
                type="number"
                placeholder="e.g. 5000"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="pt-3 gap-2">
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
                variant="brand"
                disabled={submittingBudget}
              >
                {submittingBudget
                  ? "Processing..."
                  : budgetAction === "allocate"
                    ? "Add Funds"
                    : "Reclaim"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteConfirmId(null);
        }}
        title="Delete Affiliate Campaign"
        description="Are you sure you want to delete this campaign? Any unspent pre-allocated budget will be reclaimed to your wallet."
        confirmLabel="Delete Campaign"
        variant="destructive"
        loading={deleting}
        onConfirm={confirmDeleteCampaign}
      />
    </div>
  );
};
