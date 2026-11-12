import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowDownRight, ArrowUpRight, Download, MoreVertical, Wallet, DollarSign, Loader2, ArrowLeft, ShieldCheck, Building2, QrCode } from "lucide-react";
import { getTransactions, getUserId, getRole, getBrandRefundableSummary, brandWithdrawFunds, BrandRefundableSummary } from "@/lib/api";
import { PortalPageHeader, MetricCell, StatusPill } from "@/components/ui/PortalPrimitives";

interface Transaction {
  id: number;
  user_type: string;
  user_id: string;
  campaign_id?: number;
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
      if (!userId || role !== "brand") {
        navigate("/login");
        return;
      }

      // @ts-ignore
      const response = await getTransactions('brand', userId);
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

    if (campaignFilter !== "all") {
      if (campaignFilter === "null-campaign") {
        filtered = filtered.filter(isDeletedCampaignTransaction);
      } else {
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
        return <ArrowDownRight className="w-4 h-4 text-brand-blue" />;
      case "distribution":
        return <ArrowUpRight className="w-4 h-4 text-emerald-700" />;
      case "refund":
        return <ArrowDownRight className="w-4 h-4 text-amber-700" />;
      case "deposit":
        return <ArrowDownRight className="w-4 h-4 text-brand-blue" />;
      case "withdrawal":
        return <ArrowUpRight className="w-4 h-4 text-rose-700" />;
      default:
        return <DollarSign className="w-4 h-4 text-steel" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "success":
        return <StatusPill tone="success" showDot>Success</StatusPill>;
      case "pending":
        return <StatusPill tone="warning" showDot>Pending</StatusPill>;
      case "failed":
        return <StatusPill tone="danger">Failed</StatusPill>;
      case "cancelled":
        return <StatusPill tone="neutral">Cancelled</StatusPill>;
      default:
        return <StatusPill tone="neutral">{status}</StatusPill>;
    }
  };

  const getTypeBadge = (type: string) => {
    const toneMap: Record<string, "brand" | "success" | "creator" | "danger" | "warning" | "neutral"> = {
      allocation: "brand",
      distribution: "success",
      refund: "creator",
      deposit: "brand",
      withdrawal: "danger",
      reclaim: "warning",
    };
    const label = type === "campaign_funding" ? "Allocation" : type.charAt(0).toUpperCase() + type.slice(1);
    return <StatusPill tone={toneMap[type] || "neutral"}>{label}</StatusPill>;
  };

