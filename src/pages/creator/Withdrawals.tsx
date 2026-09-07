import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getTransactions, getWalletBalance, Transaction as ApiTransaction } from '@/lib/api';
import { Loader2, Wallet, ArrowDown, ArrowUp, Clock } from 'lucide-react';
import CreatorLayout from '@/layouts/CreatorLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Use the extended Transaction interface from api.ts
type Transaction = ApiTransaction;

interface CreatorStats {
  total_earned: number;
  total_withdrawn: number;
  pending_withdrawals: number;
  wallet_balance: number;
}

export default function CreatorWithdrawals() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<CreatorStats>({
    total_earned: 0,
    total_withdrawn: 0,
    pending_withdrawals: 0,
    wallet_balance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'all' | 'earning' | 'withdrawal' | 'pending_withdrawal'>('all');

  const loadCreatorData = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setLoading(true);
      const creatorId = Number(localStorage.getItem("user_id"));
      if (!creatorId) {
        if (isInitialLoad) toast({ title: "Authentication Error", description: "Could not find user ID.", variant: "destructive" });
        return;
      }

      // Fetch all transactions and wallet balance in parallel
      const [transactionRes, balanceRes] = await Promise.all([
        getTransactions('creator', creatorId, undefined, undefined, undefined, 100), // Fetch up to 100 recent transactions
        getWalletBalance()
      ]);
      
      const newTransactions = transactionRes?.transactions || [];
      
      // Only update state if the data has actually changed to prevent unnecessary re-renders
      if (JSON.stringify(newTransactions) !== JSON.stringify(transactions)) {
        console.log("Polling found new data, updating state.");
        setTransactions(newTransactions);

        const totalEarned = newTransactions.filter(t => t.type === 'earning' && t.status === 'success').reduce((sum, t) => sum + t.amount, 0);
        const totalWithdrawn = newTransactions.filter(t => t.type === 'withdrawal' && t.status === 'success').reduce((sum, t) => sum + t.amount, 0);
        const pendingWithdrawals = newTransactions.filter(t => t.type === 'withdrawal' && t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);

        setStats({
          total_earned: totalEarned,
          total_withdrawn: totalWithdrawn,
          pending_withdrawals: pendingWithdrawals,
          wallet_balance: balanceRes.balance,
        });
      }

    } catch (error: any) {
      // Only show toast on initial load, log subsequent polling errors silently
      if (isInitialLoad) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to load transaction history',
          variant: 'destructive',
        });
      } else {
        console.error("Polling Error:", error);
      }
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  };

  // Initial load effect
  useEffect(() => {
    loadCreatorData(true);
  }, []);

  // Polling effect for pending transactions
  useEffect(() => {
    const hasPending = transactions.some(t => t.type === 'withdrawal' && t.status === 'pending');
    if (hasPending) {
      const intervalId = setInterval(() => {
        console.log("Polling for status updates on creator transactions page...");
        loadCreatorData(false); // Pass false for background refresh
      }, 15000); // Poll every 15 seconds
      return () => clearInterval(intervalId); // Cleanup on unmount or when data changes
    }
  }, [transactions]);

  // Handle filtering
  useEffect(() => {
    if (typeFilter === 'all') {
      setFilteredTransactions(transactions);
    } else if (typeFilter === 'pending_withdrawal') {
      setFilteredTransactions(
        transactions.filter(t => t.type === 'withdrawal' && t.status === 'pending')
      );
    } else {
      setFilteredTransactions(transactions.filter(t => t.type === typeFilter));
    }
  }, [typeFilter, transactions]);


  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earning':
        return (
          <div className="size-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0">
            <ArrowDown className="h-4 w-4" />
          </div>
        );
      case 'withdrawal':
        return (
          <div className="size-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center justify-center shrink-0">
            <ArrowUp className="h-4 w-4" />
          </div>
        );
      default:
        return (
          <div className="size-9 rounded-xl bg-zinc-100 text-zinc-600 border border-zinc-200/60 flex items-center justify-center shrink-0">
            <Wallet className="h-4 w-4" />
          </div>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Success</span>;
      case 'pending':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Pending</span>;
      case 'failed':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">Failed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">{status}</span>;
    }
  };

  if (loading) {
    return (
      <CreatorLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
        </div>
      </CreatorLayout>
    );
  }
  
  return (
    <CreatorLayout>
      <div className="max-w-6xl mx-auto w-full flex flex-col">
        {/* Compact Header */}
        <div className="mb-3">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">Transaction History</h1>
          <p className="text-zinc-500 text-xs sm:text-sm mt-0.5">Track your past campaign earnings, withdrawals, and balance movements.</p>
        </div>

        {/* 4-Card Horizontal Stats Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <Card className="bg-white border border-zinc-200/80 rounded-2xl p-3 sm:p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">Available Balance</span>
              <div className="size-6 sm:size-7 rounded-lg bg-orange-50 text-orange-600 border border-orange-200/60 flex items-center justify-center">
                <Wallet className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-zinc-900 mt-1 sm:mt-1.5">₹{stats.wallet_balance.toFixed(2)}</div>
            <p className="text-[10px] text-zinc-400 mt-0.5">Ready for payout</p>
          </Card>

          <Card className="bg-white border border-zinc-200/80 rounded-2xl p-3 sm:p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">Total Earned</span>
              <div className="size-6 sm:size-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center">
                <ArrowDown className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-emerald-600 mt-1 sm:mt-1.5">₹{stats.total_earned.toFixed(2)}</div>
            <p className="text-[10px] text-zinc-400 mt-0.5">Lifetime earnings</p>
          </Card>

          <Card className="bg-white border border-zinc-200/80 rounded-2xl p-3 sm:p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">Total Withdrawn</span>
              <div className="size-6 sm:size-7 rounded-lg bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center justify-center">
                <ArrowUp className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-zinc-900 mt-1 sm:mt-1.5">₹{stats.total_withdrawn.toFixed(2)}</div>
            <p className="text-[10px] text-zinc-400 mt-0.5">Disbursed to date</p>
          </Card>

          <Card className="bg-white border border-zinc-200/80 rounded-2xl p-3 sm:p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">Pending Clearances</span>
              <div className="size-6 sm:size-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center">
                <Clock className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-amber-600 mt-1 sm:mt-1.5">₹{stats.pending_withdrawals.toFixed(2)}</div>
            <p className="text-[10px] text-zinc-400 mt-0.5">Under review</p>
          </Card>
        </div>

        {/* Viewport-locked Transactions Pane */}
        <div className="h-[calc(100vh-230px)] min-h-[360px] flex flex-col bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-hidden">
          {/* Compact Header */}
          <div className="flex flex-row items-center justify-between gap-3 border-b border-zinc-100 px-4 sm:px-5 py-3 shrink-0">
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-zinc-900">Transaction History</h2>
              <p className="text-[11px] text-zinc-400">A complete record of your campaign credits and disbursements.</p>
            </div>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as any)}>
              <SelectTrigger className="w-[140px] sm:w-[170px] bg-white border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 shadow-xs h-8 sm:h-9">
                <SelectValue placeholder="Filter transactions" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-zinc-200 shadow-lg">
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="earning">Earnings Only</SelectItem>
                <SelectItem value="withdrawal">Withdrawals Only</SelectItem>
                <SelectItem value="pending_withdrawal">Pending Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Internal scrollable list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-16 text-zinc-400">
                <Wallet className="h-9 w-9 text-zinc-300 mx-auto mb-2" />
                <p className="font-semibold text-xs sm:text-sm text-zinc-700">No transactions found</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Transactions matching this filter will appear here.</p>
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 sm:p-3.5 border border-zinc-100 bg-zinc-50/40 hover:bg-zinc-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(tx.type)}
                    <div>
                      <p className="font-semibold text-xs sm:text-sm text-zinc-900">{tx.description || tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</p>
                      <p className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5">{new Date(tx.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className={`font-mono font-bold text-xs sm:text-sm ${tx.type === 'earning' ? 'text-emerald-600' : 'text-zinc-900'}`}>
                      {tx.type === 'earning' ? '+' : '-'} ₹{tx.amount.toFixed(2)}
                    </p>
                    {getStatusBadge(tx.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </CreatorLayout>
  );
}