import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Wallet, CreditCard, Building2, Copy, CheckCircle2, QrCode } from "lucide-react";
import { loadCashfreeScript } from "@/utils/cashfree";
import { createDepositOrder, getVirtualAccount, VirtualAccountResponse } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const AddFunds: React.FC = () => {
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [vaDetails, setVaDetails] = useState<VirtualAccountResponse | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch VA details on load
    fetchVirtualAccount();
  }, []);

  const fetchVirtualAccount = async () => {
    try {
      const data = await getVirtualAccount();
      setVaDetails(data);
    } catch (err) {
      console.error("Failed to load VA details", err);
    }
  };

  const handlePayment = async () => {
    const value = parseFloat(amount);
    if (!value || value < 1) {
      toast({ title: "Invalid Amount", description: "Minimum deposit is ₹1", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // A. Load SDK
      const isLoaded = await loadCashfreeScript();
      if (!isLoaded) throw new Error("Failed to load Cashfree SDK");

      const cashfree = new (window as any).Cashfree({ mode: "sandbox" }); // Change to "production" when live

      // B. Create Session
      const orderData = await createDepositOrder(value);

      // C. Redirect to Checkout
      cashfree.checkout({
        paymentSessionId: orderData.payment_session_id,
        returnUrl: `http://localhost:8080/brand/dashboard?order_id={order_id}`, // Ensure this matches your route
        redirectTarget: "_self" // Redirects current tab
      });

    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ description: "Copied to clipboard" });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* LEFT: Instant Payment Gateway */}
      <Card className="h-full bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Instant Deposit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500 font-semibold">₹</span>
            <Input 
              type="number" 
              placeholder="10000" 
              className="pl-8 font-medium text-lg"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 text-sm flex-wrap">
            {[5000, 20000, 50000].map((val) => (
              <button
                key={val}
                onClick={() => setAmount(val.toString())}
                className="px-3 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 rounded-full text-gray-600 transition-colors"
              >
                +₹{val.toLocaleString()}
              </button>
            ))}
          </div>

          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700" 
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? "Processing..." : "Pay Now"}
          </Button>
          <p className="text-xs text-gray-400 text-center">
            Secured by Cashfree Payments
          </p>
        </CardContent>
      </Card>

      {/* RIGHT: Auto Collect (Virtual Account) */}
      <Card className="h-full bg-gradient-to-br from-gray-50 to-white shadow-sm border-dashed border-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
            <Building2 className="w-5 h-5 text-green-600" />
            Large Transfer (NEFT/RTGS)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {vaDetails ? (
            <div className="space-y-3">
              <div className="bg-white p-3 rounded border">
                <p className="text-xs text-gray-500 mb-1">Beneficiary Account Number</p>
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-lg">{vaDetails.account_number}</span>
                  <Copy size={14} className="cursor-pointer text-gray-400 hover:text-black" onClick={() => copyToClipboard(vaDetails.account_number)} />
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="bg-white p-3 rounded border flex-1">
                  <p className="text-xs text-gray-500 mb-1">IFSC Code</p>
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-medium">{vaDetails.ifsc}</span>
                    <Copy size={14} className="cursor-pointer text-gray-400 hover:text-black" onClick={() => copyToClipboard(vaDetails.ifsc)} />
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-3 rounded border border-green-100 flex items-start gap-3">
                <QrCode className="text-green-700 mt-1" size={20} />
                <div>
                  <p className="text-xs font-bold text-green-800 mb-0.5">Or Pay via UPI</p>
                  <p className="text-sm font-mono text-green-700 break-all">{vaDetails.vpa_id}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                <CheckCircle2 size={12} className="text-green-600" />
                <span>Funds are auto-credited instantly.</span>
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-sm text-gray-400">
              Loading banking details...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AddFunds;