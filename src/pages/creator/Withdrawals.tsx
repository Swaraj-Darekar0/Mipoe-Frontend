import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
        return <ArrowDown className="h-5 w-5 text-green-600" />;
      case 'withdrawal':
        return <ArrowUp className="h-5 w-5 text-red-600" />;
      default:
        return <Wallet className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
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
      <>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
          <p className="text-gray-600 mt-2">Track all your earnings and withdrawals.</p>
        </div>

        {/* Main Wallet Balance */}
        <Card className="mb-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-6 w-6" />
              Available Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">₹{stats.wallet_balance.toFixed(2)}</div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <ArrowDown className="h-4 w-4 text-green-600" />
                Total Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{stats.total_earned.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <ArrowUp className="h-4 w-4 text-red-600" />
                Total Withdrawn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">₹{stats.total_withdrawn.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                Pending Withdrawals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">₹{stats.pending_withdrawals.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <div>
              <CardTitle>History</CardTitle>
              <CardDescription>Your recent transaction history.</CardDescription>
            </div>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="earning">Earnings</SelectItem>
                <SelectItem value="withdrawal">Withdrawals (All)</SelectItem>
                <SelectItem value="pending_withdrawal">Pending Withdrawals</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No transactions found for this filter.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      {getTransactionIcon(tx.type)}
                      <div>
                        <p className="font-semibold">{tx.description || tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</p>
                        <p className="text-sm text-gray-500">{new Date(tx.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${tx.type === 'earning' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'earning' ? '+' : '-'} ₹{tx.amount.toFixed(2)}
                      </p>
                      {getStatusBadge(tx.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </>
    </CreatorLayout>
  );
}