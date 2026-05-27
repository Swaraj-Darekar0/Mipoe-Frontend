import { useEffect, useState } from "react";
import BrandLayout from "@/layouts/BrandLayout";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { 
  fetchBrandCampaigns, 
  deleteCampaign, 
  Campaign, 
  verifyDeposit, 
  getWalletBalance,
  getBrandProfile,
  BrandProfile
} from "@/lib/api";
import WalletOverview from "@/components/brand/WalletOverview";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Clock, 
  Building2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BrandOnboarding } from "@/components/brand/BrandOnboarding";

const BrandDashboard = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Onboarding States
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchBalance = async () => {
    try {
      const data = await getWalletBalance();
      setWalletBalance(data.balance);
    } catch (error) {
      console.error("Failed to fetch wallet", error);
    }
  };

  const verifyTransaction = async (orderId: string) => {
    try {
      toast({ title: "Verifying Payment", description: "Please wait..." });
      const data = await verifyDeposit(orderId);
      setWalletBalance(data.new_balance);
      toast({ 
        title: "Success!", 
        description: `Deposit verified. New Balance: ₹${data.new_balance}`, 
        className: "bg-green-50 border-green-200" 
      });
      navigate("/brand/dashboard", { replace: true });
    } catch (error: any) {
      toast({ title: "Verification Failed", description: error.message, variant: "destructive" });
    }
  };

  const loadProfile = async (silent = false) => {
    if (!silent) setProfileLoading(true);
    try {
      const data = await getBrandProfile();
      setProfile(data);
    } catch (err) {
      console.error("Failed to load brand profile", err);
    } finally {
      if (!silent) setProfileLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Polling for automated PAN check and admin compliance review updates
  useEffect(() => {
    if (!profile) return;
    const status = profile.onboarding_status;
    
    if (status === "verifying_pan" || status === "pending_verification") {
      const interval = setInterval(() => {
        loadProfile(true);
      }, status === "verifying_pan" ? 3000 : 8000);
      return () => clearInterval(interval);
    }
  }, [profile?.onboarding_status]);

  useEffect(() => {
    if (profile?.onboarding_status === "verified") {
      const loadDashboardData = async () => {
        try {
          setLoading(true);
          const [campaignData, balanceData] = await Promise.all([
            fetchBrandCampaigns(),
            getWalletBalance()
          ]);
          setCampaigns(campaignData);
          setWalletBalance(balanceData.balance);

          const orderId = searchParams.get("order_id");
          if (orderId) {
            verifyTransaction(orderId);
          }
        } catch (err) {
          if (err instanceof Error) setError(err.message);
          else setError("An unknown error occurred");
        } finally {
          setLoading(false);
        }
      };
      loadDashboardData();
    }
  }, [profile?.onboarding_status]);

  if (profileLoading && !profile) {
    return (
      <BrandLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <Clock className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
          <p className="text-gray-600 font-medium">Loading compliance dashboard...</p>
        </div>
      </BrandLayout>
    );
  }

  // If Verified, render normal dashboard
  if (profile?.onboarding_status === "verified") {
    return (
      <BrandLayout>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Campaign Performance</h2>
          <Link to="/brand/transactions">
            <Button className="gap-2" variant="outline">
              <BarChart3 className="w-4 h-4" />
              Transaction Log
            </Button>
          </Link>
        </div>
        
        <WalletOverview balance={walletBalance} onRefresh={fetchBalance} />
        
        <div className="bg-white rounded shadow overflow-x-auto mt-6">
          {error && <div className="text-red-600 text-sm p-4">{error}</div>}
          {loading ? (
            <div className="p-8 text-center text-gray-500 font-medium">Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="font-semibold text-lg text-gray-700">No campaigns created yet</p>
              <p className="text-gray-400 text-sm mt-1 mb-4">Launch your first marketing campaign to get started!</p>
              <Link to="/brand/create">
                <Button className="bg-indigo-600 hover:bg-indigo-700">Create Campaign</Button>
              </Link>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Funds Locked</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPV</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Eyeballs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deadline</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {campaigns.map(campaign => (
                  <tr key={campaign.id} className="hover:bg-blue-50">
                    <td className="px-6 py-4 font-semibold text-gray-700">
                      {campaign.is_active ? (
                        <span className="text-green-600">Active</span>
                      ) : (
                        <span className="text-red-600">Inactive</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-700">
                      <Link to={`/brand/dashboard/${campaign.id}`} className="hover:underline text-indigo-600">
                        {campaign.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">{campaign.platform}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      ₹{(campaign?.funds_allocated || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">₹{campaign.cpv}</td>
                    <td className="px-6 py-4">{(campaign.total_view_count || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm">{campaign.deadline}</td>
                    <td className="px-6 py-4">
                      <button
                        className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50 font-medium"
                        onClick={async () => {
                          const funds = campaign.funds_allocated || 0;
                          let confirmMessage = "";

                          if (funds > 0) {
                            confirmMessage = `⚠️ REFUND WARNING ⚠️\n\nThis campaign still has ₹${funds.toLocaleString()} allocated.\n\nDeleting it will:\n1. REFUND ₹${funds.toLocaleString()} to your Wallet.\n2. PERMANENTLY DELETE all campaign data.\n\nAre you sure you want to proceed?`;
                          } else {
                            confirmMessage = "Are you sure you want to delete this campaign? This action cannot be undone.";
                          }

                          if (!window.confirm(confirmMessage)) return;

                          try {
                            setDeletingId(campaign.id);
                            await deleteCampaign(campaign.id);
                            setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
                            if (funds > 0) {
                              alert(`Campaign deleted and ₹${funds.toLocaleString()} refunded to your wallet.`);
                              window.location.reload(); 
                            }
                          } catch (err: unknown) {
                            if (err instanceof Error) {
                              setError(err.message);
                            } else {
                              setError("An unknown error occurred");
                            }
                          } finally {
                            setDeletingId(null);
                          }
                        }}
                        disabled={deletingId === campaign.id}
                      >
                        {deletingId === campaign.id ? "Processing..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </BrandLayout>
    );
  }

  // Render Onboarding Wizard
  return (
    <BrandLayout>
      <BrandOnboarding 
        profile={profile} 
        onProfileUpdated={loadProfile} 
      />
    </BrandLayout>
  );
};

export default BrandDashboard;