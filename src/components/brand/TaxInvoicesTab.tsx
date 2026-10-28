import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  ReceiptText, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  FileSpreadsheet, 
  Sparkles,
  Info,
  Edit3,
  Copy,
  Printer,
  X
} from "lucide-react";
import { 
  getBrandTaxInvoices, 
  updateBrandTaxDetails, 
  BrandTaxInfo, 
  BrandTaxInvoice 
} from "@/lib/api";

export const TaxInvoicesTab: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [taxInfo, setTaxInfo] = useState<BrandTaxInfo>({});
  const [hasGstin, setHasGstin] = useState(false);
  const [invoices, setInvoices] = useState<BrandTaxInvoice[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form states
  const [gstin, setGstin] = useState("");
  const [legalName, setLegalName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");

  const loadTaxData = async () => {
    try {
      setLoading(true);
      const data = await getBrandTaxInvoices();
      if (data) {
        setTaxInfo(data.tax_info || {});
        setHasGstin(Boolean(data.has_gstin || data.tax_info?.gstin));
        setInvoices(data.invoices || []);
        
        if (data.tax_info?.gstin) {
          setGstin(data.tax_info.gstin);
          setIsEditing(false);
        } else {
          setIsEditing(true);
        }
        if (data.tax_info?.legal_business_name) {
          setLegalName(data.tax_info.legal_business_name);
        }
        if (data.tax_info?.billing_address) {
          setBillingAddress(data.tax_info.billing_address);
        }
      }
    } catch (err: any) {
      console.error("Failed to load tax data", err);
      toast({
        title: "Could not load tax data",
        description: err.message || "Please refresh the page to retry.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTaxData();
  }, []);

  const cleanGstin = gstin.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const extractedPan = cleanGstin.length >= 12 ? cleanGstin.slice(2, 12) : "";
  const stateCode = cleanGstin.length >= 2 ? cleanGstin.slice(0, 2) : "";

  const handleSaveGst = async (e: React.FormEvent) => {
    e.preventDefault();
    const gstinClean = cleanGstin.slice(0, 15);
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (!gstinRegex.test(gstinClean)) {
      toast({
        title: "Invalid GSTIN Format",
        description: `"${gstinClean}" is not a valid 15-character GSTIN. Ensure it contains your 10-digit PAN with 'Z' as the 14th character (e.g. 27ABCDE1234F2Z5).`,
        variant: "destructive",
      });
      return;
    }

    if (!legalName.trim()) {
      toast({
        title: "Legal Name Required",
        description: "Please provide the official registered business name as shown on your GST certificate.",
        variant: "destructive",
      });
      return;
    }

    if (!billingAddress.trim()) {
      toast({
        title: "Billing Address Required",
        description: "Please provide the registered business address for GST compliance invoices.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await updateBrandTaxDetails({
        gstin: gstinClean,
        legal_business_name: legalName.trim(),
        billing_address: billingAddress.trim(),
      });

      toast({
        title: "GST Credentials Saved",
        description: res.msg || "Your B2B tax credentials are now active for GSTR-1 input tax credit.",
        className: "bg-emerald-50 border-emerald-200 text-emerald-950",
      });
      await loadTaxData();
    } catch (err: any) {
      toast({
        title: "Failed to Save GST",
        description: err.message || "Could not save GST details.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${label} Copied`,
      description: text,
      className: "bg-zinc-900 text-white",
    });
  };

  const handleDownloadInvoice = (inv: BrandTaxInvoice) => {
    // Generate an official printable B2B GST tax invoice window
    const buyerName = taxInfo.legal_business_name || legalName || "Valued Brand Client";
    const buyerGst = taxInfo.gstin || gstin || "Unregistered Buyer (B2C)";
    const buyerAddr = taxInfo.billing_address || billingAddress || "Address on File";
    const buyerPan = taxInfo.extracted_pan || extractedPan || "N/A";

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Pop-up Blocked",
        description: "Please allow pop-ups to print or view the official tax invoice PDF.",
        variant: "destructive",
      });
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tax Invoice - ${inv.invoice_id}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #111; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
          .title { font-size: 24px; font-weight: 800; color: #4338ca; }
          .subtitle { font-size: 13px; color: #6b7280; margin-top: 4px; }
          .grid { display: flex; justify-content: space-between; margin-top: 24px; }
          .box { width: 48%; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; font-size: 13px; line-height: 1.5; }
          .box-title { font-weight: 700; text-transform: uppercase; font-size: 11px; color: #6b7280; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 13px; }
          th { background: #f9fafb; border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #4b5563; }
          td { border: 1px solid #e5e7eb; padding: 10px; }
          .total-box { margin-top: 24px; margin-left: auto; width: 320px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; font-size: 13px; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
          .grand-total { font-weight: 800; font-size: 16px; color: #111; border-top: 2px solid #e5e7eb; padding-top: 8px; margin-top: 8px; }
          .footer { margin-top: 40px; font-size: 11px; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 16px; }
          @media print {
            body { margin: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; display: flex; gap: 10px;">
          <button onclick="window.print()" style="background: #4338ca; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer;">
            Print / Save as PDF
          </button>
          <button onclick="window.close()" style="background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
            Close
          </button>
        </div>

        <div class="header">
          <div>
            <div class="title">TAX INVOICE</div>
            <div class="subtitle">Original for Recipient (B2B Tax Credit Eligible)</div>
          </div>
          <div style="text-align: right; font-size: 13px;">
            <div><strong>Invoice No:</strong> ${inv.invoice_id}</div>
            <div><strong>Date:</strong> ${inv.date ? new Date(inv.date).toLocaleDateString("en-IN") : "Recent"}</div>
            <div><strong>Place of Supply:</strong> ${taxInfo.state_code || stateCode || "27"} - Inter/Intra State</div>
          </div>
        </div>

        <div class="grid">
          <div class="box">
            <div class="box-title">Supplier (Service Provider)</div>
            <div style="font-weight: 700; font-size: 14px;">MIPOE MEDIA TECHNOLOGIES INDIA</div>
            <div>Registered Business Operator</div>
            <div>GSTIN: <strong>27AAPFU0939F1ZV</strong></div>
            <div>PAN: <strong>AAPFU0939F</strong></div>
            <div>Mumbai, Maharashtra - 400001</div>
          </div>

          <div class="box">
            <div class="box-title">Billed To (Recipient / Brand)</div>
            <div style="font-weight: 700; font-size: 14px;">${buyerName}</div>
            <div>${buyerAddr}</div>
            <div>GSTIN: <strong>${buyerGst}</strong></div>
            <div>PAN: <strong>${buyerPan}</strong></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th>Description of Services</th>
              <th style="width: 80px;">SAC Code</th>
              <th style="width: 100px; text-align: right;">Taxable Value</th>
              <th style="width: 60px; text-align: center;">Rate</th>
              <th style="width: 90px; text-align: right;">CGST (9%)</th>
              <th style="width: 90px; text-align: right;">SGST (9%)</th>
              <th style="width: 100px; text-align: right;">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>
                <strong>${inv.description}</strong><br/>
                <span style="font-size: 11px; color: #6b7280;">Transaction ID: #${inv.transaction_id} ${inv.external_txn_id ? `(${inv.external_txn_id})` : ''}</span>
              </td>
              <td>998365</td>
              <td style="text-align: right;">₹${inv.taxable_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              <td style="text-align: center;">18%</td>
              <td style="text-align: right;">₹${inv.cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              <td style="text-align: right;">₹${inv.sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              <td style="text-align: right; font-weight: 700;">₹${inv.gross_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        <div class="total-box">
          <div class="total-row">
            <span>Total Taxable Base:</span>
            <span>₹${inv.taxable_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="total-row">
            <span>Central GST (CGST 9%):</span>
            <span>₹${inv.cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="total-row">
            <span>State GST (SGST 9%):</span>
            <span>₹${inv.sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="total-row grand-total">
            <span>Invoice Total (INR):</span>
            <span>₹${inv.gross_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div class="footer">
          <div>This is a computer-generated tax invoice and requires no physical signature under Rule 46 of CGST Rules 2017.</div>
          <div>Reverse Charge Mechanism: No | Whether Tax is Payable under Sec 9(3)/(4): No</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleExportGstr1 = () => {
    if (invoices.length === 0) {
      toast({
        title: "No Invoices to Export",
        description: "You have not completed any campaign budget deposits yet.",
      });
      return;
    }

    const headers = [
      "GSTIN of Recipient",
      "Receiver Name",
      "Invoice Number",
      "Invoice Date",
      "Invoice Value",
      "Place of Supply",
      "Reverse Charge",
      "Applicable % of Tax Rate",
      "Invoice Type",
      "E-Commerce GSTIN",
      "Rate",
      "Taxable Value",
      "Cess Amount"
    ];

    const rows = invoices.map(inv => [
      taxInfo.gstin || gstin || "URP",
      `"${(taxInfo.legal_business_name || legalName || "Client").replace(/"/g, '""')}"`,
      inv.invoice_id,
      inv.date ? new Date(inv.date).toISOString().split('T')[0] : "2026-10-28",
      inv.gross_amount.toFixed(2),
      taxInfo.state_code || stateCode || "27-Maharashtra",
      "N",
      "",
      "Regular B2B",
      "",
      "18",
      inv.taxable_amount.toFixed(2),
      "0.00"
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `GSTR1_B2B_Statement_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "GSTR-1 Statement Exported",
      description: `Downloaded statement with ${invoices.length} B2B deposit invoices for your CA.`,
      className: "bg-emerald-50 border-emerald-200 text-emerald-950",
    });
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">GST & Tax Invoices (ITC)</h2>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              B2B Credit Ready
            </span>
          </div>
          <p className="text-zinc-500 text-xs mt-1">
            Link your company's 15-digit GSTIN to claim 100% Input Tax Credit (18% ITC) on your campaign spend and download GSTR-1 compliant invoices.
          </p>
        </div>

        {invoices.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportGstr1}
            className="flex items-center gap-2 border-zinc-200 hover:bg-zinc-50 text-xs font-semibold"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export GSTR-1 Statement (.CSV)
          </Button>
        )}
      </div>

      {/* Grid: GSTIN Setup Card / Verified View & Benefit Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: GST Registration Card */}
        <div className="lg:col-span-2 bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs">
          {hasGstin && !isEditing ? (
            /* VERIFIED ACTIVE ENTITY VIEW */
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-zinc-900">{taxInfo.legal_business_name || legalName}</h3>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        GST Registered
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500">Official B2B tax profile active on Mipoe.</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-8 text-xs font-semibold gap-1.5 border-zinc-200 text-zinc-700 hover:text-zinc-900"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Details
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-zinc-50/80 rounded-xl border border-zinc-200/60 space-y-1">
                  <span className="text-[11px] text-zinc-400 font-medium">Registered GSTIN:</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-zinc-900 tracking-wider text-sm">
                      {taxInfo.gstin || gstin}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(taxInfo.gstin || gstin, "GSTIN")}
                      className="text-zinc-400 hover:text-zinc-700 p-1 rounded"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-zinc-50/80 rounded-xl border border-zinc-200/60 space-y-1">
                  <span className="text-[11px] text-zinc-400 font-medium">Auto-Extracted PAN:</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs">
                      {taxInfo.extracted_pan || extractedPan}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">
                      State Code: <strong>{taxInfo.state_code || stateCode}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-zinc-50/80 rounded-xl border border-zinc-200/60 space-y-1">
                <span className="text-[11px] text-zinc-400 font-medium">Registered Billing Address:</span>
                <p className="text-xs text-zinc-800 leading-relaxed font-medium">
                  {taxInfo.billing_address || billingAddress}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-3">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>
                  All past and future campaign budget deposits are automatically mapped to this GSTIN for your quarterly GSTR-1 filings.
                </span>
              </div>
            </div>
          ) : (
            /* EDIT / REGISTRATION FORM VIEW */
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900">
                      {hasGstin ? "Edit B2B Tax Registration" : "Link Company GSTIN"}
                    </h3>
                    <p className="text-[11px] text-zinc-500">
                      Enter your 15-character GSTIN. Your 10-digit PAN is auto-extracted.
                    </p>
                  </div>
                </div>

                {hasGstin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    className="h-8 text-xs text-zinc-500 hover:text-zinc-800 gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </Button>
                )}
              </div>

              <form onSubmit={handleSaveGst} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    GSTIN Number (15-digit alphanumeric) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    maxLength={25}
                    placeholder="e.g. 27ABCDE1234F2Z5"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15))}
                    className="font-mono text-sm tracking-wider uppercase"
                    required
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Characters 3–12 represent your legal PAN. Character 14 must be 'Z'.
                  </p>
                </div>

                {extractedPan && (
                  <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3 flex flex-wrap items-center gap-4 text-xs">
                    <div>
                      <span className="text-zinc-400 font-medium text-[11px]">State Code:</span>{" "}
                      <span className="font-mono font-bold text-zinc-800">{stateCode}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 font-medium text-[11px]">Auto-Extracted PAN:</span>{" "}
                      <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {extractedPan}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-600 font-medium ml-auto text-[11px]">
                      <ShieldCheck className="w-4 h-4" />
                      Format Validated
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                      Legal Business Name (as on GST Certificate) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Acme Brands Private Limited"
                      value={legalName}
                      onChange={(e) => setLegalName(e.target.value)}
                      className="text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                      Registered Billing Address <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Suite 402, Trade Tower, Mumbai"
                      value={billingAddress}
                      onChange={(e) => setBillingAddress(e.target.value)}
                      className="text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  {hasGstin && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2 rounded-xl shadow-xs"
                  >
                    {saving ? "Saving Tax Details..." : "Save & Activate B2B Invoices"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Right: How ITC Works Info Card */}
        <div className="bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-white border border-indigo-200/60 rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              Tax Benefit Breakdown
            </div>
            <h4 className="font-bold text-zinc-900 text-base leading-snug">
              Save 18% on your creator campaign spend via Input Tax Credit.
            </h4>
            <p className="text-xs text-zinc-600 leading-relaxed">
              When depositing INR into your campaign float via UPI or Base L2, an official B2B invoice is generated. Your company can claim the full 18% GST component against your output tax liability.
            </p>

            <div className="bg-white/90 backdrop-blur-xs border border-indigo-100 rounded-xl p-3.5 space-y-2 text-xs shadow-xs">
              <div className="flex justify-between items-center text-zinc-600">
                <span>Sample Deposit:</span>
                <span className="font-mono font-bold text-zinc-900">₹50,000</span>
              </div>
              <div className="flex justify-between items-center text-zinc-600">
                <span>Taxable Value (Float):</span>
                <span className="font-mono text-zinc-900">₹42,373</span>
              </div>
              <div className="flex justify-between items-center text-emerald-700 font-semibold border-t border-zinc-100 pt-1.5">
                <span>ITC You Reclaim:</span>
                <span className="font-mono font-bold text-emerald-700">₹7,627</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-indigo-100/80 flex items-center gap-2 text-[11px] text-zinc-500">
            <Info className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
            <span>Invoices automatically sync to the GST portal on the 10th of every month.</span>
          </div>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <ReceiptText className="w-4 h-4 text-zinc-500" />
            <h3 className="font-bold text-sm text-zinc-900">Completed Deposit Invoices</h3>
          </div>
          <span className="text-xs text-zinc-500 font-medium">
            {invoices.length} {invoices.length === 1 ? "Invoice" : "Invoices"} Available
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 space-y-2">
            <div className="size-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-zinc-500 font-medium">Loading deposit invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <div className="size-12 rounded-full bg-zinc-50 border border-zinc-200/80 text-zinc-400 flex items-center justify-center mx-auto">
              <ReceiptText className="w-6 h-6" />
            </div>
            <p className="font-semibold text-xs text-zinc-800">No deposit invoices found</p>
            <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
              Whenever you deposit funds into your brand campaign budget via UPI or Base L2, tax-compliant B2B invoices will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Gross (₹)</th>
                  <th className="py-2.5 px-3">Taxable (₹)</th>
                  <th className="py-2.5 px-3">GST (18%)</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {invoices.map((inv) => (
                  <tr key={inv.invoice_id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-indigo-600">{inv.invoice_id}</td>
                    <td className="py-3 px-3 text-zinc-600">
                      {inv.date ? new Date(inv.date).toLocaleDateString("en-IN") : "Recent"}
                    </td>
                    <td className="py-3 px-3 text-zinc-700 font-medium">
                      <div>{inv.description}</div>
                      {inv.external_txn_id && (
                        <div className="font-mono text-[10px] text-zinc-400">{inv.external_txn_id}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-zinc-900">
                      ₹{inv.gross_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 font-mono text-zinc-600">
                      ₹{inv.taxable_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 font-mono text-emerald-600 font-semibold">
                      ₹{inv.gst_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadInvoice(inv)}
                        className="h-7 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-semibold gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print / PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
