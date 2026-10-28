import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BrandLayout from "@/layouts/BrandLayout";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ArrowDownRight, ArrowUpRight, Download, MoreVertical, Wallet, TrendingUp, DollarSign, Clock, ArrowLeft, ShieldCheck, Building2, QrCode } from "lucide-react";
import { getTransactions, getUserId, getRole, getBrandRefundableSummary, brandWithdrawFunds, BrandRefundableSummary } from "@/lib/api";

// 1. UPDATE INTERFACE TO MATCH API.TS (String IDs)
interface Transaction {
  id: number; // Transaction ID is still a number (Serial)
  user_type: string;
  user_id: string; // 👈 CHANGED to string (UUID)
  campaign_id?: number; // 👈 KEEP as number (Campaign ID is Serial)
  amount: number;
  type: string;
  status: string;
  description: string;
  created_at: string;
  external_txn_id?: string;
  metadata?: Record<string, any>;
  campaign?: {
    name: string;
  };
  creator?: {
    username: string;
  };
}

interface Column {
  header: string;
  accessor: (transaction: Transaction) => React.ReactNode;
}

const BrandTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("deposit");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const { toast } = useToast();
  const navigate = useNavigate();

  const userId = getUserId();
  const role = getRole();

  // Refund / Withdraw modal state
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundableSummary, setRefundableSummary] = useState<BrandRefundableSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundPayoutMethod, setRefundPayoutMethod] = useState<"upi" | "bank">("upi");
  const [refundUpiId, setRefundUpiId] = useState<string>("");
  const [refundBankAccount, setRefundBankAccount] = useState<string>("");
  const [refundIfsc, setRefundIfsc] = useState<string>("");
  const [refundAccountHolder, setRefundAccountHolder] = useState<string>("");
  const [submittingRefund, setSubmittingRefund] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      // Verify user is authenticated as brand
      if (!userId || role !== "brand") {
        console.warn("Auth check failed:", { userId, role });
        navigate("/login");
        return;
      }

      // 3. Call API with string ID
      // @ts-ignore (Temporary ignore if api.ts hasn't updated types yet)
      const response = await getTransactions('brand', userId);
      
      // Map database flat fields, status, and campaign_funding type to the frontend interface structure
      const processed = (response.transactions || []).map((t: any) => {
        const rawStatus = (t.status || "").toLowerCase();
        const mappedStatus = (rawStatus === "completed" || rawStatus === "success" || rawStatus === "paid")
          ? "success"
          : rawStatus;
        return {
          ...t,
          type: t.type === "campaign_funding" ? "allocation" : t.type,
          status: mappedStatus,
          campaign: t.campaign_name && t.campaign_name !== "N/A" ? { name: t.campaign_name } : undefined,
          creator: t.creator_username && t.creator_username !== "N/A" ? { username: t.creator_username } : undefined,
        };
      });
      setTransactions(processed);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load transactions",
        variant: "destructive",
      });
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchTransactions();
    } else {
      console.warn("No user ID found, redirecting to login");
      navigate("/login");
    }
  }, [userId, role]);

  const openRefundModal = async () => {
    setIsRefundModalOpen(true);
    setLoadingSummary(true);
    try {
      const summary = await getBrandRefundableSummary();
      setRefundableSummary(summary);
      if (summary.max_refundable_amount > 0) {
        setRefundAmount(summary.max_refundable_amount.toString());
      }
    } catch (err: any) {
      toast({
        title: "Could not fetch balance details",
        description: err.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleWithdrawFunds = async () => {
    const amountVal = parseFloat(refundAmount);
    if (!amountVal || amountVal <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid refund amount greater than ₹0.",
        variant: "destructive",
      });
      return;
    }
    if (refundableSummary && amountVal > refundableSummary.max_refundable_amount) {
      toast({
        title: "Exceeds Refundable Balance",
        description: `Maximum refundable amount is ₹${refundableSummary.max_refundable_amount.toLocaleString("en-IN")}. Active campaign allocations cannot be refunded until reclaimed.`,
        variant: "destructive",
      });
      return;
    }

    if (refundPayoutMethod === "upi") {
      if (!refundUpiId || !refundUpiId.includes("@")) {
        toast({
          title: "Invalid UPI ID",
          description: "Please provide a valid UPI ID (e.g., brand@okaxis).",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!refundBankAccount || !refundIfsc) {
        toast({
          title: "Missing Bank Details",
          description: "Please provide both Bank Account Number and IFSC Code.",
          variant: "destructive",
        });
        return;
      }
    }

    setSubmittingRefund(true);
    try {
      const res = await brandWithdrawFunds({
        amount: amountVal,
        payout_method: refundPayoutMethod,
        upi_id: refundPayoutMethod === "upi" ? refundUpiId : undefined,
        bank_account: refundPayoutMethod === "bank" ? refundBankAccount : undefined,
        ifsc: refundPayoutMethod === "bank" ? refundIfsc : undefined,
        account_holder_name: refundPayoutMethod === "bank" ? refundAccountHolder : undefined,
      });

      toast({
        title: "Refund Initiated Successfully",
        description: `₹${amountVal.toLocaleString("en-IN")} refund processed (0% TDS - Capital Return). Tx ID: #${res.transaction_id}`,
      });
      setIsRefundModalOpen(false);
      fetchTransactions();
    } catch (err: any) {
      toast({
        title: "Refund Failed",
        description: err.message || "Failed to process withdrawal.",
        variant: "destructive",
      });
    } finally {
      setSubmittingRefund(false);
    }
  };

  const isDeletedCampaignTransaction = (t: Transaction) => {
    const isCampaignRelated = ["allocation", "refund", "distribution"].includes(t.type);
    return (isCampaignRelated || !!t.campaign_id) && (!t.campaign_id || !t.campaign);
  };

  useEffect(() => {
    let filtered = transactions;

    if (typeFilter !== "all") {
      filtered = filtered.filter((t) => t.type === typeFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    // 4. Fix Campaign Filter Logic
    if (campaignFilter !== "all") {
      if (campaignFilter === "null-campaign") {
        filtered = filtered.filter(isDeletedCampaignTransaction);
      } else {
        // Parse the filter value to Int because campaign_id is a number
        filtered = filtered.filter((t) => t.campaign_id === parseInt(campaignFilter) && t.campaign);
      }
    }

    setFilteredTransactions(filtered);
  }, [transactions, typeFilter, statusFilter, campaignFilter]);

  const campaignFilteredTxns = campaignFilter === "all" 
    ? transactions 
    : transactions.filter(t => 
        campaignFilter === "null-campaign" 
          ? isDeletedCampaignTransaction(t) 
          : (t.campaign_id === parseInt(campaignFilter) && t.campaign)
      );

  const stats = {
    totalAllocated: campaignFilteredTxns
      .filter((t) => t.type === "allocation" && t.status === "success")
      .reduce((sum, t) => sum + t.amount, 0),
    totalDistributed: campaignFilteredTxns
      .filter((t) => t.type === "distribution" && t.status === "success")
      .reduce((sum, t) => sum + t.amount, 0),
    totalRefunded: campaignFilteredTxns
      .filter((t) => t.type === "refund" && t.status === "success")
      .reduce((sum, t) => sum + t.amount, 0),
    pending: campaignFilteredTxns.filter((t) => t.status === "pending").length,
  };

  // 5. Fix Campaign Options Reduce
  const campaignOptions = transactions.reduce((acc, t) => {
    if (t.campaign_id && t.campaign && !acc.some(c => c.id === t.campaign_id)) {
      acc.push({ id: t.campaign_id, name: t.campaign.name });
    }
    return acc;
  }, [] as { id: number; name: string }[]);

  const hasDeletedCampaignTransactions = transactions.some(isDeletedCampaignTransaction);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "allocation":
        return <ArrowDownRight className="w-4 h-4" />;
      case "distribution":
        return <ArrowUpRight className="w-4 h-4" />;
      case "refund":
        return <ArrowDownRight className="w-4 h-4" />;
      case "deposit":
        return <ArrowDownRight className="w-4 h-4" />;
      case "withdrawal":
        return <ArrowUpRight className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "success":
        return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-2.5 py-0.5 rounded-full shadow-sm">Success</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200/50 hover:bg-amber-100 font-medium px-2.5 py-0.5 rounded-full">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive" className="bg-rose-500 hover:bg-rose-600 text-white font-medium px-2.5 py-0.5 rounded-full shadow-sm">Failed</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="text-gray-500 border-gray-300 font-medium px-2.5 py-0.5 rounded-full">Cancelled</Badge>;
      default:
        return <Badge className="font-medium px-2.5 py-0.5 rounded-full">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      allocation: "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50",
      distribution: "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50",
      refund: "bg-orange-50 text-orange-700 border-orange-200/60 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/50",
      deposit: "bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/50",
      withdrawal: "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/50",
      reclaim: "bg-red-50 text-red-700 border-red-200/60 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50",
    };
    const colorClass = colors[type] || "bg-gray-50 text-gray-700 border-gray-200";
    return (
      <Badge className={`${colorClass} border font-semibold px-2.5 py-0.5 rounded-md`}>
        {type === "campaign_funding" ? "Allocation" : type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const getColumnsForType = (type: string, navigate: ReturnType<typeof useNavigate>): Column[] => {
    const commonColumns: Column[] = [
      {
        header: "Date",
        accessor: (t) => new Date(t.created_at).toLocaleDateString("en-IN"),
      },
      {
        header: "Type",
        accessor: (t) => (
          <div className="flex items-center gap-2">
            {getTypeIcon(t.type)}
            {getTypeBadge(t.type)}
          </div>
        ),
      },
      {
        header: "Amount",
        accessor: (t) =>
          `₹${t.amount.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
      },
      {
        header: "Status",
        accessor: (t) => getStatusBadge(t.status),
      },
      {
        header: "Description",
        accessor: (t) => t.description || '-',
      },
    ];
  
    const campaignColumn: Column = {
      header: "Campaign",
      accessor: (t) =>
        t.campaign_id && t.campaign ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/brand/dashboard/${t.campaign_id}`)}
          >
            {t.campaign.name}
          </Button>
        ) : (
          <span className="text-gray-500 font-medium">
            {["allocation", "refund", "distribution"].includes(t.type) || t.campaign_id
              ? "N/A (Deleted Campaign)"
              : "-"}
          </span>
        ),
    };
  
    const creatorColumn: Column = {
      header: "Creator",
      accessor: (t) => t.creator?.username || (t.user_id ? `User` : '-'),
    };
  
    const externalIdColumn: Column = {
      header: "Ext. ID",
      accessor: (t) => t.external_txn_id ? t.external_txn_id.slice(0, 8) + '...' : '-',
    };

    const actionsColumn: Column = {
      header: "Actions",
      accessor: () => (
        <Button variant="ghost" size="sm">
          <MoreVertical className="w-4 h-4" />
        </Button>
      ),
    };
  
    switch (type) {
      case "deposit":
      case "reclaim":
      case "withdrawal":
        return [
          commonColumns[0], // Date
          commonColumns[1], // Type
          commonColumns[2], // Amount
          commonColumns[3], // Status
          commonColumns[4], // Description
          externalIdColumn,
          actionsColumn,
        ];
      case "allocation":
      case "refund":
        return [
          commonColumns[0], // Date
          commonColumns[1], // Type
          campaignColumn,
          commonColumns[2], // Amount
          commonColumns[3], // Status
          commonColumns[4], // Description
          actionsColumn,
        ];
      case "distribution":
        return [
          commonColumns[0], // Date
          commonColumns[1], // Type
          creatorColumn,
          campaignColumn,
          commonColumns[2], // Amount
          commonColumns[3], // Status
          actionsColumn,
        ];
      default: // Fallback for penalty, bonus, etc.
        return [
          commonColumns[0],
          commonColumns[1],
          creatorColumn,
          campaignColumn,
          commonColumns[2],
          commonColumns[3],
          commonColumns[4],
          actionsColumn,
        ];
    }
  };

  const exportToCSV = () => {
    const headers = ["ID", "Campaign ID", "User ID", "Amount", "Type", "Status", "Date"];
    const rows = filteredTransactions.map((t) => [
      t.id,
      t.campaign_id || "N/A",
      t.user_id,
      t.amount,
      t.type,
      t.status,
      new Date(t.created_at).toLocaleDateString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const columns = getColumnsForType(typeFilter, navigate);

  return (
    <BrandLayout sidebar="none">
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Transactions</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage and track all your campaign payments and refunds
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="default"
              size="sm"
              onClick={openRefundModal}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex-1 sm:flex-initial"
            >
              <ArrowUpRight className="w-4 h-4" />
              Refund / Withdraw Funds
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/brand/dashboard")}
              className="gap-2 flex-1 sm:flex-initial"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Allocated</CardTitle>
              <Wallet className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalAllocated.toLocaleString("en-IN")}</div>
              <p className="text-xs text-muted-foreground">Budget allocated to campaigns</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Distributed</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalDistributed.toLocaleString("en-IN")}</div>
              <p className="text-xs text-muted-foreground">Paid to creators</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Refunded</CardTitle>
              <ArrowDownRight className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalRefunded.toLocaleString("en-IN")}</div>
              <p className="text-xs text-muted-foreground">Refunds issued</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Pending transactions</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Transaction Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="reclaim">Reclaim</SelectItem>
                    <SelectItem value="allocation">Allocation</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                    <SelectItem value="distribution">Distribution</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Campaign</label>
                <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Campaigns</SelectItem>
                    {campaignOptions.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id.toString()}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                    {hasDeletedCampaignTransactions && (
                      <SelectItem value="null-campaign">N/A (Deleted Campaigns)</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="w-full sm:w-auto gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""} found for type: {typeFilter}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading transactions...</div>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">No transactions found</div>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((col) => (
                        <TableHead key={col.header} className={col.header === "Amount" ? "text-right" : ""}>
                          {col.header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        {columns.map((col, index) => (
                          <TableCell key={index} className={col.header === "Amount" ? "text-right font-medium" : ""}>
                            {col.accessor(transaction)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Brand Unspent Budget Refund Modal */}
        <Dialog open={isRefundModalOpen} onOpenChange={setIsRefundModalOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <div className="flex items-center justify-between pr-4">
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-indigo-600" />
                  Withdraw Unspent Funds
                </DialogTitle>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold">
                  0% TDS (Capital Return)
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground pt-1">
                Transfer unallocated funds from your brand wallet back to your verified Indian bank account or corporate UPI ID.
              </DialogDescription>
            </DialogHeader>

            {loadingSummary ? (
              <div className="py-8 text-center space-y-2">
                <Clock className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                <p className="text-xs text-muted-foreground">Calculating locked campaign allocations...</p>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                {/* Balances Card */}
                <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Total Wallet Balance:</span>
                    <span className="font-semibold text-zinc-900 tabular-nums">
                      ₹{(refundableSummary?.wallet_balance || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      Locked in Active Campaigns ({refundableSummary?.active_campaign_count || 0}):
                    </span>
                    <span className="font-semibold text-amber-600 tabular-nums">
                      -₹{(refundableSummary?.active_campaign_locks || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-sm font-bold">
                    <span className="text-indigo-950">Max Refundable Now:</span>
                    <span className="text-indigo-600 font-mono text-base tabular-nums">
                      ₹{(refundableSummary?.max_refundable_amount || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="refund-amount" className="text-xs font-semibold">
                      Refund Amount (INR)
                    </Label>
                    {refundableSummary && refundableSummary.max_refundable_amount > 0 && (
                      <button
                        type="button"
                        onClick={() => setRefundAmount(refundableSummary.max_refundable_amount.toString())}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                      >
                        Max (₹{refundableSummary.max_refundable_amount.toLocaleString("en-IN")})
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-zinc-400 font-bold text-base">₹</span>
                    <Input
                      id="refund-amount"
                      type="number"
                      min="1"
                      max={refundableSummary?.max_refundable_amount || undefined}
                      placeholder="e.g. 5000"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="pl-8 font-semibold tabular-nums"
                    />
                  </div>
                </div>

                {/* Payout Rails Tabs */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Disbursement Rail</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRefundPayoutMethod("upi")}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        refundPayoutMethod === "upi"
                          ? "border-indigo-600 bg-indigo-50/50 text-indigo-700"
                          : "border-zinc-200 hover:bg-zinc-50 text-zinc-600"
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Instant UPI
                    </button>
                    <button
                      type="button"
                      onClick={() => setRefundPayoutMethod("bank")}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        refundPayoutMethod === "bank"
                          ? "border-indigo-600 bg-indigo-50/50 text-indigo-700"
                          : "border-zinc-200 hover:bg-zinc-50 text-zinc-600"
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      Bank IMPS / NEFT
                    </button>
                  </div>
                </div>

                {/* Conditional Inputs */}
                {refundPayoutMethod === "upi" ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="refund-upi" className="text-xs font-semibold">
                      Corporate / Business UPI ID
                    </Label>
                    <Input
                      id="refund-upi"
                      placeholder="company@hdfcbank"
                      value={refundUpiId}
                      onChange={(e) => setRefundUpiId(e.target.value)}
                      className="font-mono text-xs"
                    />
                    <p className="text-[11px] text-zinc-500">
                      Funds will be instantly dispatched to this VPA via domestic banking rails.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="refund-holder" className="text-xs font-semibold">
                        Account Holder Name
                      </Label>
                      <Input
                        id="refund-holder"
                        placeholder="Company Legal Name"
                        value={refundAccountHolder}
                        onChange={(e) => setRefundAccountHolder(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="refund-acc" className="text-xs font-semibold">
                          Account Number
                        </Label>
                        <Input
                          id="refund-acc"
                          placeholder="000123456789"
                          value={refundBankAccount}
                          onChange={(e) => setRefundBankAccount(e.target.value)}
                          className="font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="refund-ifsc" className="text-xs font-semibold">
                          IFSC Code
                        </Label>
                        <Input
                          id="refund-ifsc"
                          placeholder="HDFC0000001"
                          value={refundIfsc}
                          onChange={(e) => setRefundIfsc(e.target.value.toUpperCase())}
                          className="font-mono text-xs uppercase"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Legal & Tax Banner */}
                <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>0% TDS Applied (TDS-Exempt Capital Return)</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Under Indian Income Tax provisions, returning unspent advertising deposit funds is classified as a capital return and is completely exempt from Section 194S TDS.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRefundModalOpen(false)}
                disabled={submittingRefund}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleWithdrawFunds}
                disabled={
                  submittingRefund ||
                  loadingSummary ||
                  !refundableSummary ||
                  refundableSummary.max_refundable_amount <= 0 ||
                  !refundAmount ||
                  parseFloat(refundAmount) <= 0 ||
                  parseFloat(refundAmount) > refundableSummary.max_refundable_amount
                }
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {submittingRefund ? "Processing Refund..." : `Confirm Withdrawal (₹${parseFloat(refundAmount || "0").toLocaleString("en-IN")})`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </BrandLayout>
  );
};

export default BrandTransactions;