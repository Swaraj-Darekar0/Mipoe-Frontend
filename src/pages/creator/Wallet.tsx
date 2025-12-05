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
  creatorWithdraw
} from '@/lib/api';
import { Loader2, Wallet, Send, Edit2, CheckCircle2, AlertCircle } from 'lucide-react';

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
  status: 'pending' | 'success' | 'failed';
  payout_method: 'upi' | 'bank';
  reference_id?: string;
  utr?: string;
  created_at: string;
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
  
  const loadWalletData = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setLoading(true);
      
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
      <>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
          <p className="text-gray-600 mt-2">Manage your earnings and withdraw funds</p>
        </div>

        {/* Wallet Balance Card */}
        <Card className="mb-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-6 w-6" />
              Total Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">₹{walletBalance.toFixed(2)}</div>
            <p className="text-blue-100">Available for withdrawal</p>
          </CardContent>
        </Card>

        {/* Payout Details & Withdrawal Tabs */}
        <Tabs defaultValue="payout-details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payout-details">Payout Details</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw Funds</TabsTrigger>
          </TabsList>

          {/* Payout Details Tab */}
          <TabsContent value="payout-details">
            <Card>
              <CardHeader>
                <CardTitle>Payout Details</CardTitle>
                <CardDescription>
                  {payoutDetails.payout_method 
                    ? `Current method: ${payoutDetails.payout_method.toUpperCase()}`
                    : 'Add your bank account or UPI for withdrawals'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!editingPayoutDetails ? (
                  // View Payout Details
                  <div className="space-y-4">
                    {payoutDetails.payout_method ? (
                      <>
                        {/* Status Indicator */}
                        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <span className="text-green-700 font-medium">
                            {verifiedPayoutDetails ? 'Verified & Ready' : 'Saved'}
                          </span>
                        </div>

                        {/* Display Details */}
                        {payoutDetails.payout_method === 'upi' ? (
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">UPI ID</p>
                            <p className="text-lg font-medium">{payoutDetails.upi_id}</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-600 mb-1">Account Number</p>
                              <p className="text-lg font-medium">{payoutDetails.bank_account}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">IFSC Code</p>
                                <p className="text-lg font-medium">{payoutDetails.ifsc}</p>
                              </div>
                              <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Account Holder</p>
                                <p className="text-lg font-medium">{payoutDetails.account_holder_name}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        <Button 
                          variant="outline"
                          className="w-full"
                          onClick={() => setEditingPayoutDetails(true)}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Update Details
                        </Button>
                      </>
                    ) : (
                      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-center">
                        <p className="text-amber-700 flex items-center justify-center gap-2 mb-3">
                          <AlertCircle className="h-5 w-5" />
                          No payout details added yet
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPayoutDetails(true)}
                        >
                          Add Details
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  // Edit Payout Details Form
                  <div className="space-y-4">
                    <div className="flex gap-4 mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          value="upi" 
                          checked={payoutMethod === 'upi'}
                          onChange={(e) => {
                            setPayoutMethod(e.target.value as 'upi');
                            setBankAccount('');
                            setIfsc('');
                            setAccountHolderName('');
                          }}
                          className="w-4 h-4"
                        />
                        <span className="font-medium">UPI</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          value="bank" 
                          checked={payoutMethod === 'bank'}
                          onChange={(e) => {
                            setPayoutMethod(e.target.value as 'bank');
                            setUpiId('');
                          }}
                          className="w-4 h-4"
                        />
                        <span className="font-medium">Bank Account</span>
                      </label>
                    </div>

                    {payoutMethod === 'upi' ? (
                      <div className="space-y-2">
                        <Label htmlFor="upi-id">UPI ID</Label>
                        <Input 
                          id="upi-id"
                          placeholder="user@okhdfcbank"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                        />
                        <p className="text-xs text-gray-500">Format: username@bankname</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="account">Bank Account Number</Label>
                          <Input 
                            id="account"
                            placeholder="1234567890"
                            value={bankAccount}
                            onChange={(e) => setBankAccount(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ifsc">IFSC Code</Label>
                          <Input 
                            id="ifsc"
                            placeholder="HDFC0001234"
                            value={ifsc}
                            onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                            maxLength={11}
                          />
                          <p className="text-xs text-gray-500">11 character code</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="holder">Account Holder Name</Label>
                          <Input 
                            id="holder"
                            placeholder="John Doe"
                            value={accountHolderName}
                            onChange={(e) => setAccountHolderName(e.target.value)}
                          />
                        </div>
                      </>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button 
                        onClick={handleSavePayoutDetails}
                        disabled={withdrawalLoading}
                        className="flex-1"
                      >
                        {withdrawalLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Details'
                        )}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setEditingPayoutDetails(false)}
                        disabled={withdrawalLoading}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Withdraw Tab */}
          <TabsContent value="withdraw">
            <Card>
              <CardHeader>
                <CardTitle>Withdraw Funds</CardTitle>
                <CardDescription>
                  Enter the amount you want to withdraw
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!verifiedPayoutDetails ? (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-amber-700 flex items-center gap-2 mb-3">
                      <AlertCircle className="h-5 w-5" />
                      Please verify your payout details first
                    </p>
                    <Button 
                      onClick={() => {
                        const elem = document.querySelector('[value="payout-details"]') as HTMLElement;
                        elem?.click();
                      }}
                      variant="outline"
                    >
                      Go to Payout Details
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Withdrawal Amount</Label>
                      <div className="flex gap-2">
                        <span className="flex items-center text-xl font-bold text-gray-700">₹</span>
                        <Input 
                          id="amount"
                          type="number"
                          placeholder="Enter amount"
                          value={withdrawalAmount}
                          onChange={(e) => setWithdrawalAmount(e.target.value)}
                          step="100"
                          min="0"
                          max={walletBalance}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Available: ₹{walletBalance.toFixed(2)}
                      </p>
                    </div>

                    <Button 
                      onClick={() => setShowWithdrawalConfirm(true)}
                      disabled={!withdrawalAmount || parseFloat(withdrawalAmount) <= 0}
                      className="w-full"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Request Withdrawal
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Withdrawals */}
            {withdrawalHistory.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Recent Withdrawals</CardTitle>
                  <CardDescription>
                    Your last 10 withdrawal requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {withdrawalHistory.map((withdrawal) => (
                      <div key={withdrawal.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">₹{withdrawal.amount.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(withdrawal.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            withdrawal.status === 'success' ? 'bg-green-100 text-green-800' :
                            withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                          </span>
                          {withdrawal.utr && (
                            <p className="text-xs text-gray-500">UTR: {withdrawal.utr.slice(-6)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

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
      </>
    </CreatorLayout>
  );
}
