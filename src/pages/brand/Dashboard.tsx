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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPV</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Eyeballs Gained</th>
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
                  </td>
                  <td className="px-6 py-4">{campaign.platform}</td>
                  <td className="px-6 py-4">₹{campaign.budget}</td>
                  <td className="px-6 py-4">₹{campaign.cpv}</td>
                  <td className="px-6 py-4">{campaign.total_view_count.toLocaleString()}</td>
                  <td className="px-6 py-4">{campaign.deadline}</td>
                  <td className="px-6 py-4">
                    <button
                      className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                      onClick={async () => {
                        if (!window.confirm("Are you sure you want to delete this campaign? This action cannot be undone.")) return;
                        try {
                          setDeletingId(campaign.id);
                          await deleteCampaign(campaign.id);
                          setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
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
                      {deletingId === campaign.id ? "Deleting..." : "Delete"}
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
