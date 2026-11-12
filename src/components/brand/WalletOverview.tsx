import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/PortalPrimitives";
import { Wallet, Plus, RefreshCw, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddFunds from "../../pages/brand/AddFunds";
import { getBrandProfile, BrandProfile } from "@/lib/api";
import BrandProfileModal from "./BrandProfileModal";
import { useToast } from "@/hooks/use-toast";

interface WalletOverviewProps {
  balance: number;
  onRefresh: () => void;
}

const WalletOverview: React.FC<WalletOverviewProps> = ({ balance, onRefresh }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false); // Only for profile check
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [showAddFundsDialog, setShowAddFundsDialog] = useState(false);

  const checkAndHandleProfile = async () => {
    try {
      const profile = await getBrandProfile();
      setBrandProfile(profile);
      if (!profile.username || !profile.phone) {
        setShowProfileModal(true);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Failed to fetch brand profile", error);
      toast({
        title: "Error",
        description: "Failed to verify brand profile.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleAddFundsClick = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const isProfileComplete = await checkAndHandleProfile();
      if (isProfileComplete) {
        setShowAddFundsDialog(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdated = () => {
    setShowProfileModal(false);
    onRefresh(); // Refresh balance after profile update
    checkAndHandleProfile().then((isComplete) => {
      if (isComplete) {
        setShowAddFundsDialog(true);
      }
    });
  };

  return (
    <Card className="bg-white border border-black/10 rounded-2xl text-ink shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] mb-5">
      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Left: Balance Info */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="p-2.5 sm:p-3 rounded-xl bg-black/[0.03] border border-black/[0.06] text-ink shrink-0">
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-ink" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-steel">
                Available Vault Funds
              </p>
              <StatusPill tone="success" showDot>
                Escrow Ready
              </StatusPill>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-xl sm:text-2xl font-mono font-bold tabular-nums text-ink truncate">
                ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Refresh wallet balance"
                className="h-7 w-7 text-slate hover:text-ink hover:bg-black/[0.04] rounded-lg shrink-0"
                onClick={onRefresh}
                disabled={loading}
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Add Funds Action */}
        <Dialog open={showAddFundsDialog} onOpenChange={setShowAddFundsDialog}>
          <Button
            className="w-full sm:w-auto bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold px-5 h-10 rounded-xl transition-colors duration-150 shrink-0"
            onClick={handleAddFundsClick}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Checking...</span>
              </>
            ) : (
              <>
                <Plus className="mr-1.5 h-4 w-4" />
                <span>Add Funds</span>
              </>
            )}
          </Button>
          <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[880px] p-4 sm:p-6 bg-canvas border border-black/10 rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-steel">
                01 // TREASURY TOP-UP
              </p>
              <DialogTitle className="font-display text-xl font-bold tracking-tight text-ink">
                Add Funds to Brand Vault
              </DialogTitle>
              <DialogDescription className="text-sm text-slate">
                Fund your brand vault instantly via zero-fee UPI or direct USDC on Base L2.
              </DialogDescription>
            </DialogHeader>
            <AddFunds
              onSuccess={() => {
                setShowAddFundsDialog(false);
                onRefresh();
              }}
            />
          </DialogContent>
        </Dialog>
      </CardContent>

      {/* Brand Profile Modal */}
      {showProfileModal && brandProfile && (
        <BrandProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          brandProfile={brandProfile}
          onProfileUpdated={handleProfileUpdated}
        />
      )}
    </Card>
  );
};

export default WalletOverview;
