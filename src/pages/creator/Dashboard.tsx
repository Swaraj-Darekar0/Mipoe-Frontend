import React, { useEffect, useState } from "react";
import CreatorLayout from "@/layouts/CreatorLayout";
import CampaignCard from "@/components/creator/CampaignCard";
import { fetchAllCampaigns, fetchCreatorCampaigns, Campaign } from "@/lib/api";
import { useNavigate } from "react-router-dom";

// Define category information with type safety
interface CategoryInfo {
  id: string;
  name: string;
  subheader: string;
}

const CATEGORIES: CategoryInfo[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    subheader: 'Edits, Stream Moments, Clip-worthy Cuts'
  },
  {
    id: 'fashion_clothing',
    name: 'Fashion / Clothing',
    subheader: 'What\'s Trending: Fit Checks, Style Drops, Closet Peeks, GRWM'
  },
  {
    id: 'beauty_products',
    name: 'Beauty Products',
    subheader: 'Product Aesthetics, Makeup POVs, Skincare Routines'
  }

];

// Helper function to get category info by ID
const getCategoryInfo = (categoryId: string): CategoryInfo | undefined => {
  return CATEGORIES.find(cat => cat.id === categoryId);
};

const CreatorDashboard = () => {
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [yourCampaigns, setYourCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchAllCampaigns(),
      fetchCreatorCampaigns()
    ])
      .then(([all, yours]) => {
        console.log('All campaigns:', all);
        console.log('Your campaigns:', yours);
        setAllCampaigns(all);
        setYourCampaigns(yours);
      })
      .catch((err: unknown) => {
        console.error('Error fetching campaigns:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCardClick = (id: number) => {
    navigate(`/creator/dashboard/${id}`);
  };

  // Filter campaigns by active status and group by category
  const getCampaignsByCategory = (campaigns: Campaign[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activeCampaigns = campaigns.filter(camp => new Date(camp.deadline) >= today);
    
    // Group by category
    const campaignsByCategory: Record<string, Campaign[]> = {};
    
    // Initialize with all categories
    CATEGORIES.forEach(cat => {
      campaignsByCategory[cat.id] = [];
    });
    
    // Add uncategorized campaigns to a default category
    campaignsByCategory['other'] = [];
    
    // Categorize campaigns
    activeCampaigns.forEach(campaign => {
      const category = campaign.category || 'other';
      if (campaignsByCategory[category]) {
        campaignsByCategory[category].push(campaign);
      } else {
        campaignsByCategory[category].push(campaign);
      }
    });
    
    return campaignsByCategory;
  };

  // Get category name for display
  const getCategoryName = (categoryId: string): string => {
    const category = getCategoryInfo(categoryId);
    return category ? category.name : categoryId.replace('_', ' / ');
  };

  // Get subheader for category
  const getCategorySubheader = (categoryId: string): string => {
    const category = getCategoryInfo(categoryId);
    return category ? category.subheader : '';
  };

  const renderCampaignsSection = (title: string, campaigns: Campaign[]) => {
    if (campaigns.length === 0) return null;
    
    return (
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10 justify-center items-stretch">
          {campaigns.map(camp => (
            <div 
              key={camp.id} 
              className="flex justify-center items-stretch" 
              onClick={() => handleCardClick(camp.id)} 
              style={{ cursor: 'pointer' }}
            >
              <CampaignCard 
                {...camp} 
                submitted={yourCampaigns.some(yc => yc.id === camp.id)} 
                hideStatusActions={true} 
                total_view_count={camp.total_view_count} 
              />
            </div>
          ))}
        </div>
      </section>
    );
  };

  if (loading) {
    return (
      <CreatorLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading campaigns...</div>
        </div>
      </CreatorLayout>
    );
  }

  if (error) {
    return (
      <CreatorLayout>
        <div className="text-red-600 text-center p-4">{error}</div>
      </CreatorLayout>
    );
  }

  const yourCampaignsByCategory = getCampaignsByCategory(yourCampaigns);
  const allCampaignsByCategory = getCampaignsByCategory(allCampaigns);

  return (
    <CreatorLayout>
      {/* Your Campaigns */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Your Campaigns</h2>
        {yourCampaigns.length > 0 ? (
          CATEGORIES.map(category => {
            const campaigns = yourCampaignsByCategory[category.id] || [];
            if (campaigns.length === 0) return null;
            
            return (
              <div key={`your-${category.id}`} className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-1">{getCategoryName(category.id)}</h3>
                <p className="text-sm text-gray-500 mb-4">{getCategorySubheader(category.id)}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {campaigns.map(camp => (
                    <div 
                      key={camp.id} 
                      className="flex justify-center items-stretch" 
                      onClick={() => handleCardClick(camp.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <CampaignCard 
                        {...camp} 
                        submitted={true} 
                        hideStatusActions={true} 
                        total_view_count={camp.total_view_count} 
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-gray-500">No campaigns submitted yet.</div>
        )}
      </section>

      {/* All Campaigns */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">All Campaigns</h2>
        {allCampaigns.length > 0 ? (
          CATEGORIES.map(category => {
            const campaigns = allCampaignsByCategory[category.id] || [];
            if (campaigns.length === 0) return null;
            
            return (
              <div key={`all-${category.id}`} className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-1">{getCategoryName(category.id)}</h3>
                <p className="text-sm text-gray-500 mb-4">{getCategorySubheader(category.id)}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {campaigns
                    .filter(camp => !yourCampaigns.some(yc => yc.id === camp.id)) // Don't show campaigns you've already submitted to
                    .map(camp => (
                      <div 
                        key={camp.id} 
                        className="flex justify-center items-stretch" 
                        onClick={() => handleCardClick(camp.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <CampaignCard 
                          {...camp} 
                          submitted={false} 
                          hideStatusActions={true} 
                          total_view_count={camp.total_view_count} 
                        />
                      </div>
                    ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-gray-500">No ongoing campaigns available.</div>
        )}
      </section>
    </CreatorLayout>
  );
};

export default CreatorDashboard;
