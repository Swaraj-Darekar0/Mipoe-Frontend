// Update this page (the content is just a fallback if you fail to update the page)

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetchAllCampaigns } from "@/lib/api";
import CampaignCard from "@/components/creator/CampaignCard";
import { Campaign } from "@/lib/api";
import Header from '@/components/Home/Header';
import Hero from '@/components/Home/Hero';
import FeatureSplit from '@/components/Home/FeatureSplit';
import NavigationLinks from '@/components/Home/NavigationLinks';
import GridSection from '@/components/Home/GridSection';
import Footer from '@/components/Home/Footer';
import IllustratedGuide from '@/components/Home/illustrationGuide';
import comaprisonTable from '@/components/Home/ComparisonTable';
import ComparisonMatrix from "@/components/Home/ComparisonTable";
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
    <div className="bg-background-light dark:bg-background-dark text-dark-void dark:text-snow font-mono transition-colors duration-300 antialiased overflow-x-hidden selection:bg-primary selection:text-snow min-h-screen">
      <main className="w-full max-w-[1920px] mx-auto border-x border-dark-void dark:border-dusty-grey/30 min-h-screen flex flex-col relative">
        <Header />
        <Hero />
        <FeatureSplit />
        <NavigationLinks />
        <IllustratedGuide />
        <ComparisonMatrix />
        <Footer />
      </main>
      
      {/* Decorative Fixed Sidebar Elements */}
      <div className="fixed top-1/2 left-4 w-1 h-16 bg-primary hidden xl:block mix-blend-difference pointer-events-none transform -translate-y-1/2"></div>
      <div className="fixed top-1/2 right-4 w-1 h-16 bg-primary hidden xl:block mix-blend-difference pointer-events-none transform -translate-y-1/2"></div>
    </div>
        // {/* Campaigns List */}
        // <div className="max-w-5xl mx-auto mt-10 px-4">
        //   <h2 className="text-2xl font-bold mb-6 text-gray-800">All Campaigns</h2>
        //   {loading ? (
        //     <div>Loading...</div>
        //   ) : error ? (
        //     <div className="text-red-600 text-sm">{error}</div>
        //   ) : campaigns.length > 0 ? (
        //     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-10 justify-center items-stretch">
        //       {campaigns.map(camp => (
        //         <div
        //           key={camp.id}
        //           className="flex justify-center items-stretch cursor-pointer"
        //           onClick={() => navigate("/login")}
        //         >
        //         <CampaignCard {...camp} hideStatusActions={true} />
        //         </div>
        //       ))}
        //     </div>
        //   ) : (
        //     <div className="text-gray-500">No campaigns available.</div>
        //   )}
        // </div>
  );
};

export default Index;
