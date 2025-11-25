import { useEffect, useState } from "react";
import BrandLayout from "@/layouts/BrandLayout";
import { Link } from "react-router-dom";
import { fetchBrandCampaigns, deleteCampaign, Campaign } from "@/lib/api";
import WalletOverview from "@/components/brand/WalletOverview";

const BrandDashboard = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // [OPTIONAL] You might want to add a state to trigger Wallet refresh
  // const [refreshWallet, setRefreshWallet] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetchBrandCampaigns()
      .then(setCampaigns)
      .catch((err: unknown) => {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <BrandLayout>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Campaign Performance</h2>
      
      {/* WalletOverview will update automatically on next page load, 
          or you can pass a dependency if it supports it */}
      <WalletOverview />
      
      <div className="bg-white rounded shadow overflow-x-auto">
        {error && <div className="text-red-600 text-sm p-4">{error}</div>}
        {loading ? (
          <div className="p-4">Loading...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget Goal</th>
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
                    <Link to={`/brand/dashboard/${campaign.id}`} className="hover:underline">
                      {campaign.name}
                    </Link>
                    {/* Visual indicator if funds are inside */}
                    {(campaign.funds_allocated || 0) > 0 && (
                      <span className="ml-2 text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                        Active Funds
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">{campaign.platform}</td>
                  {/* Renamed Column Header to 'Budget Goal' visually above, kept data same */}
                  <td className="px-6 py-4 text-gray-400">₹{campaign.budget.toLocaleString()}</td>
                  
                  {/* [NEW] Explicitly show Locked Funds */}
                  <td className="px-6 py-4 font-medium text-gray-800">
                    ₹{(campaign.funds_allocated || 0).toLocaleString()}
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
                          setDeletingId(campaign.id);
                          // The backend handles the actual refund logic now!
                          await deleteCampaign(campaign.id);
                          
                          // Update UI
                          setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
                          
                          // Optional: Alert user of success if money was refunded
                          if (funds > 0) {
                            alert(`Campaign deleted and ₹${funds.toLocaleString()} refunded to your wallet.`);
                            // Trigger a window reload or context update to see new wallet balance
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