import { useEffect, useState } from "react";
import BrandLayout from "@/layouts/BrandLayout";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { fetchBrandCampaigns, deleteCampaign, Campaign, verifyDeposit, getWalletBalance } from "@/lib/api";
import WalletOverview from "@/components/brand/WalletOverview";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BrandDashboard = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchBalance = async () => {
    try {
      const data = await getWalletBalance();
      setWalletBalance(data.balance);
    } catch (error) {
      console.error("Failed to fetch wallet", error);
      toast({
        title: "Error",
        description: "Failed to load wallet balance.",
        variant: "destructive",
      });
    }
  };

  const verifyTransaction = async (orderId: string) => {
    try {
      toast({ title: "Verifying Payment", description: "Please wait..." });
      const data = await verifyDeposit(orderId);
      setWalletBalance(data.new_balance); // Update balance directly
      toast({ 
        title: "Success!", 
        description: `Deposit verified. New Balance: ₹${data.new_balance}`, 
        className: "bg-green-50 border-green-200" 
      });
      // Clean URL
      navigate("/brand/dashboard", { replace: true });
    } catch (error: any) {
      toast({ title: "Verification Failed", description: error.message, variant: "destructive" });
    }
  };
  
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Wait for all essential data to be fetched concurrently
        const [campaignData, balanceData] = await Promise.all([
          fetchBrandCampaigns(),
          getWalletBalance()
        ]);
        
        setCampaigns(campaignData);
        setWalletBalance(balanceData.balance);

        // After data is loaded, check for any pending transaction to verify
        const orderId = searchParams.get("order_id");
        if (orderId) {
          // No need to await if we want the UI to be interactive while verification happens
          // The verification function handles its own toasts and state updates.
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
  }, []); // Run only on initial mount

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
      
      <div className="bg-white rounded shadow overflow-x-auto">
        {error && <div className="text-red-600 text-sm p-4">{error}</div>}
        {loading ? (
          <div className="p-4">Loading...</div>
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
                    <Link to={`/brand/dashboard/${campaign.id}`} className="hover:underline">
                      {campaign.name}
                    </Link>
                    
                  </td>
                  <td className="px-6 py-4">{campaign.platform}</td>

                  {/* [NEW] Explicitly show Locked Funds */}
                  <td className="px-6 py-4 font-medium text-gray-800">
                    ₹{(campaign?.funds_allocated || 0).toLocaleString()}
                  </td>
                  
                  <td className="px-6 py-4">₹{campaign.cpv}</td>
                  <td className="px-6 py-4">{campaign.total_view_count.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm">{campaign.deadline}</td>
                  <td className="px-6 py-4">
                    <button
                      className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50 font-medium"
                      onClick={async () => {
                        // -----------------------------------------------------
                        // STEP 3: SMART DELETE LOGIC
                        // -----------------------------------------------------
                        const funds = campaign.funds_allocated || 0;
                        let confirmMessage = "";

                        if (funds > 0) {
                          confirmMessage = `⚠️ REFUND WARNING ⚠️\n\nThis campaign still has ₹${funds.toLocaleString()} allocated.\n\nDeleting it will:\n1. REFUND ₹${funds.toLocaleString()} to your Wallet.\n2. PERMANENTLY DELETE all campaign data.\n\nAre you sure you want to proceed?`;
                        } else {
                          confirmMessage = "Are you sure you want to delete this campaign? This action cannot be undone.";
                        }

                        if (!window.confirm(confirmMessage)) return;

                        try {
                          console.log('=== DELETE CAMPAIGN START ===');
                          console.log('Deleting campaign ID:', campaign.id);
                          console.log('Campaign funds allocated:', funds);
                          setDeletingId(campaign.id);
                          // The backend handles the actual refund logic now!
                          await deleteCampaign(campaign.id);
                          
                          console.log('Campaign deleted successfully');
                          // Update UI
                          setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
                          
                          // Optional: Alert user of success if money was refunded
                          if (funds > 0) {
                            console.log('Refund amount:', funds);
                            alert(`Campaign deleted and ₹${funds.toLocaleString()} refunded to your wallet.`);
                            // Trigger a window reload or context update to see new wallet balance
                            window.location.reload(); 
                          }
                          
                        } catch (err: unknown) {
                          console.error('=== DELETE CAMPAIGN ERROR ===');
                          console.error('Error object:', err);
                          if (err instanceof Error) {
                            console.error('Error message:', err.message);
                            setError(err.message);
                          } else {
                            console.error('Unknown error type:', err);
                            setError("An unknown error occurred");
                          }
                        } finally {
                          setDeletingId(null);
                          console.log('=== DELETE CAMPAIGN END ===');
                        }
                        // -----------------------------------------------------
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
};
export default BrandDashboard;