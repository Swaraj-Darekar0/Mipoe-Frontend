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
      <div className="flex flex-col items-center justify-center min-h-screen bg-canvas gap-3 w-full">
        <Clock className="w-6 h-6 animate-spin text-lava" />
        <p className="font-mono text-xs uppercase tracking-wider text-slate">Loading creator storefront...</p>
      </div>
    );
  }

  if (!storeData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-canvas p-6 text-center w-full">
        <ShoppingBag className="w-12 h-12 text-black/20 mb-4" />
        <h1 className="font-display text-2xl font-bold text-ink mb-2 tracking-tight">Storefront Not Found</h1>
        <p className="text-slate text-sm max-w-sm">
          The creator storefront you are looking for does not exist or has been disabled.
        </p>
      </div>
    );
  }

  const { creator, store, promoted_products, promoted_saas } = storeData;
  const hasProducts = promoted_products.length > 0;
  const hasSaaS = promoted_saas.length > 0;

  return (
    <div className="min-h-screen bg-canvas text-ink overflow-x-hidden relative flex flex-col justify-between w-full">
      <div className="w-full flex-grow pb-12">
        {/* Banner Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-4 sm:pt-6">
          <div className="w-full h-44 sm:h-56 lg:h-64 bg-black/[0.03] overflow-hidden relative rounded-2xl border border-black/10">
            {store.banner_url ? (
              <img 
                src={store.banner_url} 
                alt="Cover Banner" 
                className="h-44 sm:h-56 lg:h-64 w-full object-cover" 
              />
            ) : (
              <div className="w-full h-full bg-black/[0.03] flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-lava/40" />
              </div>
            )}
          </div>
        </div>

        {/* Profile Details Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
          {/* Horizontal Creator Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 -mt-6 sm:-mt-8 mb-6 sm:mb-8 bg-white p-3.5 sm:p-5 rounded-2xl border border-black/10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="size-11 sm:size-14 rounded-2xl bg-lava text-white font-display font-bold text-base sm:text-xl flex items-center justify-center shrink-0 uppercase select-none">
                {creator.nickname ? creator.nickname[0] : <User className="w-5 h-5 sm:w-7 sm:h-7" />}
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
                  <h1 className="font-display text-base sm:text-xl font-bold text-ink tracking-tight truncate">
                    {creator.nickname}
                  </h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[10px] sm:text-xs font-bold bg-lava/10 text-lava border border-lava/25 tracking-wider">
                    @{creator.username}
                  </span>
                </div>
                {store.bio && (
                  <p className="text-xs sm:text-sm text-slate truncate mt-0.5 sm:mt-1 leading-normal max-w-2xl" title={store.bio}>
                    {store.bio}
                  </p>
                )}
              </div>
            </div>

            <Button
              variant="ink"
              onClick={handleShareStore}
              className="text-xs shrink-0 h-9 px-3.5 sm:px-4"
            >
              <Share2 className="w-3.5 h-3.5 mr-1.5" />
              <span>Share Store</span>
            </Button>
          </div>

          {/* Items Showcase */}
          {!hasProducts && !hasSaaS ? (
            <div className="text-center py-20 border border-dashed border-black/15 rounded-2xl bg-white">
              <ShoppingBag className="w-12 h-12 text-black/20 mx-auto mb-3" />
              <h3 className="font-display font-bold text-ink text-lg tracking-tight">Storefront Empty</h3>
              <p className="text-slate text-xs mt-1">This creator hasn't published any promoted products yet.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Conditional Tabs render if creator has both types */}
              {hasProducts && hasSaaS ? (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full max-w-xs sm:max-w-sm grid grid-cols-2 h-auto p-1 mb-6 sm:mb-8">
                    <TabsTrigger 
                      value="products" 
                      className="rounded-lg px-3 sm:px-6 py-2 flex items-center justify-center gap-1.5 sm:gap-2 text-xs font-bold transition-colors duration-150"
                    >
                      <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Products
                    </TabsTrigger>
                    <TabsTrigger 
                      value="saas" 
                      className="rounded-lg px-3 sm:px-6 py-2 flex items-center justify-center gap-1.5 sm:gap-2 text-xs font-bold transition-colors duration-150"
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
                  <h2 className="font-mono text-xs sm:text-sm font-bold text-ink mb-5 flex items-center gap-2 uppercase tracking-wider">
                    <Package className="w-4 h-4 text-lava" />
                    Featured Products
                  </h2>
                  {renderProductsGrid(promoted_products)}
                </div>
              ) : (
                <div>
                  <h2 className="font-mono text-xs sm:text-sm font-bold text-ink mb-5 flex items-center gap-2 uppercase tracking-wider">
                    <Globe className="w-4 h-4 text-lava" />
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
      <footer className="w-full border-t border-black/10 py-8 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 text-center space-y-2 text-xs text-slate">
          <p className="font-display font-bold text-ink">
            Powered by sellr<span className="text-lava">.</span>
          </p>
          <p className="flex items-center justify-center gap-1 text-steel">
            Made with <Heart className="w-3.5 h-3.5 text-lava fill-lava" /> for creators everywhere.
          </p>
        </div>
      </footer>
    </div>
  );

  // Sub-renderers
  function renderProductsGrid(productsList: typeof promoted_products) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {productsList.map(prod => (
          <div 
            key={prod.product_id}
            className="bg-white border border-black/10 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] hover:border-lava/50 transition-colors duration-150 overflow-hidden flex flex-col justify-between group"
          >
            <div>
              <div className="w-full aspect-[16/10] bg-black/[0.03] border-b border-black/[0.06] relative overflow-hidden">
                {prod.image_url ? (
                  <img 
                    src={prod.image_url} 
                    alt={prod.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-black/20">
                    <Package className="w-7 h-7" />
                  </div>
                )}
              </div>
              <div className="p-4 space-y-1.5">
                <h3 className="font-display text-sm font-bold text-ink tracking-tight line-clamp-2 group-hover:text-lava transition-colors duration-150 leading-snug">
                  {prod.name}
                </h3>
                <p className="text-sm font-bold font-mono tabular-nums text-lava">
                  ₹{prod.price.toLocaleString()}
                </p>
                <p className="text-xs text-slate line-clamp-3 leading-normal pt-0.5">
                  {stripHtml(prod.description) || "No description."}
                </p>
              </div>
            </div>

            <div className="p-4 pt-0">
              <Button
                variant="creator"
                onClick={() => window.open(prod.product_url || getAffiliateRedirectUrl(prod.affiliate_code), "_blank")}
                className="w-full text-xs h-9"
              >
                <span>Buy Product</span>
                <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderSaaSList(saasList: typeof promoted_saas) {
    return (
      <div className="space-y-5">
        {saasList.map(item => (
          <div 
            key={item.affiliate_mapping_id}
            className="bg-white border border-black/10 p-5 sm:p-6 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] hover:border-lava/50 flex flex-col md:flex-row justify-between gap-5 transition-colors duration-150 group"
          >
            {/* Banner block representing blog cover image */}
            <div className="w-full md:w-[260px] lg:w-[300px] aspect-[16/9] md:aspect-[16/10] rounded-xl overflow-hidden bg-black/[0.03] border border-black/[0.06] relative shrink-0">
              {item.custom_banner_url || item.campaign_image_url ? (
                <img 
                  src={item.custom_banner_url || item.campaign_image_url || ""} 
                  alt={item.campaign_name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-black/20">
                  <Globe className="w-8 h-8" />
                </div>
              )}
            </div>

            <div className="flex-grow flex flex-col justify-between gap-4 min-w-0">
              <div className="space-y-2">
                <h3 className="font-display text-lg sm:text-xl font-bold text-ink tracking-tight group-hover:text-lava transition-colors duration-150">
                  {item.campaign_name}
                </h3>
                <p className="text-xs sm:text-sm text-slate leading-relaxed">
                  {item.custom_description || item.campaign_description || "No review content provided."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Button
                  variant="creator"
                  onClick={() => window.open(getAffiliateRedirectUrl(item.affiliate_code), "_blank")}
                  className="text-xs px-5 h-9"
                >
                  <span>Learn More</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
}
