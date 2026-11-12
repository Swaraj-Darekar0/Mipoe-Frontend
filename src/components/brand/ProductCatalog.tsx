import React, { useEffect, useState } from "react";
import {
  getBrandProducts,
  createManualProduct,
  deleteProduct,
  triggerShopifySync,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog, StatusPill } from "@/components/ui/PortalPrimitives";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingBag,
  Plus,
  RefreshCw,
  Trash2,
  Image as ImageIcon,
  Link,
  Lock,
  Loader2,
} from "lucide-react";

interface ProductCatalogProps {
  integrationType: "shopify" | "custom" | "cashfree";
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  integrationType,
}) => {
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

  // Delete Confirm Dialog
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);
  const [deletingProduct, setDeletingProduct] = useState(false);

  const loadProducts = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getBrandProducts();
      setProducts(data);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to load products list",
        variant: "destructive",
      });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    toast({
      title: "Shopify Sync Initiated",
      description: "Background process started.",
    });
    try {
      await triggerShopifySync();
      // Poll to see if products loaded (simple timeout for user experience mock)
      setTimeout(() => {
        loadProducts(true);
        setSyncing(false);
        toast({
          title: "Sync Complete",
          description: "Product list updated.",
        });
      }, 3500);
    } catch (err: any) {
      toast({
        title: "Sync Failed",
        description: err.message,
        variant: "destructive",
      });
      setSyncing(false);
    }
  };

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim() || !newProductPrice.trim()) {
      toast({
        title: "Validation Error",
        description: "Product name and price are required",
        variant: "destructive",
      });
      return;
    }

    setSubmittingProduct(true);
    try {
      await createManualProduct({
        name: newProductName,
        description: newProductDesc,
        price: parseFloat(newProductPrice),
        product_url: newProductUrl || undefined,
        images: newProductImageUrl ? [newProductImageUrl] : [],
      });
      toast({
        title: "Product Added",
        description: "Successfully registered in your catalog.",
      });

      // Reset Form
      setNewProductName("");
      setNewProductDesc("");
      setNewProductPrice("");
      setNewProductUrl("");
      setNewProductImageUrl("");
      setShowAddModal(false);

      await loadProducts(true);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create product.",
        variant: "destructive",
      });
    } finally {
      setSubmittingProduct(false);
    }
  };

  const confirmDeleteProduct = async () => {
    if (deleteProductId === null) return;
    setDeletingProduct(true);
    try {
      await deleteProduct(deleteProductId);
      toast({
        title: "Product Deleted",
        description: "Removed from catalog.",
      });
      setProducts((prev) => prev.filter((p) => p.id !== deleteProductId));
      setDeleteProductId(null);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setDeletingProduct(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-white p-6 rounded-2xl border border-black/10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-ink tracking-tight">
            Product Catalog Management
          </h2>
          <p className="text-xs text-slate mt-1">
            {integrationType === "shopify"
              ? "Your products are synced from your Shopify store."
              : "Manage the list of products associated with your website integrations."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {integrationType === "shopify" && (
            <Button
              variant="outline"
              onClick={handleManualSync}
              disabled={syncing}
              className="gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}
              />
              {syncing ? "Syncing..." : "Sync store products"}
            </Button>
          )}
          <Button
            variant="brand"
            onClick={() => setShowAddModal(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add custom product
          </Button>
        </div>
      </div>

      {/* Grid list */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-black/10 text-slate">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-blue mb-2" />
          <p className="font-medium text-sm">
            Loading product catalog details...
          </p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-black/10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
          <ShoppingBag className="w-10 h-10 text-steel mx-auto mb-3" />
          <p className="font-display font-bold text-ink text-base">
            No products in your catalog
          </p>
          <p className="text-slate text-xs mt-1">
            {integrationType === "shopify"
              ? "Click 'Sync store products' to import products from Shopify."
              : "Click 'Add custom product' to register products manually."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-black/10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-square w-full bg-[#fafafb] flex items-center justify-center border-b border-black/10 overflow-hidden">
                  {p.images && p.images.length > 0 ? (
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-steel">
                      <ImageIcon className="w-10 h-10" />
                      <span className="font-mono text-[10px] mt-1 font-medium uppercase tracking-wider">
                        No Image
                      </span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <StatusPill
                      tone={p.sync_source === "shopify" ? "success" : "brand"}
                    >
                      {p.sync_source}
                    </StatusPill>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-display font-bold text-ink text-sm line-clamp-1">
                    {p.name}
                  </h3>
                  <p className="text-xs text-slate line-clamp-2 min-h-[2rem] leading-relaxed">
                    {p.description || "No description provided."}
                  </p>
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-mono font-bold tabular-nums text-base text-ink">
                      ₹{p.price.toLocaleString()}
                    </span>
                    {p.variants && p.variants.length > 0 && (
                      <span className="font-mono text-[10px] text-steel font-medium">
                        {p.variants.length} variant(s)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-black/10 bg-[#fafafb] flex justify-between items-center gap-2">
                {p.product_url ? (
                  <a
                    href={p.product_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] font-semibold text-brand-blue hover:underline"
                  >
                    <Link className="w-3.5 h-3.5" />
                    Store link
                  </a>
                ) : (
                  <span className="font-mono text-[10px] text-steel">
                    No URL
                  </span>
                )}

                {p.sync_source === "shopify" ? (
                  <span
                    className="font-mono text-steel text-[10px] flex items-center gap-1 cursor-help"
                    title="Shopify products cannot be deleted manually from sellr. Remove them inside Shopify and click Sync."
                  >
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                ) : (
                  <button
                    type="button"
                    aria-label="Delete product"
                    onClick={() => setDeleteProductId(p.id)}
                    className="text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors duration-150"
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
      <Dialog
        open={showAddModal}
        onOpenChange={(open) => {
          if (!open && !submittingProduct) setShowAddModal(false);
        }}
      >
        <DialogContent className="max-w-md bg-white border border-black/10 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold text-ink flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand-blue" />
              Add Product to Catalog
            </DialogTitle>
            <DialogDescription className="text-xs text-slate">
              Register a manual product URL and price to associate with affiliate campaigns.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddProductSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block font-mono text-[10px] font-medium text-steel uppercase tracking-wider">
                Product Name
              </label>
              <Input
                type="text"
                placeholder="e.g. HydroGlow Serum"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block font-mono text-[10px] font-medium text-steel uppercase tracking-wider">
                Description
              </label>
              <Input
                type="text"
                placeholder="Summarize product parameters..."
                value={newProductDesc}
                onChange={(e) => setNewProductDesc(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="block font-mono text-[10px] font-medium text-steel uppercase tracking-wider">
                Price (INR)
              </label>
              <Input
                type="number"
                placeholder="e.g. 1499"
                value={newProductPrice}
                onChange={(e) => setNewProductPrice(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block font-mono text-[10px] font-medium text-steel uppercase tracking-wider">
                Product Store URL
              </label>
              <Input
                type="url"
                placeholder="https://yourbrand.com/products/hydroglow"
                value={newProductUrl}
                onChange={(e) => setNewProductUrl(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="block font-mono text-[10px] font-medium text-steel uppercase tracking-wider">
                Image URL
              </label>
              <Input
                type="url"
                placeholder="https://yourbrand.com/images/hydroglow.jpg"
                value={newProductImageUrl}
                onChange={(e) => setNewProductImageUrl(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-3 gap-2">
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
                variant="brand"
                disabled={submittingProduct}
              >
                {submittingProduct ? "Saving..." : "Add Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteProductId !== null}
        onOpenChange={(open) => {
          if (!open && !deletingProduct) setDeleteProductId(null);
        }}
        title="Delete Product"
        description="Are you sure you want to delete this product from the platform catalog?"
        confirmLabel="Delete Product"
        variant="destructive"
        loading={deletingProduct}
        onConfirm={confirmDeleteProduct}
      />
    </div>
  );
};
