import React, { useEffect, useState } from "react";
import { getBrandProducts, createManualProduct, deleteProduct, triggerShopifySync } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  ShoppingBag, 
  Plus, 
  RefreshCw, 
  Trash2, 
  Image as ImageIcon, 
  Link, 
  Lock, 
  HelpCircle,
  Clock,
  Sparkles
} from "lucide-react";

interface ProductCatalogProps {
  integrationType: "shopify" | "custom" | "cashfree";
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({ integrationType }) => {
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Manual Add Product Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductDesc, setNewProductDesc] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductUrl, setNewProductUrl] = useState("");
  const [newProductImageUrl, setNewProductImageUrl] = useState("");

  const loadProducts = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getBrandProducts();
      setProducts(data);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to load products list", variant: "destructive" });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    toast({ title: "Shopify Sync Initiated", description: "Background process started." });
    try {
      await triggerShopifySync();
      // Poll to see if products loaded (simple timeout for user experience mock)
      setTimeout(() => {
        loadProducts(true);
        setSyncing(false);
        toast({ title: "Sync Complete", description: "Product list updated." });
      }, 3500);
    } catch (err: any) {
      toast({ title: "Sync Failed", description: err.message, variant: "destructive" });
      setSyncing(false);
    }
  };

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim() || !newProductPrice.trim()) {
      toast({ title: "Validation Error", description: "Product name and price are required", variant: "destructive" });
      return;
    }

    setSubmittingProduct(true);
    try {
      await createManualProduct({
        name: newProductName,
        description: newProductDesc,
        price: parseFloat(newProductPrice),
        product_url: newProductUrl || undefined,
        images: newProductImageUrl ? [newProductImageUrl] : []
      });
      toast({ title: "Product Added", description: "Successfully registered in your catalog." });
      
      // Reset Form
      setNewProductName("");
      setNewProductDesc("");
      setNewProductPrice("");
      setNewProductUrl("");
      setNewProductImageUrl("");
      setShowAddModal(false);
      
      await loadProducts(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to create product.", variant: "destructive" });
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this product from the platform catalog?")) return;
    try {
      await deleteProduct(id);
      toast({ title: "Product Deleted", description: "Removed from catalog." });
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Product Catalog Management</h2>
          <p className="text-xs text-gray-500 mt-1">
            {integrationType === "shopify" 
              ? "Your products are synced from your Shopify store." 
              : "Manage the list of products associated with your website integrations."}
          </p>
        </div>
        
        <div className="flex gap-2">
          {integrationType === "shopify" && (
            <Button 
              onClick={handleManualSync} 
              disabled={syncing}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync store products"}
            </Button>
          )}
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add custom product
          </Button>
        </div>
      </div>

      {/* Grid list */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-150 text-gray-400">
          <Clock className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
          <p className="font-semibold text-sm">Loading product catalog details...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-150">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-bold text-gray-700 text-base">No products in your catalog</p>
          <p className="text-gray-400 text-xs mt-1">
            {integrationType === "shopify" 
              ? "Click 'Sync store products' to import products from Shopify." 
              : "Click 'Add custom product' to register products manually."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition duration-150">
              <div>
                <div className="relative aspect-square w-full bg-gray-50 flex items-center justify-center border-b border-gray-100 overflow-hidden">
                  {p.images && p.images.length > 0 ? (
                    <img 
                      src={p.images[0]} 
                      alt={p.name} 
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-300">
                      <ImageIcon className="w-10 h-10" />
                      <span className="text-[10px] mt-1 font-semibold">No Image</span>
                    </div>
                  )}
                  <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    p.sync_source === "shopify" 
                      ? "bg-green-100 border border-green-200 text-green-700" 
                      : "bg-blue-100 border border-blue-200 text-blue-700"
                  }`}>
                    {p.sync_source}
                  </span>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{p.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 min-h-[2rem] leading-relaxed">
                    {p.description || "No description provided."}
                  </p>
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-extrabold text-base text-gray-800">₹{p.price.toLocaleString()}</span>
                    {p.variants && p.variants.length > 0 && (
                      <span className="text-[10px] text-gray-400 font-semibold">{p.variants.length} variant(s)</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between gap-2">
                {p.product_url ? (
                  <a 
                    href={p.product_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] font-semibold text-indigo-650 hover:underline"
                  >
                    <Link className="w-3.5 h-3.5" />
                    Store link
                  </a>
                ) : (
                  <span className="text-[10px] text-gray-400">No URL</span>
                )}

                {p.sync_source === "shopify" ? (
                  <span 
                    className="text-gray-400 text-[10px] flex items-center gap-1 cursor-help"
                    title="Shopify products cannot be deleted manually from Mipoe. Remove them inside Shopify and click Sync."
                  >
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                ) : (
                  <button 
                    onClick={() => handleDeleteProduct(p.id)}
                    className="text-red-500 hover:text-red-650 p-1 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual Product Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Add Product to Catalog
            </h3>
            
            <form onSubmit={handleAddProductSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Product Name</label>
                <Input
                  type="text"
                  placeholder="e.g. HydroGlow Serum"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Description</label>
                <Input
                  type="text"
                  placeholder="Summarize product parameters..."
                  value={newProductDesc}
                  onChange={(e) => setNewProductDesc(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Price (INR)</label>
                <Input
                  type="number"
                  placeholder="e.g. 1499"
                  value={newProductPrice}
                  onChange={(e) => setNewProductPrice(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Product Store URL</label>
                <Input
                  type="url"
                  placeholder="https://yourbrand.com/products/hydroglow"
                  value={newProductUrl}
                  onChange={(e) => setNewProductUrl(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Image URL</label>
                <Input
                  type="url"
                  placeholder="https://yourbrand.com/images/hydroglow.jpg"
                  value={newProductImageUrl}
                  onChange={(e) => setNewProductImageUrl(e.target.value)}
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  disabled={submittingProduct}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={submittingProduct}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  {submittingProduct ? "Saving..." : "Add Product"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
