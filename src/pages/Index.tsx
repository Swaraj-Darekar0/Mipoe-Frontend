// Update this page (the content is just a fallback if you fail to update the page)

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetchAllCampaigns } from "@/lib/api";
import CampaignCard from "@/components/creator/CampaignCard";
import { Campaign } from "@/lib/api";

const Index = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetchAllCampaigns()
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-6">clipper</h1>
      <p className="text-xl text-gray-700 text-center mb-8 max-w-2xl">
        {/* Navbar */}
        <nav className="flex items-center justify-between px-8 py-4 bg-white shadow-sm border-b">
          <span className="text-2xl font-bold text-blue-700 select-none cursor-default">
            clipper
          </span>
          <div className="flex gap-4">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
            <button
              className="px-4 py-2 bg-gray-200 text-blue-700 rounded hover:bg-gray-300 transition"
              onClick={() => navigate("/register")}
            >
              Register
            </button>
          </div>
        </nav>
        {/* Campaigns List */}
        <div className="max-w-5xl mx-auto mt-10 px-4">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">All Campaigns</h2>
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div className="text-red-600 text-sm">{error}</div>
          ) : campaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-10 justify-center items-stretch">
              {campaigns.map(camp => (
                <div
                  key={camp.id}
                  className="flex justify-center items-stretch cursor-pointer"
                  onClick={() => navigate("/login")}
                >
                <CampaignCard {...camp} hideStatusActions={true} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">No campaigns available.</div>
          )}
        </div>
      </p>
    </div>
  );
};

export default Index;
