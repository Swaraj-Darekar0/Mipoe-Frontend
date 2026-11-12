import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/PortalPrimitives";
import { CreditCard, Copy, CheckCircle2, QrCode, ShieldCheck, Zap, ExternalLink, Loader2 } from "lucide-react";
import { createDepositOrder, getVirtualAccount, verifyDeposit, VirtualAccountResponse } from "@/lib/api";
import { openOnrampWidget } from "@/utils/payments/onramp";
import { useToast } from "@/hooks/use-toast";

export interface AddFundsProps {
  onSuccess?: (newBalance?: number) => void;
}

const AddFunds: React.FC<AddFundsProps> = ({ onSuccess }) => {
  const [amount, setAmount] = useState<string>("10000");
  const [loading, setLoading] = useState(false);
  const [vaDetails, setVaDetails] = useState<VirtualAccountResponse | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const settledOrderRef = useRef<string | null>(null);
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
        sandbox: orderData?.is_sandbox ?? (orderData?.params?.sandbox ?? (!import.meta.env.PROD || import.meta.env.VITE_ONRAMP_ENV !== "production")),
        widgetUrl: orderData?.widget_url,
        onSuccess: async (eventData: any) => {
          try {
            const orderId = eventData?.orderId || orderData?.order_id;
            if (settledOrderRef.current === orderId) return;
            settledOrderRef.current = orderId;

            const verifyRes = await verifyDeposit({
              gateway: "onramp",
              order_id: orderId,
              amount: value,
            });
            toast({
              title: "Deposit Completed!",
              description: `₹${value.toLocaleString("en-IN")} credited with ₹0 platform fee. New balance: ₹${verifyRes.new_balance?.toLocaleString("en-IN")}`,
              className: "bg-emerald-50 border-emerald-500/25 text-emerald-900",
            });
            setLoading(false);
            onSuccess?.(verifyRes.new_balance);
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
          if (settledOrderRef.current === orderData.order_id) {
            setLoading(false);
            return;
          }
          try {
            settledOrderRef.current = orderData.order_id;
            const verifyRes = await verifyDeposit({
              gateway: "onramp",
              order_id: orderData.order_id,
              amount: value,
            });
            toast({
              title: "Sandbox Deposit Settled",
              description: `₹${value.toLocaleString("en-IN")} credited to your campaign wallet balance.`,
              className: "bg-emerald-50 border-emerald-500/25 text-emerald-900",
            });
            setLoading(false);
            onSuccess?.(verifyRes.new_balance);
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
  const parsedAmount = parseFloat(amount || "0");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
      {/* LEFT: Option B Zero-Fee UPI Onramp */}
      <Card className="h-full min-w-0 bg-white border border-black/10 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-black/[0.06]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-steel mb-1">
                01 // INSTANT INR RAIL
              </p>
              <CardTitle className="font-display text-base sm:text-lg font-bold tracking-tight flex items-center gap-2 text-ink">
                <CreditCard className="w-4 h-4 text-brand-blue shrink-0" />
                <span>Instant UPI Deposit</span>
              </CardTitle>
            </div>
            <StatusPill tone="success">0% Platform Fee</StatusPill>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="add-funds-amount"
              className="block font-mono text-[10px] font-bold uppercase tracking-wider text-slate"
            >
              Enter Deposit Amount (INR)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-steel text-base">
                ₹
              </span>
              <Input
                id="add-funds-amount"
                type="number"
                placeholder="10000"
                className="pl-8 font-mono font-bold text-base tabular-nums text-ink border-black/15 focus-visible:border-brand-blue"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {[5000, 10000, 25000, 50000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount(val.toString())}
                className={`px-2.5 py-1.5 rounded-lg border font-mono text-xs font-bold tabular-nums transition-colors duration-150 ${
                  amount === val.toString()
                    ? "bg-brand-blue/10 border-brand-blue/40 text-brand-blue"
                    : "bg-black/[0.03] border-black/[0.08] text-charcoal hover:border-brand-blue/35 hover:text-brand-blue"
                }`}
              >
                +₹{val.toLocaleString("en-IN")}
              </button>
            ))}
          </div>

          {/* Option B Zero-Fee Explanation Well */}
          <div className="p-3.5 rounded-xl bg-brand-blue/[0.05] border border-brand-blue/20 space-y-1">
            <div className="flex items-center gap-1.5 font-display text-xs font-bold text-ink">
              <Zap className="w-3.5 h-3.5 text-brand-blue shrink-0" />
              <span>Option B: 100% Budget Guarantee</span>
            </div>
            <p className="text-xs text-slate leading-relaxed">
              Platform absorbs all onramp conversion fees. Your full deposit of{" "}
              <strong className="font-mono tabular-nums text-ink">
                ₹{Number.isFinite(parsedAmount) ? parsedAmount.toLocaleString("en-IN") : "0"}
              </strong>{" "}
              is credited directly to your campaign vault.
            </p>
          </div>

          <Button
            variant="brand"
            className="w-full h-11 font-semibold"
            onClick={handleDeposit}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Launching UPI Checkout...</span>
              </>
            ) : (
              <span className="font-mono tabular-nums">
                Deposit ₹{Number.isFinite(parsedAmount) ? parsedAmount.toLocaleString("en-IN") : "0"} via UPI
              </span>
            )}
          </Button>

          <div className="flex items-center justify-center gap-1.5 font-mono text-[10px] text-steel text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>Supported rails: GPay, PhonePe, Paytm, BHIM UPI</span>
          </div>
        </CardContent>
      </Card>

      {/* RIGHT: Direct Base L2 Smart Account */}
      <Card className="h-full min-w-0 bg-white border border-black/10 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-black/[0.06]">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-steel mb-1">
              02 // ON-CHAIN USDC RAIL
            </p>
            <CardTitle className="font-display text-base sm:text-lg font-bold tracking-tight flex items-center gap-2 text-ink">
              <QrCode className="w-4 h-4 text-ink shrink-0" />
              <span>Direct Base L2 USDC Deposit</span>
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="rounded-xl bg-black/[0.03] border border-black/[0.08] p-3.5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-steel">
                Non-Custodial Base Address
              </span>
              <StatusPill tone="brand">Base Network</StatusPill>
            </div>
            <div className="flex justify-between items-center gap-2 pt-0.5">
              <span className="font-mono text-xs font-bold text-ink break-all select-all min-w-0">
                {displayWallet}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(displayWallet)}
                className="p-1.5 rounded-lg border border-black/10 bg-white hover:bg-black/[0.04] text-charcoal hover:text-ink transition-colors duration-150 shrink-0"
                title="Copy address"
                aria-label="Copy Base address"
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
                  className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-brand-blue hover:underline"
                >
                  View on BaseScan Sepolia Explorer
                  <ExternalLink size={11} />
                </a>
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-black/[0.03] border border-black/[0.06] space-y-1.5">
            <p className="font-display text-xs font-bold text-ink">
              Direct Crypto Transfer Instructions
            </p>
            <ul className="text-xs text-slate space-y-1 list-disc pl-4 leading-relaxed">
              <li>
                Send only <strong className="text-ink">USDC</strong> on the{" "}
                <strong className="text-ink">Base Network</strong>.
              </li>
              <li>Deposits settle on-chain in 2 seconds with sub-cent gas fees.</li>
              <li>Balance auto-credits to your INR dashboard at spot conversion.</li>
            </ul>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-slate pt-1">
            <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
            <span>Secured by ERC-4337 Smart Account on Base.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddFunds;