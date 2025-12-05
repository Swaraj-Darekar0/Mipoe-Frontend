import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Plus, RefreshCw, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
    checkAndHandleProfile().then(isComplete => {
      if(isComplete) {
        setShowAddFundsDialog(true);
      }
    });
  };

  return (
    <Card className="bg-gradient-to-r from-zinc-900 to-zinc-800 text-white border-none shadow-xl mb-8">
      <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Left: Balance Info */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm">
            <Wallet size={32} className="text-green-400" />
          </div>
          <div>
            <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Available Funds</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-bold">
                ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h2>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full"
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
            className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-6 text-lg shadow-lg shadow-green-900/20 transition-all hover:scale-105"
            onClick={handleAddFundsClick}
            disabled={loading}
          >
            {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Checking...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-5 w-5" /> Add Funds
                </>
              )}
          </Button>
          <DialogContent className="sm:max-w-[900px] p-0 bg-transparent border-none shadow-none">
            <AddFunds />
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