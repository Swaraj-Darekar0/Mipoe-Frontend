import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  getWalletBalance,
  getPayoutDetails,
  verifyPayoutDetails,
  savePayoutDetails,
  getWithdrawalHistory,
  creatorWithdraw,
  revertFailedWithdrawal
} from '@/lib/api';
import { Loader2, Wallet, Send, Edit2, CheckCircle2, AlertCircle, RotateCcw, RefreshCw } from 'lucide-react';

import {
  CreditCard,
  CreditCardFlipper,
  CreditCardFront,
  CreditCardBack,
  CreditCardChip,
  CreditCardName,
} from '@/components/creator/creditCard';

import CreatorLayout from '@/layouts/CreatorLayout';

interface PayoutDetailsState {
  payout_method: 'upi' | 'bank' | null;
  upi_id?: string;
  bank_account?: string;
  ifsc?: string;
  account_holder_name?: string;
}

interface WithdrawalRecord {
  id: number;
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'reverted';
  payout_method: 'upi' | 'bank';
  reference_id?: string;
  utr?: string;
  created_at: string;
  type: string;
}

export default function CreatorWallet() {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // State management
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [payoutDetails, setPayoutDetails] = useState<PayoutDetailsState>({ payout_method: null });
  const [editingPayoutDetails, setEditingPayoutDetails] = useState(false);
  const [verifiedPayoutDetails, setVerifiedPayoutDetails] = useState(false);
  const [creatorDisplayName, setCreatorDisplayName] = useState('Creator');
  
  // Payout details form state
  const [payoutMethod, setPayoutMethod] = useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  
  // Withdrawal state
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [showWithdrawalConfirm, setShowWithdrawalConfirm] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalRecord[]>([]);
  const [revertingId, setRevertingId] = useState<number | null>(null);
  const [refreshingHistory, setRefreshingHistory] = useState(false);
  
  const loadWalletData = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setLoading(true);
      else setRefreshingHistory(true);
      
      const [balanceRes, payoutRes, historyRes] = await Promise.all([
        getWalletBalance(),
        getPayoutDetails(),
        getWithdrawalHistory(undefined, 10)
      ]);
      
      setWalletBalance(balanceRes.balance);

      // Only update state if data has actually changed to prevent unnecessary re-renders
      if (JSON.stringify(payoutRes) !== JSON.stringify(payoutDetails)) {
        setPayoutDetails(payoutRes);
      }
      if (JSON.stringify(historyRes.withdrawals) !== JSON.stringify(withdrawalHistory)) {
        setWithdrawalHistory(historyRes.withdrawals);
      }

      // Handle verification and edit mode based on the new payout details
      if (payoutRes.payout_method) {
        try {
          const verifyRes = await verifyPayoutDetails();
          setVerifiedPayoutDetails(verifyRes.verified);
        } catch (err) {
          setVerifiedPayoutDetails(false);
        }
      } else {
        if (isInitialLoad) {
          setEditingPayoutDetails(true);
        }
      }
      
    } catch (error: any) {
      if (isInitialLoad) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to load wallet data',
          variant: 'destructive'
        });
      } else {
        console.error("Polling Error in Wallet:", error);
      }
    } finally {
      if (isInitialLoad) setLoading(false);
      else setRefreshingHistory(false);
    }
  };

  // Initial load effect
  useEffect(() => {
    loadWalletData(true);
  }, []);

  // Polling effect for pending withdrawals
  useEffect(() => {
    const hasPending = withdrawalHistory.some(w => w.status === 'pending');
    if (hasPending) {
      const intervalId = setInterval(() => {
        console.log("Polling for withdrawal status updates in Wallet...");
        loadWalletData(false); // Pass false for background refresh
      }, 15000); // Poll every 15 seconds
      return () => clearInterval(intervalId); // Cleanup on unmount or when data changes
    }
  }, [withdrawalHistory]); // Dependency on withdrawalHistory to re-evaluate polling

  useEffect(() => {
    if (payoutDetails.account_holder_name) {
      setCreatorDisplayName(payoutDetails.account_holder_name);
      return;
    }
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('creator_name');
      if (storedName) {
        setCreatorDisplayName(storedName);
      }
    }
  }, [payoutDetails.account_holder_name]);

  const maskAccountNumber = (account?: string | null) => {
    if (!account) return 'Account not added';
    const visible = account.slice(-4);
    return `${'•'.repeat(Math.max(account.length - 4, 4))}${visible}`;
  };

  const payoutMethodLabel = payoutDetails.payout_method === 'upi'
    ? 'UPI'
    : payoutDetails.payout_method === 'bank'
      ? 'Net B.'
      : 'Add Method';
  
  const handleSavePayoutDetails = async () => {
    try {
      // Validation
      if (payoutMethod === 'upi') {
        if (!upiId || !upiId.includes('@')) {
          toast({
            title: 'Invalid UPI',
            description: 'Please enter a valid UPI ID (e.g., user@okhdfcbank)',
            variant: 'destructive'
          });
          return;
        }
      } else {
        if (!bankAccount || bankAccount.length < 9) {
          toast({
            title: 'Invalid Account',
            description: 'Bank account number must be at least 9 digits',
            variant: 'destructive'
          });
          return;
        }
        if (!ifsc || ifsc.length !== 11) {
          toast({
            title: 'Invalid IFSC',
            description: 'IFSC code must be 11 characters',
            variant: 'destructive'
          });
          return;
        }
        if (!accountHolderName) {
          toast({
            title: 'Missing Name',
            description: 'Please enter account holder name',
            variant: 'destructive'
          });
          return;
        }
      }
      
      setWithdrawalLoading(true);
      
      const response = await savePayoutDetails(payoutMethod, {
        upi_id: payoutMethod === 'upi' ? upiId : undefined,
        bank_account: payoutMethod === 'bank' ? bankAccount : undefined,
        ifsc: payoutMethod === 'bank' ? ifsc : undefined,
        account_holder_name: payoutMethod === 'bank' ? accountHolderName : undefined
      });
      
      setPayoutDetails(response);
      setEditingPayoutDetails(false);
      setVerifiedPayoutDetails(true);
      
      toast({
        title: 'Success',
        description: `${payoutMethod.toUpperCase()} details saved successfully`,
      });
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save payout details',
        variant: 'destructive'
      });
    } finally {
      setWithdrawalLoading(false);
    }
  };

  const handleRevertWithdrawal = async (transactionId: number) => {
    if (!window.confirm('Are you sure you want to revert this failed transaction? The amount will be credited back to your wallet.')) {
      return;
    }
    try {
      setRevertingId(transactionId);
      const response = await revertFailedWithdrawal(transactionId);
      await loadWalletData(true); // Refresh wallet data
      toast({
        title: 'Success',
        description: `Failed withdrawal reverted successfully. Your new balance is ₹${response.new_balance.toFixed(2)}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to revert transaction.',
        variant: 'destructive',
      });
    } finally {
      setRevertingId(null);
    }
  };

  const handleWithdrawAmount = async () => {
    try {
      // Validation
      const amount = parseFloat(withdrawalAmount);
      if (!amount || amount <= 0) {
        toast({
          title: 'Invalid Amount',
          description: 'Please enter a valid amount',
          variant: 'destructive'
        });
        return;
      }
      
      if (amount > walletBalance) {
        toast({
          title: 'Insufficient Balance',
          description: `You only have ₹${walletBalance.toFixed(2)} available`,
          variant: 'destructive'
        });
        return;
      }
      
      if (!verifiedPayoutDetails) {
        toast({
          title: 'Incomplete Payout Details',
          description: 'Please verify your payout details before withdrawing',
          variant: 'destructive'
        });
        return;
      }
      
      setWithdrawalLoading(true);

      if (!payoutDetails.payout_method) {
        toast({
          title: 'Error',
          description: 'No payout method configured.',
          variant: 'destructive',
        });
        setWithdrawalLoading(false);
        return;
      }
      
      const response = await creatorWithdraw(
        amount,
        payoutDetails.payout_method,
        payoutDetails.upi_id,
        payoutDetails.bank_account,
        payoutDetails.ifsc
      );
      
      setWithdrawalAmount('');
      setShowWithdrawalConfirm(false);
      
      // Reload wallet data
      await loadWalletData();
      
      toast({
        title: 'Success',
        description: `Withdrawal of ₹${amount.toFixed(2)} initiated successfully`,
      });
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Withdrawal failed',
        variant: 'destructive'
      });
    } finally {
      setWithdrawalLoading(false);
    }
  };

  if (loading) {
    return (
      <CreatorLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout>
      <div className="max-w-6xl mx-auto w-full">
        {/* Desktop Bento Layout */}
        <div className="lg:grid lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: lg:col-span-5 */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            {/* Header */}
            <div>
              <h1 className="font-display text-2xl lg:text-3xl font-bold text-zinc-900 tracking-tight">Wallet</h1>
              <p className="text-zinc-500 text-xs sm:text-sm mt-0.5">Manage earnings, update payout methods, and initiate instant withdrawals.</p>
            </div>

            {/* Interactive Credit Card */}
            <div className="w-full flex flex-col items-center">
              <CreditCard className="w-full max-w-sm sm:max-w-md mx-auto aspect-[8560/5398]">
                <CreditCardFlipper
                  className="relative rounded-2xl h-full w-full"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <CreditCardFront
                    safeArea={18}
                    className="h-full w-full rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white border border-orange-500/30 shadow-[0_20px_45px_-10px_rgba(245,111,16,0.18)] before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top_right,rgba(245,111,16,0.22),transparent_65%)] after:absolute after:inset-0 after:bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,255,255,0.08),transparent_55%)]"
                  >
                    <div className="flex h-full flex-col justify-between relative z-10">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-1.5 font-bold tracking-[0.35em] text-xs text-zinc-100">
                          <span>SELLR</span>
                          <span className="size-1.5 rounded-full bg-orange-500 inline-block" />
                        </div>
                        <span className="bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-md text-[9px] font-mono tracking-widest text-orange-300 border border-orange-500/20">
                          PLATINUM CREATOR
                        </span>
                      </div>

                      <div className="flex items-center gap-3 my-auto">
                        <CreditCardChip className="relative top-auto left-auto translate-y-0 w-10 h-7" />
                        <svg className="w-5 h-5 text-zinc-400 rotate-90 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M12 2a10 10 0 0 1 10 10" />
                          <path d="M12 6a6 6 0 0 1 6 6" />
                          <path d="M12 10a2 2 0 0 1 2 2" />
                        </svg>
                      </div>

                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 mb-0.5">Cardholder</p>
                          <CreditCardName className="text-base sm:text-lg font-bold tracking-wide text-zinc-100">
                            {creatorDisplayName}
                          </CreditCardName>
                        </div>
                        <span className="bg-orange-500/15 border border-orange-400/30 text-orange-400 font-mono text-xs font-bold px-2.5 py-1 rounded-lg">
                          {payoutMethodLabel}
                        </span>
                      </div>
                    </div>
                  </CreditCardFront>

                  <CreditCardBack
                    safeArea={0}
                    className="h-full w-full rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white border border-orange-500/30 shadow-[0_20px_45px_-10px_rgba(245,111,16,0.18)] before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top_right,rgba(245,111,16,0.22),transparent_65%)] after:absolute after:inset-0 after:bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,255,255,0.08),transparent_55%)]"
                  >
                    <div className="flex h-full flex-col justify-between relative z-10">
                      <div className="h-10 w-full bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 border-y border-white/5 mt-3 sm:mt-4" />

                      <div className="px-5 text-center my-auto">
                        <p className="text-[10px] uppercase font-mono tracking-[0.25em] text-orange-400 font-semibold">Available Balance</p>
                        <p className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white mt-0.5">
                          ₹{walletBalance.toFixed(2)}
                        </p>
                      </div>

                      <div className="px-4 pb-3.5 sm:pb-4">
                        <div className="bg-zinc-950/40 border border-white/10 rounded-xl p-2.5 flex items-center justify-between text-xs">
                          {payoutDetails.payout_method === 'upi' && payoutDetails.upi_id ? (
                            <>
                              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">UPI Destination</span>
                              <span className="font-mono font-semibold text-zinc-200 text-[11px] truncate max-w-[180px]">{payoutDetails.upi_id}</span>
                            </>
                          ) : payoutDetails.payout_method === 'bank' && payoutDetails.bank_account ? (
                            <>
                              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Bank Destination</span>
                              <span className="font-mono font-semibold text-zinc-200 text-[11px]">{maskAccountNumber(payoutDetails.bank_account)} ({payoutDetails.ifsc || 'NEFT'})</span>
                            </>
                          ) : (
                            <span className="text-[11px] text-zinc-400 text-center w-full">Tap to configure payout details</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CreditCardBack>
                </CreditCardFlipper>
              </CreditCard>
              <p className="text-center text-[11px] font-mono text-zinc-400 mt-2">Hover or tap card to flip</p>
            </div>

            {/* Quick Summary Card */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold block">Available to Withdraw</span>
                  <span className="text-xl font-display font-black text-zinc-900">₹{walletBalance.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold block">Payout Status</span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${verifiedPayoutDetails ? 'text-emerald-700' : 'text-amber-700'}`}>
                    <span className={`size-1.5 rounded-full ${verifiedPayoutDetails ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                    {verifiedPayoutDetails ? 'Verified & Active' : 'Setup Required'}
                  </span>
                </div>
              </div>
              <div className="pt-2.5 flex items-center justify-between text-xs text-zinc-500">
                <span>Linked Method</span>
                <span className="font-semibold text-zinc-800 font-mono">
                  {payoutDetails.payout_method === 'upi' ? (
                    payoutDetails.upi_id || 'UPI'
                  ) : payoutDetails.payout_method === 'bank' ? (
                    maskAccountNumber(payoutDetails.bank_account)
                  ) : (
                    'None configured'
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: lg:col-span-7 */}
          <div className="lg:col-span-7 w-full mt-6 lg:mt-0">
            <Tabs defaultValue="withdraw" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-zinc-100 p-1 rounded-xl border border-zinc-200/80 mb-4">
                <TabsTrigger value="withdraw" className="rounded-lg text-xs sm:text-sm font-semibold text-zinc-600 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-xs transition-all">
                  Withdraw Funds
                </TabsTrigger>
                <TabsTrigger value="payout-details" className="rounded-lg text-xs sm:text-sm font-semibold text-zinc-600 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-xs transition-all">
                  Payout Details
                </TabsTrigger>
              </TabsList>

              {/* Withdraw Tab */}
              <TabsContent value="withdraw" className="space-y-4">
                <Card className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-hidden">
                  <CardHeader className="border-b border-zinc-100 py-3.5 px-5">
                    <CardTitle className="font-display text-lg font-bold text-zinc-900">Withdraw Funds</CardTitle>
                    <CardDescription className="text-xs text-zinc-500">
                      Enter the amount you wish to transfer to your linked payout method.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5">
                    {!verifiedPayoutDetails ? (
                      <div className="p-5 bg-amber-50/70 rounded-xl border border-amber-200 text-center">
                        <p className="text-amber-800 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          Please verify your payout details first
                        </p>
                        <p className="text-xs text-amber-700/80 mb-3 max-w-sm mx-auto">
                          A verified UPI ID or Bank account is required before requesting withdrawals.
                        </p>
                        <Button 
                          onClick={() => {
                            const elem = document.querySelector('[value="payout-details"]') as HTMLElement;
                            elem?.click();
                          }}
                          variant="outline"
                          className="border-amber-300 bg-white hover:bg-amber-50 text-amber-800 font-semibold rounded-xl text-xs h-9"
                        >
                          Go to Payout Details
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="amount" className="text-xs font-semibold text-zinc-700">Withdrawal Amount</Label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-zinc-400 text-base">₹</span>
                            <Input 
                              id="amount"
                              type="number"
                              placeholder="0.00"
                              value={withdrawalAmount}
                              onChange={(e) => setWithdrawalAmount(e.target.value)}
                              step="100"
                              min="0"
                              max={walletBalance}
                              className="pl-8 bg-zinc-50 border-zinc-200 focus:bg-white text-zinc-900 font-mono font-bold text-base rounded-xl h-11"
                            />
                          </div>
                          
                          {/* Preset Chips */}
                          <div className="flex items-center gap-2 pt-1 flex-wrap">
                            <span className="text-[11px] font-mono text-zinc-400 mr-0.5">Quick:</span>
                            {[500, 1000, 2500].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                disabled={preset > walletBalance}
                                onClick={() => setWithdrawalAmount(String(preset))}
                                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-lg border transition-all ${
                                  preset > walletBalance 
                                    ? 'border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed'
                                    : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700'
                                }`}
                              >
                                ₹{preset}
                              </button>
                            ))}
                            <button
                              type="button"
                              disabled={walletBalance <= 0}
                              onClick={() => setWithdrawalAmount(String(Math.floor(walletBalance)))}
                              className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 transition-all disabled:opacity-40"
                            >
                              Max (₹{walletBalance.toFixed(0)})
                            </button>
                          </div>

                          <div className="flex items-center justify-between text-xs text-zinc-500 pt-0.5">
                            <span>Available for withdrawal:</span>
                            <span className="font-mono font-bold text-zinc-900">₹{walletBalance.toFixed(2)}</span>
                          </div>
                        </div>

                        <Button 
                          onClick={() => setShowWithdrawalConfirm(true)}
                          disabled={!withdrawalAmount || parseFloat(withdrawalAmount) <= 0 || parseFloat(withdrawalAmount) > walletBalance}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs sm:text-sm rounded-xl h-10 shadow-xs transition-all disabled:opacity-50"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Request Withdrawal
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Docked Recent Withdrawals list */}
                {withdrawalHistory.length > 0 && (
                  <Card className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-zinc-100 py-2.5 px-4">
                      <div>
                        <CardTitle className="text-sm font-bold text-zinc-900">Recent Withdrawals</CardTitle>
                        <CardDescription className="text-[11px] text-zinc-400">
                          Last 10 withdrawal transactions
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => loadWalletData(false)}
                        disabled={refreshingHistory}
                        className="h-7 w-7 text-zinc-400 hover:text-zinc-600 rounded-lg"
                        title="Refresh history"
                      >
                        {refreshingHistory ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </CardHeader>
                    <CardContent className="p-3">
                      <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2">
                        {withdrawalHistory.map((withdrawal) => (
                          <div key={withdrawal.id} className="flex items-center justify-between p-2.5 sm:p-3 border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 rounded-xl transition-colors">
                            <div className="flex-1 min-w-0 pr-2">
                              <p className="font-mono font-bold text-zinc-900 text-xs sm:text-sm">₹{withdrawal.amount.toFixed(2)}</p>
                              <p className="text-[10px] sm:text-[11px] text-zinc-500 capitalize mt-0.5 truncate">
                                {withdrawal.type} • {new Date(withdrawal.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold border ${
                                withdrawal.status === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                withdrawal.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                withdrawal.status === 'reverted' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                              </span>
                              {withdrawal.utr && (
                                <p className="hidden sm:block text-[10px] font-mono text-zinc-400">UTR: {withdrawal.utr.slice(-6)}</p>
                              )}
                              {withdrawal.status === 'failed' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-blue-600 hover:text-blue-800 rounded-lg"
                                  onClick={() => handleRevertWithdrawal(withdrawal.id)}
                                  disabled={revertingId === withdrawal.id}
                                  title="Revert to wallet"
                                >
                                  {revertingId === withdrawal.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Payout Details Tab */}
              <TabsContent value="payout-details">
                <Card className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-hidden">
                  <CardHeader className="border-b border-zinc-100 py-3.5 px-5">
                    <CardTitle className="font-display text-lg font-bold text-zinc-900">Payout Details</CardTitle>
                    <CardDescription className="text-xs text-zinc-500">
                      {payoutDetails.payout_method 
                        ? `Current disbursement method: ${payoutDetails.payout_method.toUpperCase()}`
                        : 'Configure your bank account or UPI ID for seamless payouts.'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5">
                    {!editingPayoutDetails ? (
                      // View Payout Details
                      <div className="space-y-4">
                        {payoutDetails.payout_method ? (
                          <>
                            {/* Status Indicator */}
                            <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 rounded-xl border border-emerald-200/80">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                              <div>
                                <span className="text-emerald-800 font-bold text-xs sm:text-sm block">
                                  {verifiedPayoutDetails ? 'Payout Method Verified & Active' : 'Details Saved'}
                                </span>
                                <span className="text-emerald-700 text-[11px] block mt-0.5">Disbursements will be routed to this destination.</span>
                              </div>
                            </div>

                            {/* Display Details */}
                            {payoutDetails.payout_method === 'upi' ? (
                              <div className="p-3.5 bg-zinc-50 border border-zinc-200/60 rounded-xl">
                                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold mb-0.5">UPI ID</p>
                                <p className="text-sm sm:text-base font-bold text-zinc-900 font-mono">{payoutDetails.upi_id}</p>
                              </div>
                            ) : (
                              <div className="space-y-2.5">
                                <div className="p-3.5 bg-zinc-50 border border-zinc-200/60 rounded-xl">
                                  <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold mb-0.5">Account Number</p>
                                  <p className="text-sm sm:text-base font-bold text-zinc-900 font-mono">{payoutDetails.bank_account}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2.5">
                                  <div className="p-3 bg-zinc-50 border border-zinc-200/60 rounded-xl">
                                    <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold mb-0.5">IFSC Code</p>
                                    <p className="text-xs sm:text-sm font-bold text-zinc-900 font-mono">{payoutDetails.ifsc}</p>
                                  </div>
                                  <div className="p-3 bg-zinc-50 border border-zinc-200/60 rounded-xl">
                                    <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold mb-0.5">Account Holder</p>
                                    <p className="text-xs sm:text-sm font-bold text-zinc-900 truncate">{payoutDetails.account_holder_name}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            <Button 
                              variant="outline"
                              className="w-full border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-xl h-9 font-semibold text-xs shadow-xs"
                              onClick={() => setEditingPayoutDetails(true)}
                            >
                              <Edit2 className="h-3.5 w-3.5 mr-2 text-zinc-500" />
                              Update Payout Details
                            </Button>
                          </>
                        ) : (
                          <div className="p-5 bg-amber-50/70 rounded-xl border border-amber-200 text-center">
                            <p className="text-amber-800 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 mb-2">
                              <AlertCircle className="h-4 w-4 text-amber-600" />
                              No payout method configured yet
                            </p>
                            <p className="text-xs text-amber-700/80 mb-3 max-w-sm mx-auto">
                              Add your UPI ID or bank account details to enable withdrawals.
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingPayoutDetails(true)}
                              className="border-amber-300 bg-white hover:bg-amber-50 text-amber-800 font-semibold rounded-xl text-xs h-9"
                            >
                              Add Payout Details
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      // Edit Payout Details Form
                      <div className="space-y-4">
                        <div className="flex gap-2 mb-3 p-1 bg-zinc-100 rounded-xl border border-zinc-200/60 w-fit">
                          <button 
                            type="button"
                            onClick={() => {
                              setPayoutMethod('upi');
                              setBankAccount('');
                              setIfsc('');
                              setAccountHolderName('');
                            }}
                            className={`px-3.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                              payoutMethod === 'upi'
                                ? 'bg-white text-zinc-900 shadow-xs font-bold'
                                : 'text-zinc-600 hover:text-zinc-900'
                            }`}
                          >
                            UPI ID
                          </button>
                          <button 
                            type="button"
                            onClick={() => {
                              setPayoutMethod('bank');
                              setUpiId('');
                            }}
                            className={`px-3.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                              payoutMethod === 'bank'
                                ? 'bg-white text-zinc-900 shadow-xs font-bold'
                                : 'text-zinc-600 hover:text-zinc-900'
                            }`}
                          >
                            Bank Account
                          </button>
                        </div>

                        {payoutMethod === 'upi' ? (
                          <div className="space-y-1.5">
                            <Label htmlFor="upi-id" className="text-xs font-semibold text-zinc-700">UPI ID</Label>
                            <Input 
                              id="upi-id"
                              placeholder="yourname@okhdfcbank"
                              value={upiId}
                              onChange={(e) => setUpiId(e.target.value)}
                              className="bg-zinc-50 border-zinc-200 focus:bg-white text-zinc-900 rounded-xl text-sm h-10"
                            />
                            <p className="text-[11px] text-zinc-400">Format: username@bankname (e.g. 9876543210@paytm)</p>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            <div className="space-y-1.5">
                              <Label htmlFor="account" className="text-xs font-semibold text-zinc-700">Bank Account Number</Label>
                              <Input 
                                id="account"
                                placeholder="Enter 9-18 digit account number"
                                value={bankAccount}
                                onChange={(e) => setBankAccount(e.target.value)}
                                className="bg-zinc-50 border-zinc-200 focus:bg-white text-zinc-900 rounded-xl text-sm h-10"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="ifsc" className="text-xs font-semibold text-zinc-700">IFSC Code</Label>
                              <Input 
                                id="ifsc"
                                placeholder="HDFC0001234"
                                value={ifsc}
                                onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                                maxLength={11}
                                className="bg-zinc-50 border-zinc-200 focus:bg-white text-zinc-900 rounded-xl text-sm h-10 uppercase font-mono"
                              />
                              <p className="text-[11px] text-zinc-400">11 character alphanumeric code</p>
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="holder" className="text-xs font-semibold text-zinc-700">Account Holder Name</Label>
                              <Input 
                                id="holder"
                                placeholder="As registered with your bank"
                                value={accountHolderName}
                                onChange={(e) => setAccountHolderName(e.target.value)}
                                className="bg-zinc-50 border-zinc-200 focus:bg-white text-zinc-900 rounded-xl text-sm h-10"
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2.5 pt-3">
                          <Button 
                            onClick={handleSavePayoutDetails}
                            disabled={withdrawalLoading}
                            className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl h-9 text-xs font-semibold shadow-xs"
                          >
                            {withdrawalLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving Details...
                              </>
                            ) : (
                              'Save Details'
                            )}
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => setEditingPayoutDetails(false)}
                            disabled={withdrawalLoading}
                            className="border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-xl h-9 text-xs font-semibold"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Withdrawal Confirmation Dialog */}
        <AlertDialog open={showWithdrawalConfirm} onOpenChange={setShowWithdrawalConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Withdrawal</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to withdraw ₹{parseFloat(withdrawalAmount || '0').toFixed(2)} to your {payoutDetails.payout_method?.toUpperCase()} account.
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-gray-700">
                  {payoutDetails.payout_method === 'upi' 
                    ? `UPI: ${payoutDetails.upi_id}`
                    : `Account: ${payoutDetails.bank_account} (${payoutDetails.ifsc})`
                  }
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2">
              <AlertDialogCancel disabled={withdrawalLoading}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleWithdrawAmount}
                disabled={withdrawalLoading}
              >
                {withdrawalLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Withdrawal'
                )}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CreatorLayout>
  );
}
