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
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 gap-4 w-full">
        <Clock className="w-8 h-8 animate-spin text-orange-500" />
        <p className="text-zinc-600 font-semibold text-sm">Loading creator storefront...</p>
      </div>
    );
  }

  if (!storeData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 p-6 text-center w-full">
        <ShoppingBag className="w-16 h-16 text-zinc-300 mb-4" />
        <h1 className="text-2xl font-extrabold text-zinc-950 mb-2 tracking-tight">Storefront Not Found</h1>
        <p className="text-zinc-600 text-sm max-w-sm">
          The creator storefront you are looking for does not exist or has been disabled.
        </p>
      </div>
    );
  }

  const { creator, store, promoted_products, promoted_saas } = storeData;
  const hasProducts = promoted_products.length > 0;
  const hasSaaS = promoted_saas.length > 0;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 overflow-x-hidden relative flex flex-col justify-between w-full">
      {/* Subtle warm decorative glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[300px] bg-gradient-to-r from-orange-50/50 via-amber-50/30 to-zinc-50/20 blur-[80px] pointer-events-none -z-10"></div>

      <div className="w-full flex-grow pb-12">
        {/* Banner Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-4 sm:pt-6">
          <div className="w-full h-44 sm:h-56 lg:h-64 bg-zinc-100 overflow-hidden relative rounded-2xl md:rounded-3xl border border-zinc-200/90 shadow-sm">
            {store.banner_url ? (
              <img 
                src={store.banner_url} 
                alt="Cover Banner" 
                className="h-44 sm:h-56 lg:h-64 w-full object-cover rounded-2xl md:rounded-3xl shadow-sm" 
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-orange-100/50 via-zinc-100 to-amber-50 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-orange-400/50 animate-pulse" />
              </div>
            )}
          </div>
        </div>

        {/* Profile Details Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
          {/* Horizontal Creator Bar */}
          <div className="flex items-center justify-between gap-3 sm:gap-4 -mt-6 sm:-mt-8 mb-6 sm:mb-8 bg-white/95 backdrop-blur-md p-3 sm:p-5 rounded-2xl border border-zinc-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
              <div className="size-11 sm:size-14 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 text-white font-black text-base sm:text-xl shadow-sm ring-2 ring-white flex items-center justify-center shrink-0 uppercase select-none">
                {creator.nickname ? creator.nickname[0] : <User className="w-5 h-5 sm:w-7 sm:h-7" />}
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
                  <h1 className="text-sm sm:text-xl font-extrabold text-zinc-950 tracking-tight truncate">
                    {creator.nickname}
                  </h1>
                  <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200/70 tracking-wider">
                    @{creator.username}
                  </span>
                </div>
                {store.bio && (
                  <p className="text-[11px] sm:text-sm text-zinc-600 truncate mt-0.5 sm:mt-1 leading-normal max-w-2xl" title={store.bio}>
                    {store.bio}
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={handleShareStore}
              className="bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] sm:text-xs font-semibold rounded-xl flex items-center gap-1.5 sm:gap-2 shadow-xs shrink-0 h-8 sm:h-9 px-2.5 sm:px-4 transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Store</span>
            </Button>
          </div>

          {/* Items Showcase */}
          {!hasProducts && !hasSaaS ? (
            <div className="text-center py-20 border border-dashed border-zinc-200/90 rounded-2xl bg-white shadow-xs">
              <ShoppingBag className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
              <h3 className="font-extrabold text-zinc-950 text-lg tracking-tight">Storefront Empty</h3>
              <p className="text-zinc-600 text-xs mt-1">This creator hasn't published any promoted products yet.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Conditional Tabs render if creator has both types */}
              {hasProducts && hasSaaS ? (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full max-w-xs sm:max-w-sm grid grid-cols-2 h-auto p-1 sm:p-1.5 bg-zinc-100 border border-zinc-200/90 rounded-2xl mb-6 sm:mb-8">
                    <TabsTrigger 
                      value="products" 
                      className="rounded-xl px-3 sm:px-6 py-2 flex items-center justify-center gap-1.5 sm:gap-2 text-xs font-bold text-zinc-600 data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-xs transition"
                    >
                      <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Products
                    </TabsTrigger>
                    <TabsTrigger 
                      value="saas" 
                      className="rounded-xl px-3 sm:px-6 py-2 flex items-center justify-center gap-1.5 sm:gap-2 text-xs font-bold text-zinc-600 data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-xs transition"
                    >
                      <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">SaaS Software</span>
                      <span className="sm:hidden">SaaS</span>
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
                  <h2 className="text-xs sm:text-sm font-extrabold text-zinc-950 mb-6 flex items-center gap-2 uppercase tracking-wider">
                    <Package className="w-4 h-4 text-orange-500" />
                    Featured Products
                  </h2>
                  {renderProductsGrid(promoted_products)}
                </div>
              ) : (
                <div>
                  <h2 className="text-xs sm:text-sm font-extrabold text-zinc-950 mb-6 flex items-center gap-2 uppercase tracking-wider">
                    <Globe className="w-4 h-4 text-orange-500" />
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
      <footer className="w-full border-t border-zinc-200/90 py-8 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 text-center space-y-2 text-xs text-zinc-600">
          <p className="font-bold text-zinc-800">Powered by Mipoe Creator Networks</p>
          <p className="flex items-center justify-center gap-1 text-zinc-500">
            Made with <Heart className="w-3.5 h-3.5 text-orange-500 fill-orange-500" /> for creators everywhere.
          </p>
        </div>
      </footer>
    </div>
  );

  // Sub-renderers
  function renderProductsGrid(productsList: typeof promoted_products) {
    return (
      <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 gap-3 sm:gap-4 lg:gap-6 space-y-3 sm:space-y-4 lg:space-y-6 [column-fill:_balance]">
        {productsList.map(prod => (
          <div 
            key={prod.product_id}
            className="break-inside-avoid bg-white border border-zinc-200/90 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_28px_-8px_rgba(0,0,0,0.09)] hover:border-orange-300 transition-all duration-200 overflow-hidden flex flex-col justify-between group mb-3 sm:mb-4 lg:mb-6"
          >
            <div>
              <div className="w-full bg-zinc-100 border-b border-zinc-100 relative overflow-hidden">
                {prod.image_url ? (
                  <img 
                    src={prod.image_url} 
                    alt={prod.name} 
                    className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-102" 
                  />
                ) : (
                  <div className="w-full aspect-[16/10] flex items-center justify-center text-zinc-300">
                    <Package className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                )}
              </div>
              <div className="p-2.5 sm:p-4 space-y-1 sm:space-y-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-zinc-950 tracking-tight line-clamp-2 group-hover:text-orange-600 transition-colors leading-snug">
                  {prod.name}
                </h3>
                <p className="text-xs sm:text-sm font-black font-mono text-orange-600">
                  ₹{prod.price.toLocaleString()}
                </p>
                <p className="text-[10px] sm:text-xs text-zinc-600 line-clamp-2 sm:line-clamp-4 leading-normal pt-0.5 sm:pt-1">
                  {stripHtml(prod.description) || "No description."}
                </p>
              </div>
            </div>

            <div className="p-2.5 sm:p-4 pt-0 sm:pt-0">
              <Button
                onClick={() => window.open(prod.product_url || getAffiliateRedirectUrl(prod.affiliate_code), "_blank")}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-[11px] sm:text-xs rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 h-7 sm:h-9 px-2 transition-colors shadow-xs"
              >
                <span>Buy Product</span>
                <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
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
            className="bg-white border border-zinc-200/90 p-6 rounded-3xl shadow-xs hover:shadow-md hover:border-orange-300 flex flex-col md:flex-row justify-between gap-6 transition-all duration-200 group"
          >
            {/* Banner block representing blog cover image */}
            <div className="w-full md:w-[260px] lg:w-[300px] aspect-[16/9] md:aspect-[16/10] rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200/80 relative shrink-0">
              {item.custom_banner_url || item.campaign_image_url ? (
                <img 
                  src={item.custom_banner_url || item.campaign_image_url || ""} 
                  alt={item.campaign_name} 
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-300">
                  <Globe className="w-8 h-8" />
                </div>
              )}
            </div>

            <div className="flex-grow flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-extrabold text-zinc-950 tracking-tight group-hover:text-orange-600 transition-colors">
                  {item.campaign_name}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  {item.custom_description || item.campaign_description || "No review content provided."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Button
                  onClick={() => window.open(getAffiliateRedirectUrl(item.affiliate_code), "_blank")}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-6 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
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