  const getColumnsForType = (type: string, navigateFn: ReturnType<typeof useNavigate>): Column[] => {
    const commonColumns: Column[] = [
      {
        header: "Date",
        accessor: (t) => <span className="font-mono text-xs text-slate">{new Date(t.created_at).toLocaleDateString("en-IN")}</span>,
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
        accessor: (t) => (
          <span className="font-mono font-bold tabular-nums text-ink">
            ₹{t.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        header: "Status",
        accessor: (t) => getStatusBadge(t.status),
      },
      {
        header: "Description",
        accessor: (t) => <span className="text-slate text-xs">{t.description || '-'}</span>,
      },
    ];
  
    const campaignColumn: Column = {
      header: "Campaign",
      accessor: (t) =>
        t.campaign_id && t.campaign ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateFn(`/brand/dashboard/${t.campaign_id}`)}
            className="text-brand-blue hover:bg-brand-blue/5 font-semibold"
          >
            {t.campaign.name}
          </Button>
        ) : (
          <span className="text-steel font-medium text-xs">
            {["allocation", "refund", "distribution"].includes(t.type) || t.campaign_id
              ? "N/A (Deleted Campaign)"
              : "-"}
          </span>
        ),
    };
  
    const creatorColumn: Column = {
      header: "Creator",
      accessor: (t) => t.creator?.username || (t.user_id ? "User" : "-"),
    };
  
    const externalIdColumn: Column = {
      header: "Ext. ID",
      accessor: (t) => <span className="font-mono text-xs text-steel">{t.external_txn_id ? t.external_txn_id.slice(0, 8) + "..." : "-"}</span>,
    };

    const actionsColumn: Column = {
      header: "Actions",
      accessor: () => (
        <Button variant="ghost" size="sm">
          <MoreVertical className="w-4 h-4 text-steel" />
        </Button>
      ),
    };
  
    switch (type) {
      case "deposit":
      case "reclaim":
      case "withdrawal":
        return [
          commonColumns[0],
          commonColumns[1],
          commonColumns[2],
          commonColumns[3],
          commonColumns[4],
          externalIdColumn,
          actionsColumn,
        ];
      case "allocation":
      case "refund":
        return [
          commonColumns[0],
          commonColumns[1],
          campaignColumn,
          commonColumns[2],
          commonColumns[3],
          commonColumns[4],
          actionsColumn,
        ];
      case "distribution":
        return [
          commonColumns[0],
          commonColumns[1],
          creatorColumn,
          campaignColumn,
          commonColumns[2],
          commonColumns[3],
          actionsColumn,
        ];
      default:
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
        <PortalPageHeader
          eyebrow="02 // TREASURY LEDGER"
          title="Transaction"
          highlighted="History"
          accent="brand"
          subtitle="Manage and track all your campaign payments, allocations, and capital refunds."
          action={
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Button
                variant="brand"
                size="sm"
                onClick={openRefundModal}
                className="gap-2 flex-1 sm:flex-initial"
              >
                <ArrowUpRight className="w-4 h-4" />
                Refund / Withdraw Funds
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/brand/dashboard")}
                className="gap-2 flex-1 sm:flex-initial"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </div>
          }
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCell
            label="Total Allocated"
            value={`₹${stats.totalAllocated.toLocaleString("en-IN")}`}
            sublabel="Budget allocated to campaigns"
            valueClassName="text-brand-blue"
          />
          <MetricCell
            label="Total Distributed"
            value={`₹${stats.totalDistributed.toLocaleString("en-IN")}`}
            sublabel="Paid out to creators"
            valueClassName="text-emerald-700"
          />
          <MetricCell
            label="Total Refunded"
            value={`₹${stats.totalRefunded.toLocaleString("en-IN")}`}
            sublabel="Capital refunds issued"
          />
          <MetricCell
            label="Pending"
            value={stats.pending}
            sublabel="Pending settlements"
            valueClassName="text-amber-700"
          />
        </div>

        {/* Filters */}
        <Card className="border-black/10 bg-white">
          <CardHeader>
            <CardTitle className="font-display text-ink text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-mono text-[10px] font-bold uppercase tracking-widest text-steel mb-2">
                  Transaction Type
                </label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="reclaim">Reclaim</SelectItem>
                    <SelectItem value="allocation">Allocation</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                    <SelectItem value="distribution">Distribution</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block font-mono text-[10px] font-bold uppercase tracking-widest text-steel mb-2">
                  Status
                </label>
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
                <label className="block font-mono text-[10px] font-bold uppercase tracking-widest text-steel mb-2">
                  Campaign
                </label>
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
        <Card className="border-black/10 bg-white">
          <CardHeader>
            <CardTitle className="font-display text-ink text-base">Transaction History</CardTitle>
            <CardDescription className="text-slate text-xs">
              {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""} found for type: {typeFilter}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
                <span className="text-xs font-medium">Loading transactions...</span>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-slate text-sm">
                No transactions found
              </div>
            ) : (
              <>
                {/* Mobile Cards */}
                <div className="space-y-3 sm:hidden">
                  {filteredTransactions.map((t) => (
                    <div key={t.id} className="bg-black/[0.02] border border-black/10 rounded-xl p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          {getTypeIcon(t.type)}
                          {getTypeBadge(t.type)}
                        </div>
                        <span className="font-mono font-bold tabular-nums text-sm text-ink shrink-0">
                          ₹{t.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      {t.description && (
                        <p className="text-xs text-slate break-words">{t.description}</p>
                      )}
                      {t.campaign?.name && (
                        <button
                          type="button"
                          onClick={() => t.campaign_id && navigate(`/brand/dashboard/${t.campaign_id}`)}
                          className="text-xs text-brand-blue font-semibold hover:underline block text-left"
                        >
                          {t.campaign.name}
                        </button>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-black/5">
                        <span className="font-mono text-[11px] text-steel">
                          {new Date(t.created_at).toLocaleDateString("en-IN")}
                        </span>
                        {getStatusBadge(t.status)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block rounded-xl border border-black/10 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-black/[0.02] hover:bg-black/[0.02]">
                        {columns.map((col) => (
                          <TableHead
                            key={col.header}
                            className={`font-mono text-[10px] font-bold uppercase tracking-widest text-steel ${
                              col.header === "Amount" ? "text-right" : ""
                            }`}
                          >
                            {col.header}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id} className="hover:bg-black/[0.02]">
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
              </>
            )}
          </CardContent>
        </Card>

        {/* Brand Unspent Budget Refund Modal */}
        <Dialog open={isRefundModalOpen} onOpenChange={setIsRefundModalOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <div className="flex flex-wrap items-center justify-between gap-2 pr-4">
                <DialogTitle className="font-display text-lg font-bold flex items-center gap-2 text-ink">
                  <Wallet className="w-5 h-5 text-brand-blue" />
                  Withdraw Unspent Funds
                </DialogTitle>
                <StatusPill tone="success">0% TDS (Capital Return)</StatusPill>
              </div>
              <DialogDescription className="text-xs text-slate pt-1">
                Transfer unallocated funds from your brand wallet back to your verified Indian bank account or corporate UPI ID.
              </DialogDescription>
            </DialogHeader>

            {loadingSummary ? (
              <div className="py-8 text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-brand-blue mx-auto" />
                <p className="text-xs text-slate">Calculating locked campaign allocations...</p>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                <div className="bg-black/[0.02] border border-black/10 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate">Total Wallet Balance:</span>
                    <span className="font-mono font-semibold text-ink tabular-nums">
                      ₹{(refundableSummary?.wallet_balance || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate">
                      Locked in Active Campaigns ({refundableSummary?.active_campaign_count || 0}):
                    </span>
                    <span className="font-mono font-semibold text-amber-700 tabular-nums">
                      -₹{(refundableSummary?.active_campaign_locks || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-black/10 flex items-center justify-between text-sm font-bold">
                    <span className="text-ink">Max Refundable Now:</span>
                    <span className="text-brand-blue font-mono text-base tabular-nums">
                      ₹{(refundableSummary?.max_refundable_amount || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="refund-amount" className="text-xs font-semibold text-ink">
                      Refund Amount (INR)
                    </Label>
                    {refundableSummary && refundableSummary.max_refundable_amount > 0 && (
                      <button
                        type="button"
                        onClick={() => setRefundAmount(refundableSummary.max_refundable_amount.toString())}
                        className="text-[11px] font-mono font-semibold text-brand-blue hover:underline cursor-pointer"
                      >
                        Max (₹{refundableSummary.max_refundable_amount.toLocaleString("en-IN")})
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-steel font-mono font-bold text-base">₹</span>
                    <Input
                      id="refund-amount"
                      type="number"
                      min="1"
                      max={refundableSummary?.max_refundable_amount || undefined}
                      placeholder="e.g. 5000"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="pl-8 font-mono font-semibold tabular-nums"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-ink">Disbursement Rail</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRefundPayoutMethod("upi")}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors duration-150 cursor-pointer ${
                        refundPayoutMethod === "upi"
                          ? "border-brand-blue bg-brand-blue/10 text-brand-blue"
                          : "border-black/10 hover:bg-black/[0.02] text-slate"
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Instant UPI
                    </button>
                    <button
                      type="button"
                      onClick={() => setRefundPayoutMethod("bank")}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors duration-150 cursor-pointer ${
                        refundPayoutMethod === "bank"
                          ? "border-brand-blue bg-brand-blue/10 text-brand-blue"
                          : "border-black/10 hover:bg-black/[0.02] text-slate"
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      Bank IMPS / NEFT
                    </button>
                  </div>
                </div>

                {refundPayoutMethod === "upi" ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="refund-upi" className="text-xs font-semibold text-ink">
                      Corporate / Business UPI ID
                    </Label>
                    <Input
                      id="refund-upi"
                      placeholder="company@hdfcbank"
                      value={refundUpiId}
                      onChange={(e) => setRefundUpiId(e.target.value)}
                      className="font-mono text-xs"
                    />
                    <p className="text-[11px] text-slate">
                      Funds will be instantly dispatched to this VPA via domestic banking rails.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="refund-holder" className="text-xs font-semibold text-ink">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1.5">
                        <Label htmlFor="refund-acc" className="text-xs font-semibold text-ink">
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
                        <Label htmlFor="refund-ifsc" className="text-xs font-semibold text-ink">
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

                <div className="p-3 bg-emerald-50 border border-emerald-500/25 rounded-xl space-y-1">
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

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRefundModalOpen(false)}
                disabled={submittingRefund}
              >
                Cancel
              </Button>
              <Button
                variant="brand"
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