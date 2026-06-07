import React, { useState } from "react";
import { connectShopify, connectCustom, connectCashfreeAffiliate } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Globe, 
  ShoppingBag, 
  Key, 
  Link2, 
  CheckCircle, 
  ShieldAlert, 
  ClipboardCopy, 
  Layers,
  ArrowRight,
  Database
} from "lucide-react";

interface AffiliateOnboardingProps {
  businessCategory: string; // 'Product Based' | 'SaaS Based'
  onOnboardingCompleted: () => void;
}

export const AffiliateOnboarding: React.FC<AffiliateOnboardingProps> = ({ 
  businessCategory, 
  onOnboardingCompleted 
}) => {
  const { toast } = useToast();
  const [activeMethod, setActiveMethod] = useState<"shopify" | "custom" | null>(
    businessCategory === "Product Based" ? "custom" : null
  );

  // Shopify States
  const [shopName, setShopName] = useState("");
  const [connectingShopify, setConnectingShopify] = useState(false);

  // Custom Integration States
  const [customCredentials, setCustomCredentials] = useState<{
    api_key: string;
    webhook_url: string;
    webhook_secret: string;
  } | null>(null);
  const [activatingCustom, setActivatingCustom] = useState(false);

  // Cashfree SaaS States
  const [cashfreeAppId, setCashfreeAppId] = useState("");
  const [cashfreeSecret, setCashfreeSecret] = useState("");
  const [connectingCashfree, setConnectingCashfree] = useState(false);
  const [cashfreeWebhook, setCashfreeWebhook] = useState<{
    webhook_url: string;
    webhook_secret: string;
  } | null>(null);

  const handleShopifyConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      toast({ title: "Validation Error", description: "Shop URL is required", variant: "destructive" });
      return;
    }

    setConnectingShopify(true);
    try {
      const res = await connectShopify(shopName);
      // Redirect to Shopify OAuth authorize page
      window.location.href = res.url;
    } catch (err: any) {
      toast({ 
        title: "Connection Failed", 
        description: err.message || "Failed to initiate Shopify connection.", 
        variant: "destructive" 
      });
    } finally {
      setConnectingShopify(false);
    }
  };

  const handleCustomConnect = async () => {
    setActivatingCustom(true);
    try {
      const res = await connectCustom();
      setCustomCredentials({
        api_key: res.api_key,
        webhook_url: res.webhook_url,
        webhook_secret: res.webhook_secret
      });
      toast({ title: "API Activated", description: "Your custom API key has been generated." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActivatingCustom(false);
    }
  };

  const handleCashfreeConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashfreeAppId.trim() || !cashfreeSecret.trim()) {
      toast({ title: "Validation Error", description: "Both Cashfree App ID and Secret Key are required.", variant: "destructive" });
      return;
    }

    setConnectingCashfree(true);
    try {
      const res = await connectCashfreeAffiliate(cashfreeAppId, cashfreeSecret);
      setCashfreeWebhook({
        webhook_url: res.webhook_url,
        webhook_secret: res.webhook_secret
      });
      toast({ title: "Cashfree Integrated", description: "Credentials saved and webhook active." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setConnectingCashfree(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard.` });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Affiliate Program Onboarding</h2>
        <p className="mt-2 text-gray-600">
          Configure tracking for your {businessCategory === "Product Based" ? "e-commerce catalog" : "subscription software plans"}.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-150 p-6 md:p-8">
        
        {/* CATEGORY 1: E-commerce Product Brands */}
        {businessCategory === "Product Based" && (
          <div className="space-y-6">
            <div className="flex justify-center gap-4 mb-6 border-b border-gray-150 pb-4">
              <button
                type="button"
                onClick={() => setActiveMethod("shopify")}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  activeMethod === "shopify" 
                    ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-200" 
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                Option 1: Shopify OAuth
              </button>
              <button
                type="button"
                onClick={() => setActiveMethod("custom")}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  activeMethod === "custom" 
                    ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-200" 
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                Option 2: Custom Webhook API
              </button>
            </div>

            {activeMethod === "shopify" && (
              <form onSubmit={handleShopifyConnect} className="space-y-6">
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex gap-3 text-indigo-900 text-sm">
                  <ShoppingBag className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-800">Shopify Integration Method</p>
                    <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                      Connect your store using official OAuth permissions. We automatically synchronize pricing, images, variants, stock, and track discount conversion events.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Shopify Store Domain</label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="e.g. my-awesome-brand"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="text-base"
                    />
                    <span className="inline-flex items-center px-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 text-sm font-mono font-medium">
                      .myshopify.com
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400">Please input your brand name or full myshopify domain.</p>
                </div>

                <div className="flex justify-end pt-2">
                  <Button 
                    type="submit" 
                    disabled={connectingShopify}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2"
                  >
                    {connectingShopify ? "Initiating redirect..." : "Connect Shopify Store"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            )}

            {activeMethod === "custom" && (
              <div className="space-y-6">
                {!customCredentials ? (
                  <div className="text-center py-6">
                    <Globe className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <h3 className="font-bold text-gray-800 text-base">Custom Headless CMS Developer Setup</h3>
                    <p className="text-gray-500 text-xs mt-1 max-w-md mx-auto leading-relaxed">
                      Generate a private API key and tracking webhook endpoint. Your developers will push purchase events directly to Clipper system.
                    </p>
                    <Button 
                      onClick={handleCustomConnect} 
                      disabled={activatingCustom}
                      className="bg-indigo-600 hover:bg-indigo-700 mt-5 font-semibold"
                    >
                      {activatingCustom ? "Activating..." : "Generate Webhook Key"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3 text-green-800 text-sm">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-green-950">Custom Webhook Integration Ready!</p>
                        <p className="text-green-700 text-xs mt-0.5">Please share these keys securely with your website developers.</p>
                      </div>
                    </div>

                    <div className="space-y-4 bg-gray-50 border border-gray-150 rounded-xl p-5 font-medium text-xs text-gray-700">
                      <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Private API Key</span>
                        <div className="flex gap-2">
                          <code className="bg-white border border-gray-200 p-2.5 rounded-lg flex-1 text-gray-600 font-mono break-all">{customCredentials.api_key}</code>
                          <Button size="sm" variant="outline" className="h-10" onClick={() => copyToClipboard(customCredentials.api_key, "API Key")}>
                            <ClipboardCopy className="w-4 h-4 text-gray-500" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Webhook Endpoint URL</span>
                        <div className="flex gap-2">
                          <code className="bg-white border border-gray-200 p-2.5 rounded-lg flex-1 text-gray-600 font-mono break-all">{customCredentials.webhook_url}</code>
                          <Button size="sm" variant="outline" className="h-10" onClick={() => copyToClipboard(customCredentials.webhook_url, "Webhook URL")}>
                            <ClipboardCopy className="w-4 h-4 text-gray-500" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Webhook Signing Secret</span>
                        <div className="flex gap-2">
                          <code className="bg-white border border-gray-200 p-2.5 rounded-lg flex-1 text-gray-600 font-mono break-all">{customCredentials.webhook_secret}</code>
                          <Button size="sm" variant="outline" className="h-10" onClick={() => copyToClipboard(customCredentials.webhook_secret, "Webhook Secret")}>
                            <ClipboardCopy className="w-4 h-4 text-gray-500" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-150 rounded-xl p-4 bg-slate-900 text-slate-100 font-mono text-[10px] leading-relaxed">
                      <span className="text-slate-400 block mb-1"># Developer Integration Payload Sample</span>
                      <pre className="overflow-x-auto whitespace-pre">{`POST ${customCredentials.webhook_url}\nHeaders:\n  Authorization: Bearer ${customCredentials.api_key.substring(0, 10)}...\n\nBody:\n{\n  "order_id": "ORD-993882",\n  "order_amount": 1850.00,\n  "currency": "INR",\n  "affiliate_reference": "ref_creator_username",\n  "product_id": "prod_123",\n  "product_name": "Premium Cotton Shirt"\n}`}</pre>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button onClick={onOnboardingCompleted} className="bg-green-650 hover:bg-green-700 text-white font-semibold">
                        Go to Catalog Workspace
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* CATEGORY 2: SaaS Subscription Brands */}
        {businessCategory === "SaaS Based" && (
          <div className="space-y-6">
            {!cashfreeWebhook ? (
              <form onSubmit={handleCashfreeConnect} className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-900 text-sm">
                  <Database className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-800">Cashfree Subscriptions Setup</p>
                    <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                      Integrate with Cashfree payment gateway to track client subscription cycles. Automatically processes commissions on creation, upgrades, and monthly recurring renewals.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Cashfree App ID</label>
                    <Input
                      type="text"
                      placeholder="e.g. CF1234567..."
                      value={cashfreeAppId}
                      onChange={(e) => setCashfreeAppId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Cashfree Client Secret Key</label>
                    <Input
                      type="password"
                      placeholder="Enter Client Secret"
                      value={cashfreeSecret}
                      onChange={(e) => setCashfreeSecret(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button 
                    type="submit" 
                    disabled={connectingCashfree}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                  >
                    {connectingCashfree ? "Connecting Gateway..." : "Integrate Cashfree Subscriptions"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3 text-green-800 text-sm">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-green-950">Cashfree Gateway Mapped!</p>
                    <p className="text-green-700 text-xs mt-0.5">Please add the webhook URL below inside your Cashfree dashboard.</p>
                  </div>
                </div>

                <div className="space-y-4 bg-gray-50 border border-gray-150 rounded-xl p-5 font-medium text-xs text-gray-700">
                  <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Cashfree Webhook URL</span>
                    <div className="flex gap-2">
                      <code className="bg-white border border-gray-200 p-2.5 rounded-lg flex-1 text-gray-600 font-mono break-all">{cashfreeWebhook.webhook_url}</code>
                      <Button size="sm" variant="outline" className="h-10" onClick={() => copyToClipboard(cashfreeWebhook.webhook_url, "Webhook URL")}>
                        <ClipboardCopy className="w-4 h-4 text-gray-500" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Webhook Security Secret</span>
                    <div className="flex gap-2">
                      <code className="bg-white border border-gray-200 p-2.5 rounded-lg flex-1 text-gray-600 font-mono break-all">{cashfreeWebhook.webhook_secret}</code>
                      <Button size="sm" variant="outline" className="h-10" onClick={() => copyToClipboard(cashfreeWebhook.webhook_secret, "Security Secret")}>
                        <ClipboardCopy className="w-4 h-4 text-gray-500" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 flex gap-3 text-xs leading-relaxed">
                  <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Required Webhook Events</p>
                    <p className="text-amber-700 mt-1">
                      Configure your Cashfree Webhook endpoint to trigger for these event subscriptions:
                    </p>
                    <ul className="list-disc pl-5 mt-1.5 space-y-1 font-semibold text-amber-900">
                      <li>`SUBSCRIPTION_CREATED`</li>
                      <li>`SUBSCRIPTION_RENEWED`</li>
                      <li>`SUBSCRIPTION_CANCELLED`</li>
                    </ul>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={onOnboardingCompleted} className="bg-green-650 hover:bg-green-700 text-white font-semibold">
                    Go to Campaigns Workspace
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
