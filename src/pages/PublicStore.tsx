import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPublicStore, PublicStoreData } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  Globe, 
  Clock, 
  ArrowUpRight, 
  ShoppingBag, 
  Share2, 
  Sparkles,
  ArrowRight,
  User,
  Heart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const stripHtml = (html: string) => {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
};

export default function PublicStore() {
  const { username } = useParams<{ username: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState<PublicStoreData | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");

  useEffect(() => {
    if (username) {
      loadStorefront(username);
    }
  }, [username]);

  const loadStorefront = async (user: string) => {
    setLoading(true);
    try {
      const data = await getPublicStore(user);
      setStoreData(data);
      
      // Determine initial active tab dynamically
      if (data.promoted_products.length > 0) {
        setActiveTab("products");
      } else if (data.promoted_saas.length > 0) {
        setActiveTab("saas");
      }
    } catch (err: any) {
      toast({ title: "Storefront Not Found", description: err.message || "This creator storefront does not exist.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getAffiliateRedirectUrl = (code: string) => {
    return `${window.location.origin}/affiliate/${code}`;
  };

  const handleShareStore = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link Copied", description: "Creator storefront link copied to clipboard!" });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4 w-screen">
        <Clock className="w-8 h-8 animate-spin text-indigo-650" />
        <p className="text-slate-500 font-semibold text-sm">Loading creator storefront...</p>
      </div>
    );
  }

  if (!storeData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center w-screen">
        <ShoppingBag className="w-16 h-16 text-slate-300 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Storefront Not Found</h1>
        <p className="text-slate-500 text-sm max-w-sm">
          The creator storefront you are looking for does not exist or has been disabled.
        </p>
      </div>
    );
  }

  const { creator, store, promoted_products, promoted_saas } = storeData;
  const hasProducts = promoted_products.length > 0;
  const hasSaaS = promoted_saas.length > 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 overflow-x-hidden relative flex flex-col justify-between w-screen">
      {/* Decorative gradients (Modern light theme look) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-gradient-to-r from-indigo-50/40 via-purple-50/40 to-pink-50/40 blur-[80px] pointer-events-none -z-10"></div>

      <div className="w-full flex-grow pb-12">
        {/* Banner Container - Constrained for desktop to avoid taking full vertical space */}
        <div className="max-w-4xl mx-auto md:pt-6">
          <div className="w-full aspect-[2.8/1] sm:aspect-[3.5/1] bg-slate-100 overflow-hidden relative md:rounded-3xl border border-slate-200/60 shadow-sm">
            {store.banner_url ? (
              <img src={store.banner_url} alt="Cover Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-indigo-400/40 animate-pulse" />
              </div>
            )}
            <div className="absolute bottom-4 right-4 z-10">
              <Button
                onClick={handleShareStore}
                className="bg-white/80 backdrop-blur-md border border-slate-200/80 hover:bg-white text-slate-800 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Store</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Profile Details Layout */}
        <div className="max-w-4xl mx-auto px-4 md:px-6 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5 -mt-10 sm:-mt-14 mb-8">
            <div className="size-20 sm:size-28 rounded-3xl bg-indigo-650 border-[4px] border-[#F8FAFC] shadow-md flex items-center justify-center text-white text-3xl sm:text-4xl font-extrabold uppercase select-none shrink-0">
              {creator.nickname ? creator.nickname[0] : <User className="w-10 h-10" />}
            </div>
            
            <div className="space-y-1 flex-1 pb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {creator.nickname}
              </h1>
              <p className="text-sm text-indigo-600 font-bold uppercase tracking-wider">
                @{creator.username}
              </p>
            </div>
          </div>

          {/* Bio section - Styled elegantly on light card */}
          {store.bio && (
            <div className="bg-white border border-slate-200/60 p-5 rounded-2xl mb-10 leading-relaxed text-sm text-slate-600 shadow-sm">
              {store.bio}
            </div>
          )}

          {/* Items Showcase */}
          {!hasProducts && !hasSaaS ? (
            <div className="text-center py-20 border border-dashed border-slate-200/80 rounded-2xl bg-white/60">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700 text-lg">Storefront Empty</h3>
              <p className="text-slate-400 text-xs mt-1">This creator hasn't published any promoted products yet.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Conditional Tabs render if creator has both types */}
              {hasProducts && hasSaaS ? (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="bg-slate-100 border border-slate-200/50 p-1 rounded-xl mb-8">
                    <TabsTrigger 
                      value="products" 
                      className="rounded-lg px-8 flex items-center gap-2 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-indigo-650 data-[state=active]:shadow-sm transition"
                    >
                      <Package className="w-4 h-4" />
                      Products
                    </TabsTrigger>
                    <TabsTrigger 
                      value="saas" 
                      className="rounded-lg px-8 flex items-center gap-2 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-indigo-650 data-[state=active]:shadow-sm transition"
                    >
                      <Globe className="w-4 h-4" />
                      SaaS Software
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="products" className="outline-none">
                    {renderProductsGrid(promoted_products)}
                  </TabsContent>

                  <TabsContent value="saas" className="outline-none">
                    {renderSaaSList(promoted_saas)}
                  </TabsContent>
                </Tabs>
              ) : hasProducts ? (
                <div>
                  <h2 className="text-xs font-bold text-slate-500 mb-6 flex items-center gap-2 uppercase tracking-wider">
                    <Package className="w-4 h-4 text-indigo-500" />
                    Featured Products
                  </h2>
                  {renderProductsGrid(promoted_products)}
                </div>
              ) : (
                <div>
                  <h2 className="text-xs font-bold text-slate-500 mb-6 flex items-center gap-2 uppercase tracking-wider">
                    <Globe className="w-4 h-4 text-indigo-500" />
                    SaaS Recommendations
                  </h2>
                  {renderSaaSList(promoted_saas)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/60 py-8 bg-white mt-auto">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-2 text-xs text-slate-500">
          <p className="font-semibold text-slate-600">Powered by Mipoe Creator Networks</p>
          <p className="flex items-center justify-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> for creators everywhere.
          </p>
        </div>
      </footer>
    </div>
  );

  // Sub-renderers
  function renderProductsGrid(productsList: typeof promoted_products) {
    return (
      <div className="columns-1 sm:columns-2 md:columns-3 gap-6 space-y-6 [column-fill:_balance]">
        {productsList.map(prod => (
          <div 
            key={prod.product_id}
            className="break-inside-avoid bg-white hover:bg-slate-50/20 border border-slate-200/60 hover:border-slate-200/80 rounded-2xl overflow-hidden flex flex-col justify-between transition duration-200 group shadow-sm hover:shadow-md mb-6"
          >
            <div>
              <div className="w-full bg-slate-50 border-b border-slate-100 relative overflow-hidden">
                {prod.image_url ? (
                  <img 
                    src={prod.image_url} 
                    alt={prod.name} 
                    className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-102" 
                  />
                ) : (
                  <div className="w-full aspect-[16/10] flex items-center justify-center text-slate-300">
                    <Package className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="p-4 space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900 line-clamp-2 group-hover:text-indigo-650 transition-colors">{prod.name}</h3>
                <p className="text-xs font-bold text-indigo-600">₹{prod.price.toLocaleString()}</p>
                <p className="text-[11px] text-slate-500 line-clamp-4 leading-normal pt-1">{stripHtml(prod.description) || "No description."}</p>
              </div>
            </div>

            <div className="p-4 pt-0">
              <Button
                onClick={() => window.open(prod.product_url || getAffiliateRedirectUrl(prod.affiliate_code), "_blank")}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 h-9 transition-colors"
              >
                <span>Buy Product</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderSaaSList(saasList: typeof promoted_saas) {
    return (
      <div className="space-y-6">
        {saasList.map(item => (
          <div 
            key={item.affiliate_mapping_id}
            className="bg-white hover:bg-slate-50/20 border border-slate-200/60 hover:border-slate-200/80 p-6 rounded-3xl flex flex-col md:flex-row justify-between gap-6 transition duration-200 group shadow-sm hover:shadow-md"
          >
            {/* Banner block representing blog cover image */}
            <div className="w-full md:w-[240px] aspect-[16/9] md:aspect-[16/10] rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 relative shrink-0">
              {item.custom_banner_url || item.campaign_image_url ? (
                <img 
                  src={item.custom_banner_url || item.campaign_image_url || ""} 
                  alt={item.campaign_name} 
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Globe className="w-8 h-8" />
                </div>
              )}
            </div>

            <div className="flex-grow flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-650 transition-colors">
                  {item.campaign_name}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-body">
                  {item.custom_description || item.campaign_description || "No review content provided."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Button
                  onClick={() => window.open(getAffiliateRedirectUrl(item.affiliate_code), "_blank")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-6 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <span>Learn More</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
}
