import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CreditCard, Copy, CheckCircle2, QrCode, ShieldCheck, Zap, Sparkles, ExternalLink } from "lucide-react";
import { createDepositOrder, getVirtualAccount, verifyDeposit, VirtualAccountResponse } from "@/lib/api";
import { openOnrampWidget } from "@/utils/payments/onramp";
import { useToast } from "@/hooks/use-toast";

const AddFunds: React.FC = () => {
  const [amount, setAmount] = useState<string>("10000");
  const [loading, setLoading] = useState(false);
  const [vaDetails, setVaDetails] = useState<VirtualAccountResponse | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    fetchVirtualAccount();
    const storedWallet = localStorage.getItem("wallet_address") || "";
    setWalletAddress(storedWallet);
  }, []);

  const fetchVirtualAccount = async () => {
    try {
      const data = await getVirtualAccount();
      setVaDetails(data);
      if (data?.account_number && data.account_number.startsWith("0x")) {
        setWalletAddress(data.account_number);
      }
    } catch (err) {
      console.error("Failed to load account details", err);
    }
  };

  const handleDeposit = async () => {
    const value = parseFloat(amount);
    if (!value || value < 100) {
      toast({
        title: "Minimum Deposit",
        description: "Minimum deposit is ₹100 for instant UPI settlement.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const orderData = await createDepositOrder(value);

      // Launch Onramp.money widget with Option B Zero-Fee model
      openOnrampWidget({
        appId: orderData?.params?.appId || import.meta.env.VITE_ONRAMP_APP_ID || "2695737",
        walletAddress: orderData?.destination_wallet || walletAddress || "0x0000000000000000000000000000000000000000",
        fiatAmount: value,
        fiatType: 1, // INR
        coinCode: orderData?.coin_code || "usdc",
        network: orderData?.network || "base",
        paymentMethod: 1, // UPI
        onSuccess: async (eventData: any) => {
          try {
            const verifyRes = await verifyDeposit({
              gateway: "onramp",
              order_id: eventData?.orderId || orderData?.order_id,
              amount: value,
            });
            toast({
              title: "Deposit Completed!",
              description: `₹${value.toLocaleString()} credited with ₹0 platform fee. New balance: ₹${verifyRes.new_balance?.toLocaleString()}`,
              className: "bg-emerald-50 border-emerald-200 text-emerald-900",
            });
            setTimeout(() => window.location.reload(), 1200);
          } catch (e: any) {
            toast({ title: "Settlement Notice", description: e.message || "Deposit is being confirmed in background." });
          }
        },
        onClose: () => {
          setLoading(false);
        },
      });

      // In sandbox / simulated dev, auto-verify for smooth testing
      if (orderData?.simulated || !import.meta.env.PROD) {
        setTimeout(async () => {
          try {
            const verifyRes = await verifyDeposit({
              gateway: "onramp",
              order_id: orderData.order_id,
              amount: value,
            });
            toast({
              title: "Sandbox Deposit Settled",
              description: `₹${value.toLocaleString()} credited to your campaign wallet balance.`,
              className: "bg-emerald-50 border-emerald-200 text-emerald-900",
            });
            setLoading(false);
            setTimeout(() => window.location.reload(), 1500);
          } catch {
            setLoading(false);
          }
        }, 3000);
      }
    } catch (err: any) {
      toast({ title: "Deposit Error", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ description: "Address copied to clipboard" });
  };

  const displayWallet = walletAddress || vaDetails?.account_number || "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* LEFT: Option B Zero-Fee UPI Onramp */}
      <Card className="h-full bg-white shadow-sm border border-zinc-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-zinc-900">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              Instant UPI Deposit (Zero Fee)
            </CardTitle>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> 0% Platform Fee
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-600">Enter Deposit Amount (INR)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-zinc-400 font-bold text-base">₹</span>
              <Input
                type="number"
                placeholder="10000"
                className="pl-8 font-semibold text-base tabular-nums"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 text-xs flex-wrap">
            {[5000, 10000, 25000, 50000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount(val.toString())}
                className="px-2.5 py-1 bg-zinc-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-zinc-700 font-medium transition-colors tabular-nums"
              >
                +₹{val.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Option B Zero-Fee Explanation Card */}
          <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-1 text-xs text-indigo-950">
            <div className="flex items-center gap-1.5 font-bold text-indigo-900">
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              <span>Option B: 100% Budget Guarantee</span>
            </div>
            <p className="text-[11px] text-indigo-800/90 leading-relaxed">
              Mipoe absorbs all onramp conversion fees. Your full deposit of <strong className="tabular-nums">₹{parseFloat(amount || "0").toLocaleString()}</strong> is credited directly to your campaign budget.
            </p>
          </div>

          <Button
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5"
            onClick={handleDeposit}
            disabled={loading}
          >
            {loading ? "Launching UPI Checkout..." : `Deposit ₹${parseFloat(amount || "0").toLocaleString()} via UPI`}
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Supported apps: GPay, PhonePe, Paytm, BHIM UPI</span>
          </div>
        </CardContent>
      </Card>

      {/* RIGHT: Direct Base L2 Smart Account */}
      <Card className="h-full bg-gradient-to-br from-zinc-50 to-white shadow-sm border border-zinc-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-zinc-900">
            <QrCode className="w-4 h-4 text-zinc-700" />
            Direct Base L2 USDC Deposit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="bg-white p-3.5 rounded-xl border border-zinc-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Your Non-Custodial Base Address
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
                  Base Network
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="font-mono text-xs font-semibold text-zinc-800 break-all select-all">
                  {displayWallet}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(displayWallet)}
                  className="p-1.5 hover:bg-zinc-100 rounded-md text-zinc-500 hover:text-zinc-900 transition-colors ml-2 flex-shrink-0"
                  title="Copy address"
                >
                  <Copy size={14} />
                </button>
              </div>
              {displayWallet && displayWallet.startsWith("0x") && (
                <div className="pt-1">
                  <a
                    href={`https://sepolia.basescan.org/address/${displayWallet}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    View on BaseScan Sepolia Explorer
                    <ExternalLink size={10} />
                  </a>
                </div>
              )}
            </div>

            <div className="p-3 bg-zinc-100/70 border border-zinc-200 rounded-xl space-y-1 text-xs text-zinc-700">
              <p className="font-semibold text-zinc-900">Direct Crypto Transfer Instructions:</p>
              <ul className="text-[11px] text-zinc-600 space-y-1 list-disc pl-4">
                <li>Send only <strong>USDC</strong> on the <strong>Base Network</strong>.</li>
                <li>Deposits settle on-chain in 2 seconds with sub-cent gas fees.</li>
                <li>Balance auto-credits to your INR dashboard at spot conversion.</li>
              </ul>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-500 pt-1">
              <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0" />
              <span>Secured by ERC-4337 Smart Account on Base.</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddFunds;