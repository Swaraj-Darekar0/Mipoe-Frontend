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
import BrandLayout from "@/layouts/BrandLayout";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ArrowDownRight, ArrowUpRight, Download, MoreVertical, Wallet, TrendingUp, DollarSign, Clock, ArrowLeft } from "lucide-react";
import { getTransactions } from "@/lib/api";

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

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        // 2. DO NOT PARSE INT. Keep as string.
        const userId = localStorage.getItem("user_id"); 
        const role = localStorage.getItem("role");

        console.log("Fetching transactions for:", { userId, role, token: !!token });

        // Verify user is authenticated as brand
        if (!token || !userId || role !== "brand") {
          console.warn("Auth check failed:", { token: !!token, userId, role });
          navigate("/login");
          return;
        }

        // 3. Call API with string ID
        // @ts-ignore (Temporary ignore if api.ts hasn't updated types yet)
        const response = await getTransactions('brand', userId);
        console.log("Transactions response:", response);
        
        // Ensure we cast or validate the response matches our interface
        setTransactions(response.transactions as unknown as Transaction[] || []);
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

    if (token) {
      fetchTransactions();
    } else {
      console.warn("No token found, redirecting to login");
      navigate("/login");
    }
  }, [token, navigate, toast]);

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
        filtered = filtered.filter((t) => t.campaign_id === null || t.campaign_id === undefined);
      } else {
        // Parse the filter value to Int because campaign_id is a number
        filtered = filtered.filter((t) => t.campaign_id === parseInt(campaignFilter));
      }
    }

    setFilteredTransactions(filtered);
  }, [transactions, typeFilter, statusFilter, campaignFilter]);

  const stats = {
    totalAllocated: transactions
      .filter((t) => t.type === "allocation" && t.status === "success")
      .reduce((sum, t) => sum + t.amount, 0),
    totalDistributed: transactions
      .filter((t) => t.type === "distribution" && t.status === "success")
      .reduce((sum, t) => sum + t.amount, 0),
    totalRefunded: transactions
      .filter((t) => t.type === "refund" && t.status === "success")
      .reduce((sum, t) => sum + t.amount, 0),
    pending: transactions.filter((t) => t.status === "pending").length,
  };

  // 5. Fix Campaign Options Reduce
  const campaignOptions = transactions.reduce((acc, t) => {
    if (t.campaign_id && t.campaign && !acc.some(c => c.id === t.campaign_id)) {
      acc.push({ id: t.campaign_id, name: t.campaign.name });
    }
    return acc;
  }, [] as { id: number; name: string }[]);

  const hasNullCampaignId = transactions.some(t => !t.campaign_id);

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
    switch (status) {
      case "success":
        return <Badge variant="default" className="bg-green-500">Success</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      allocation: "bg-blue-100 text-blue-800",
      distribution: "bg-green-100 text-green-800",
      refund: "bg-orange-100 text-orange-800",
      deposit: "bg-purple-100 text-purple-800",
      reclaim: "bg-red-100 text-red-800",
    };
    return (
      <Badge className={colors[type] || "bg-gray-100 text-gray-800"}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
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
        t.campaign_id ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/brand/dashboard/${t.campaign_id}`)}
          >
            {t.campaign ? t.campaign.name : `Campaign ${t.campaign_id}`}
          </Button>
        ) : (
          <span className="text-gray-500">-</span>
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
    <BrandLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
            <p className="text-muted-foreground">
              Manage and track all your campaign payments and refunds
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/brand/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    {hasNullCampaignId && <SelectItem value="null-campaign">N/A</SelectItem>}
                    {campaignOptions.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id.toString()}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="gap-2"
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
      </div>
    </BrandLayout>
  );
};

export default BrandTransactions;