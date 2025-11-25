import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Plus, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import AddFunds from "../../pages/brand/AddFunds"; // Ensure path matches your folder structure
import { getWalletBalance } from "@/lib/api";

const WalletOverview = () => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchBalance = async () => {
    setLoading(true);
    try {
      const data = await getWalletBalance();
      setBalance(data.balance);
    } catch (error) {
      console.error("Failed to fetch wallet", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  return (
    <Card className="bg-gradient-to-r from-zinc-900 to-zinc-800 text-white border-none shadow-xl mb-8">
      <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Left: Balance Info */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm">
            <Wallet size={32} className="text-green-400" />
          </div>
          <div>
            <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Available Funds</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-bold">
                ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h2>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full"
                onClick={fetchBalance}
                disabled={loading}
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Add Funds Action */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-6 text-lg shadow-lg shadow-green-900/20 transition-all hover:scale-105">
              <Plus className="mr-2 h-5 w-5" /> Add Funds
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[900px] p-0 bg-transparent border-none shadow-none">
            <AddFunds onSuccess={(newBal) => setBalance(newBal)} />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default WalletOverview;