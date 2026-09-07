import React, { useEffect, useState } from "react";
import CreatorLayout from "@/layouts/CreatorLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ImageCropInput } from "@/components/ui/ImageCropInput";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  getCreatorStore, 
  updateCreatorStore, 
  getEligibleProducts, 
  promoteProduct, 
  unpromoteProduct, 
  getEligibleSaaS, 
  promoteSaaS, 
  unpromoteSaaS,
  uploadStoreImage,
  fetchCreatorProfile
} from "@/lib/api";
import { 
  Store, 
  Copy, 
  Check, 
  Package, 
  Globe, 
  Edit2,
  Sparkles,
  Loader2
} from "lucide-react";
import { compressImage } from "@/utils/imageCompression";

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

export default function StoreConfig() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submittingStore, setSubmittingStore] = useState(false);
  const [creatorUsername, setCreatorUsername] = useState("");
  
  // Store Config
  const [bio, setBio] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // Products
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // SaaS
  const [saasCampaigns, setSaasCampaigns] = useState<any[]>([]);
  const [saasLoading, setSaasLoading] = useState(false);

  // Editing state for SaaS descriptions/banners
  const [customSaaSData, setCustomSaaSData] = useState<Record<number, { custom_description: string; bannerUrl: string; bannerFile: File | null; bannerPreview: string | null }>>({});

  // Copy status
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    loadStoreData();
  }, []);

  const loadStoreData = async () => {
    setLoading(true);
    try {
      const profile = await fetchCreatorProfile();
      setCreatorUsername(profile.username);

      const storeData = await getCreatorStore();
      setBio(storeData.store.bio || "");
      setBannerUrl(storeData.store.banner_url || "");
      setBannerPreview(storeData.store.banner_url || null);

      await Promise.all([loadEligibleProducts(), loadEligibleSaaS()]);
    } catch (err: any) {
      toast({ title: "Error loading store settings", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadEligibleProducts = async () => {
    setProductsLoading(true);
    try {
      const prods = await getEligibleProducts();
      setProducts(prods);
    } catch (err: any) {
      console.error(err);
    } finally {
      setProductsLoading(false);
    }
  };

  const loadEligibleSaaS = async () => {
    setSaasLoading(true);
    try {
      const saasList = await getEligibleSaaS();
      setSaasCampaigns(saasList);
      
      // Populate custom review/blog editing inputs
      const initialSaaSData: typeof customSaaSData = {};
      saasList.forEach(item => {
        initialSaaSData[item.affiliate_mapping_id] = {
          custom_description: item.custom_description || "",
          bannerUrl: item.custom_banner_url || "",
          bannerFile: null,
          bannerPreview: item.custom_banner_url || null
        };
      });
      setCustomSaaSData(initialSaaSData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setSaasLoading(false);
    }
  };

  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingStore(true);
    try {
      let finalBannerUrl = bannerUrl;

      // Upload banner image if custom file is selected
      if (bannerFile) {
        const compressed = await compressImage(bannerFile);
        const publicUrl = await uploadStoreImage(compressed);
        finalBannerUrl = publicUrl;
        setBannerUrl(finalBannerUrl);
        setBannerFile(null);
      }

      await updateCreatorStore({ banner_url: finalBannerUrl, bio });
      toast({ title: "Store Updated", description: "Your storefront profile settings have been saved successfully!" });
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmittingStore(false);
    }
  };

  const handleProductToggle = async (prod: any) => {
    try {
      if (prod.is_promoted) {
        await unpromoteProduct(prod.product_id);
        toast({ title: "Removed from Store", description: `Product "${prod.name}" removed.` });
      } else {
        await promoteProduct(prod.product_id, prod.affiliate_mapping_id);
        toast({ title: "Added to Store", description: `Product "${prod.name}" is now live on your store!` });
      }
      await loadEligibleProducts();
    } catch (err: any) {
      toast({ title: "Action Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleSaaSToggle = async (item: any) => {
    try {
      if (item.is_promoted) {
        await unpromoteSaaS(item.affiliate_mapping_id);
        toast({ title: "Removed from Store", description: `SaaS program removed.` });
      } else {
        const customData = customSaaSData[item.affiliate_mapping_id];
        await promoteSaaS({
          affiliate_mapping_id: item.affiliate_mapping_id,
          custom_banner_url: customData?.bannerUrl || null,
          custom_description: customData?.custom_description || null
        });
        toast({ title: "Added to Store", description: `SaaS program added to storefront.` });
      }
      await loadEligibleSaaS();
    } catch (err: any) {
      toast({ title: "Action Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleSaveSaaSDetails = async (mappingId: number) => {
    const data = customSaaSData[mappingId];
    try {
      let finalBanner = data.bannerUrl;

      // Handle custom crop upload for SaaS campaign blog banner
      if (data.bannerFile) {
        const compressed = await compressImage(data.bannerFile);
        const publicUrl = await uploadStoreImage(compressed);
        finalBanner = publicUrl;
        setCustomSaaSData(prev => ({
          ...prev,
          [mappingId]: {
            ...prev[mappingId],
            bannerUrl: finalBanner,
            bannerFile: null,
            bannerPreview: finalBanner
          }
        }));
      }

      await promoteSaaS({
        affiliate_mapping_id: mappingId,
        custom_banner_url: finalBanner || null,
        custom_description: data.custom_description || null
      });
      toast({ title: "Changes Saved", description: "SaaS promotion details updated successfully." });
      await loadEligibleSaaS();
    } catch (err: any) {
      toast({ title: "Save Failed", description: err.message, variant: "destructive" });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(text);
    toast({ title: "Link Copied", description: `${label} link copied to clipboard!` });
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const getPublicStoreUrl = () => {
    return `${window.location.origin}/store/${creatorUsername}`;
  };

  const getAffiliateRedirectUrl = (code: string) => {
    return `${window.location.origin}/affiliate/${code}`;
  };

  if (loading) {
    return (
      <CreatorLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-zinc-500 font-semibold text-sm">Loading storefront settings...</p>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout>
      <div className="space-y-8 animate-in fade-in duration-200">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-zinc-900 flex items-center gap-3">
              <Store className="w-8 h-8 text-orange-500" />
              My Storefront
            </h1>
            <p className="text-zinc-500 mt-2 text-sm">Customize your personal storefront and manage your active affiliate promotions.</p>
          </div>
          
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 flex items-center justify-between gap-4 min-w-[280px] shadow-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Your Public Store Link</span>
              <span className="text-xs font-mono font-bold text-orange-600 truncate block max-w-[200px]">{getPublicStoreUrl()}</span>
            </div>
            <Button
              size="icon"
              variant="outline"
              onClick={() => copyToClipboard(getPublicStoreUrl(), "Storefront")}
              className="hover:bg-zinc-100 border-zinc-200 text-zinc-700 h-9 w-9"
            >
              {copiedLink === getPublicStoreUrl() ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </header>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full max-w-lg grid grid-cols-3 h-auto p-1 bg-zinc-100 border border-zinc-200/80 rounded-xl mb-6">
            <TabsTrigger value="general" className="rounded-lg px-2 sm:px-4 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-xs text-center truncate">
              <span className="hidden sm:inline">General Settings</span>
              <span className="sm:hidden">General</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="rounded-lg px-2 sm:px-4 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-xs text-center truncate">
              <span className="hidden sm:inline">Showcase Products</span>
              <span className="sm:hidden">Products</span>
            </TabsTrigger>
            <TabsTrigger value="saas" className="rounded-lg px-2 sm:px-4 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-xs text-center truncate">
              <span className="hidden sm:inline">Showcase SaaS</span>
              <span className="sm:hidden">SaaS</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: GENERAL SETTINGS */}
          <TabsContent value="general" className="outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Bio + Banner + Save */}
              <div className="bg-white border border-zinc-200/80 p-5 rounded-2xl space-y-4 shadow-xs">
                <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-orange-500" />
                  Customize Profile
                </h2>
                
                <form onSubmit={handleStoreSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 block uppercase tracking-wider">Store Bio</label>
                    <Textarea
                      placeholder="Write a catchy description or intro bio for your storefront visitors..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={2}
                      className="bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-orange-500 rounded-xl text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 block uppercase tracking-wider">Storefront Cover Banner (3:1 ratio)</label>
                    <div className="h-28 sm:h-32 w-full [&>div>div]:h-28 [&>div>div]:sm:h-32 [&>div>div]:aspect-auto [&_img]:h-full [&_img]:object-cover [&_.max-w-lg]:max-w-full [&_.p-4]:py-2 [&_.w-12]:w-8 [&_.h-12]:h-8 [&_.mb-3]:mb-1">
                      <ImageCropInput
                        aspectRatio="3:1"
                        value={bannerPreview || ""}
                        onChange={(file, preview) => {
                          setBannerFile(file);
                          setBannerPreview(preview);
                        }}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={submittingStore}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs h-9 px-5 rounded-xl shadow-xs w-full sm:w-auto"
                  >
                    {submittingStore ? "Saving Changes..." : "Save Settings"}
                  </Button>
                </form>
              </div>

              {/* Right Column: Tips + Preview */}
              <div className="bg-white border border-zinc-200/80 p-5 rounded-2xl space-y-4 flex flex-col justify-between shadow-xs">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-500" />
                    Storefront Tips
                  </h3>
                  <ul className="text-xs text-zinc-600 space-y-2.5">
                    <li className="flex gap-2">
                      <span className="text-orange-500 font-bold">•</span>
                      <span>Upload a high-quality widescreen banner that reflects your channel theme.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-orange-500 font-bold">•</span>
                      <span>Keep your bio concise. Point out your referral codes or exclusive discount offers!</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-orange-500 font-bold">•</span>
                      <span>Paste your public storefront link directly in your Instagram, TikTok, or YouTube link-in-bio sections.</span>
                    </li>
                  </ul>
                </div>

                <div className="border-t border-zinc-100 pt-4">
                  <p className="text-[11px] text-zinc-500 leading-normal mb-3">
                    Visitor activities, referral link clicks, and campaign conversions are tracked inside your Analytics hub.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => window.open(getPublicStoreUrl(), "_blank")}
                    className="w-full text-xs font-semibold border-zinc-200 text-zinc-700 hover:bg-zinc-50 h-9 rounded-xl"
                  >
                    <Globe className="w-4 h-4 mr-2 text-zinc-500" />
                    Preview Live Store
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: SHOWCASE PRODUCTS */}
          <TabsContent value="products" className="outline-none">
            <div className="bg-white border border-zinc-200/80 p-6 rounded-2xl space-y-6 shadow-xs">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-500" />
                  Showcase Campaign Products
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Choose physical products from your joined campaigns to feature on your storefront. We will generate a unique affiliate referral link for every product you toggle.
                </p>
              </div>

              {productsLoading ? (
                <div className="text-center py-12 text-zinc-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-2" />
                  <p className="text-sm font-semibold">Fetching eligible products...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50">
                  <Package className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
                  <p className="font-semibold text-zinc-900">No eligible products found</p>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                    Apply to join product-based affiliate campaigns first. Once approved, their products will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map(prod => (
                    <div 
                      key={`${prod.affiliate_mapping_id}-${prod.product_id}`} 
                      className={`bg-white border rounded-2xl p-4 flex flex-col justify-between gap-4 transition duration-150 ${
                        prod.is_promoted ? "border-orange-300 shadow-sm" : "border-zinc-200/80 shadow-xs"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="aspect-[16/10] rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 relative">
                          {prod.image_url ? (
                            <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-400">
                              <Package className="w-8 h-8" />
                            </div>
                          )}
                          <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-md border border-zinc-200 px-2 py-0.5 rounded-full text-[9px] text-zinc-700 font-bold uppercase tracking-wider">
                            {prod.campaign_name}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-zinc-900 line-clamp-1">{prod.name}</h3>
                          <p className="text-xs font-bold text-orange-600 mt-0.5">₹{prod.price.toLocaleString()}</p>
                          <p className="text-[10px] text-zinc-500 line-clamp-2 mt-1 leading-normal">{stripHtml(prod.description) || "No product description."}</p>
                        </div>
                      </div>

                      <div className="space-y-3 border-t border-zinc-100 pt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-zinc-600">Promote in Store</span>
                          <Switch
                            checked={prod.is_promoted}
                            onCheckedChange={() => handleProductToggle(prod)}
                            className="data-[state=checked]:bg-orange-500"
                          />
                        </div>

                        {prod.is_promoted && prod.affiliate_code && (
                          <div className="bg-zinc-50 border border-zinc-200 p-2 rounded-xl flex items-center justify-between gap-2 text-xs">
                            <span className="truncate text-zinc-600 font-medium font-mono text-[11px] max-w-[150px]">
                              {getAffiliateRedirectUrl(prod.affiliate_code)}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Copy Affiliate Link"
                              onClick={() => copyToClipboard(getAffiliateRedirectUrl(prod.affiliate_code), "Product Affiliate")}
                              className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-900"
                            >
                              {copiedLink === getAffiliateRedirectUrl(prod.affiliate_code) ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 3: SHOWCASE SAAS CAMPAIGNS */}
          <TabsContent value="saas" className="outline-none">
            <div className="bg-white border border-zinc-200/80 p-6 rounded-2xl space-y-6 shadow-xs">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-orange-500" />
                  Showcase SaaS Software (Blog Reviews)
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Promote SaaS programs you have joined. These showcase items are displayed as feature blogs/reviews on your storefront. You can provide a custom description review and upload a customized card banner.
                </p>
              </div>

              {saasLoading ? (
                <div className="text-center py-12 text-zinc-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-2" />
                  <p className="text-sm font-semibold">Fetching eligible SaaS programs...</p>
                </div>
              ) : saasCampaigns.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50">
                  <Globe className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
                  <p className="font-semibold text-zinc-900">No eligible SaaS programs found</p>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                    Apply to join SaaS-based affiliate campaigns first. Once approved, they will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {saasCampaigns.map(item => {
                    const customData = customSaaSData[item.affiliate_mapping_id] || {
                      custom_description: "",
                      bannerUrl: "",
                      bannerFile: null,
                      bannerPreview: null
                    };

                    return (
                      <div 
                        key={item.affiliate_mapping_id} 
                        className={`bg-white border rounded-2xl p-6 transition duration-150 ${
                          item.is_promoted ? "border-orange-300 shadow-sm" : "border-zinc-200/80 shadow-xs"
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row justify-between gap-6">
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-lg font-bold text-zinc-900">{item.campaign_name}</h3>
                                <p className="text-xs text-zinc-500 truncate max-w-lg mt-0.5">{item.campaign_description || "No campaign description."}</p>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-zinc-600">Showcase in Store</span>
                                <Switch
                                  checked={item.is_promoted}
                                  onCheckedChange={() => handleSaaSToggle(item)}
                                  className="data-[state=checked]:bg-orange-500"
                                />
                              </div>
                            </div>

                            {item.is_promoted && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-zinc-100 pt-4">
                                <div className="space-y-2">
                                  <label className="text-xs font-bold text-zinc-700">Custom Review description</label>
                                  <Textarea
                                    placeholder="Write a custom review, recommendation blog, or list benefits of this SaaS..."
                                    value={customData.custom_description}
                                    onChange={(e) => setCustomSaaSData(prev => ({
                                      ...prev,
                                      [item.affiliate_mapping_id]: {
                                        ...prev[item.affiliate_mapping_id],
                                        custom_description: e.target.value
                                      }
                                    }))}
                                    rows={5}
                                    className="bg-zinc-50 border-zinc-200 text-zinc-900 text-xs rounded-xl focus:border-orange-500"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-bold text-zinc-700">Custom Blog Banner (16:9)</label>
                                  <ImageCropInput
                                    aspectRatio="16:9"
                                    value={customData.bannerPreview || ""}
                                    onChange={(file, preview) => {
                                      setCustomSaaSData(prev => ({
                                        ...prev,
                                        [item.affiliate_mapping_id]: {
                                          ...prev[item.affiliate_mapping_id],
                                          bannerFile: file,
                                          bannerPreview: preview
                                        }
                                      }));
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="lg:w-[260px] flex flex-col justify-between gap-4 border-t lg:border-t-0 lg:border-l border-zinc-100 pt-4 lg:pt-0 lg:pl-6">
                            <div className="space-y-1">
                              <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Referral Redirect URL</span>
                              <div className="bg-zinc-50 border border-zinc-200 p-2 rounded-xl flex items-center justify-between gap-2 text-xs">
                                <span className="truncate text-zinc-600 font-medium font-mono text-[11px] max-w-[170px]">
                                  {getAffiliateRedirectUrl(item.affiliate_code)}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(getAffiliateRedirectUrl(item.affiliate_code), "SaaS Affiliate")}
                                  className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-900"
                                  title="Copy Affiliate Link"
                                >
                                  {copiedLink === getAffiliateRedirectUrl(item.affiliate_code) ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </Button>
                              </div>
                            </div>

                            {item.is_promoted && (
                              <Button
                                size="sm"
                                onClick={() => handleSaveSaaSDetails(item.affiliate_mapping_id)}
                                className="bg-orange-500 hover:bg-orange-600 text-white w-full text-xs font-semibold h-9 rounded-xl shadow-xs"
                              >
                                Save Custom Details
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </CreatorLayout>
  );
}
