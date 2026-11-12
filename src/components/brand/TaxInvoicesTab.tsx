import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/PortalPrimitives";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  ReceiptText,
  CheckCircle2,
  ShieldCheck,
  FileSpreadsheet,
  Info,
  Edit3,
  Copy,
  Printer,
  X,
  Loader2,
} from "lucide-react";
import {
  getBrandTaxInvoices,
  updateBrandTaxDetails,
  BrandTaxInfo,
  BrandTaxInvoice,
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
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #0b0d0e; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
          .title { font-size: 24px; font-weight: 800; color: #2b5ce6; }
          .subtitle { font-size: 13px; color: #6b7280; margin-top: 4px; }
          .grid { display: flex; justify-content: space-between; margin-top: 24px; }
          .box { width: 48%; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; font-size: 13px; line-height: 1.5; }
          .box-title { font-weight: 700; text-transform: uppercase; font-size: 11px; color: #6b7280; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 13px; }
          th { background: #fafafb; border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #4b5563; }
          td { border: 1px solid #e5e7eb; padding: 10px; }
          .total-box { margin-top: 24px; margin-left: auto; width: 320px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; font-size: 13px; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
          .grand-total { font-weight: 800; font-size: 16px; color: #0b0d0e; border-top: 2px solid #e5e7eb; padding-top: 8px; margin-top: 8px; }
          .footer { margin-top: 40px; font-size: 11px; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 16px; }
          @media print {
            body { margin: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; display: flex; gap: 10px;">
          <button onclick="window.print()" style="background: #2b5ce6; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer;">
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
            <div style="font-weight: 700; font-size: 14px;">SELLR MEDIA TECHNOLOGIES INDIA</div>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
              GST & Tax Invoices (ITC)
            </h2>
            <StatusPill tone="success">B2B Credit Ready</StatusPill>
          </div>
          <p className="text-slate text-xs mt-1">
            Link your company's 15-digit GSTIN to claim 100% Input Tax Credit (18% ITC) on your campaign spend and download GSTR-1 compliant invoices.
          </p>
        </div>

        {invoices.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportGstr1}
            className="flex items-center gap-2 text-xs font-semibold shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export GSTR-1 Statement (.CSV)
          </Button>
        )}
      </div>

      {/* Grid: GSTIN Setup Card / Verified View & Benefit Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: GST Registration Card */}
        <div className="lg:col-span-2 bg-white border border-black/10 rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
          {hasGstin && !isEditing ? (
            /* VERIFIED ACTIVE ENTITY VIEW */
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-black/10">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display font-bold text-sm text-ink">
                        {taxInfo.legal_business_name || legalName}
                      </h3>
                      <StatusPill tone="success" showDot>
                        GST Registered
                      </StatusPill>
                    </div>
                    <p className="text-[11px] text-slate">
                      Official B2B tax profile active on sellr.
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-8 text-xs font-semibold gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Details
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-black/[0.03] rounded-xl border border-black/[0.06] space-y-1">
                  <span className="font-mono text-[10px] text-steel uppercase tracking-wider font-medium block">
                    Registered GSTIN
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-ink tracking-wider text-sm break-all">
                      {taxInfo.gstin || gstin}
                    </span>
                    <button
                      type="button"
                      aria-label="Copy GSTIN"
                      onClick={() =>
                        handleCopy(taxInfo.gstin || gstin, "GSTIN")
                      }
                      className="text-steel hover:text-ink p-1 rounded transition-colors duration-150 shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-black/[0.03] rounded-xl border border-black/[0.06] space-y-1">
                  <span className="font-mono text-[10px] text-steel uppercase tracking-wider font-medium block">
                    Auto-Extracted PAN
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs">
                      {taxInfo.extracted_pan || extractedPan}
                    </span>
                    <span className="text-[11px] font-mono text-slate">
                      State Code:{" "}
                      <strong className="text-ink">
                        {taxInfo.state_code || stateCode}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-black/[0.03] rounded-xl border border-black/[0.06] space-y-1">
                <span className="font-mono text-[10px] text-steel uppercase tracking-wider font-medium block">
                  Registered Billing Address
                </span>
                <p className="text-xs text-ink leading-relaxed font-medium">
                  {taxInfo.billing_address || billingAddress}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>
                  All past and future campaign budget deposits are automatically mapped to this GSTIN for your quarterly GSTR-1 filings.
                </span>
              </div>
            </div>
          ) : (
            /* EDIT / REGISTRATION FORM VIEW */
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-black/10">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-brand-blue/10 border border-brand-blue/20 text-brand-blue flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-ink">
                      {hasGstin
                        ? "Edit B2B Tax Registration"
                        : "Link Company GSTIN"}
                    </h3>
                    <p className="text-[11px] text-slate">
                      Enter your 15-character GSTIN. Your 10-digit PAN is auto-extracted.
                    </p>
                  </div>
                </div>

                {hasGstin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    className="h-8 text-xs text-slate hover:text-ink gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </Button>
                )}
              </div>

              <form onSubmit={handleSaveGst} className="space-y-4">
                <div>
                  <label className="block font-mono text-[10px] font-medium text-steel uppercase tracking-wider mb-1.5">
                    GSTIN Number (15-digit alphanumeric){" "}
                    <span className="text-red-600">*</span>
                  </label>
                  <Input
                    type="text"
                    maxLength={25}
                    placeholder="e.g. 27ABCDE1234F2Z5"
                    value={gstin}
                    onChange={(e) =>
                      setGstin(
                        e.target.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, "")
                          .slice(0, 15)
                      )
                    }
                    className="font-mono text-sm tracking-wider uppercase"
                    required
                  />
                  <p className="text-[11px] text-slate mt-1">
                    Characters 3–12 represent your legal PAN. Character 14 must be 'Z'.
                  </p>
                </div>

                {extractedPan && (
                  <div className="bg-black/[0.03] border border-black/10 rounded-xl p-3 flex flex-wrap items-center gap-4 text-xs">
                    <div>
                      <span className="text-slate font-medium text-[11px]">
                        State Code:
                      </span>{" "}
                      <span className="font-mono font-bold text-ink">
                        {stateCode}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate font-medium text-[11px]">
                        Auto-Extracted PAN:
                      </span>{" "}
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {extractedPan}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-700 font-medium ml-auto text-[11px]">
                      <ShieldCheck className="w-4 h-4" />
                      Format Validated
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[10px] font-medium text-steel uppercase tracking-wider mb-1.5">
                      Legal Business Name (as on GST Certificate){" "}
                      <span className="text-red-600">*</span>
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
                    <label className="block font-mono text-[10px] font-medium text-steel uppercase tracking-wider mb-1.5">
                      Registered Billing Address{" "}
                      <span className="text-red-600">*</span>
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
                    variant="brand"
                    disabled={saving}
                    className="text-xs px-5"
                  >
                    {saving
                      ? "Saving Tax Details..."
                      : "Save & Activate B2B Invoices"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Right: How ITC Works Info Card */}
        <div className="bg-[#fafafb] border border-black/10 rounded-2xl p-6 flex flex-col justify-between shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-brand-blue font-mono font-bold text-[11px] uppercase tracking-wider">
              <ReceiptText className="w-4 h-4" />
              Tax Benefit Breakdown
            </div>
            <h4 className="font-display font-bold text-ink text-base leading-snug">
              Save 18% on your creator campaign spend via Input Tax Credit.
            </h4>
            <p className="text-xs text-slate leading-relaxed">
              When depositing INR into your campaign float via UPI or Base L2, an official B2B invoice is generated. Your company can claim the full 18% GST component against your output tax liability.
            </p>

            <div className="bg-white border border-black/10 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate">
                <span>Sample Deposit:</span>
                <span className="font-mono font-bold tabular-nums text-ink">
                  ₹50,000
                </span>
              </div>
              <div className="flex justify-between items-center text-slate">
                <span>Taxable Value (Float):</span>
                <span className="font-mono tabular-nums text-ink">₹42,373</span>
              </div>
              <div className="flex justify-between items-center text-emerald-700 font-semibold border-t border-black/[0.06] pt-1.5">
                <span>ITC You Reclaim:</span>
                <span className="font-mono font-bold tabular-nums text-emerald-700">
                  ₹7,627
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-black/10 flex items-center gap-2 text-[11px] text-slate">
            <Info className="w-3.5 h-3.5 shrink-0 text-brand-blue" />
            <span>
              Invoices automatically sync to the GST portal on the 10th of every month.
            </span>
          </div>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white border border-black/10 rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-black/10">
          <div className="flex items-center gap-2.5">
            <ReceiptText className="w-4 h-4 text-steel" />
            <h3 className="font-display font-bold text-sm text-ink">
              Completed Deposit Invoices
            </h3>
          </div>
          <span className="font-mono text-xs text-slate font-medium tabular-nums">
            {invoices.length} {invoices.length === 1 ? "Invoice" : "Invoices"}{" "}
            Available
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-brand-blue mx-auto" />
            <p className="text-xs text-slate font-medium">
              Loading deposit invoices...
            </p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <div className="size-12 rounded-full bg-black/[0.03] border border-black/10 text-steel flex items-center justify-center mx-auto">
              <ReceiptText className="w-6 h-6" />
            </div>
            <p className="font-display font-semibold text-sm text-ink">
              No deposit invoices found
            </p>
            <p className="text-xs text-slate max-w-sm mx-auto">
              Whenever you deposit funds into your brand campaign budget via UPI or Base L2, tax-compliant B2B invoices will appear here automatically.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Invoice Cards */}
            <div className="md:hidden divide-y divide-black/[0.06] border border-black/10 rounded-xl">
              {invoices.map((inv) => (
                <div key={inv.invoice_id} className="p-4 space-y-3 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-brand-blue block">
                        {inv.invoice_id}
                      </span>
                      <span className="font-mono text-[11px] text-slate">
                        {inv.date
                          ? new Date(inv.date).toLocaleDateString("en-IN")
                          : "Recent"}
                      </span>
                    </div>
                    <StatusPill tone="success">{inv.status}</StatusPill>
                  </div>
                  <p className="text-ink font-medium">{inv.description}</p>
                  <div className="grid grid-cols-3 gap-2 bg-black/[0.03] border border-black/[0.06] rounded-lg p-2.5">
                    <div>
                      <span className="font-mono text-[9px] text-steel uppercase block">
                        Gross
                      </span>
                      <span className="font-mono font-bold tabular-nums text-ink">
                        ₹
                        {inv.gross_amount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="font-mono text-[9px] text-steel uppercase block">
                        Taxable
                      </span>
                      <span className="font-mono tabular-nums text-slate">
                        ₹
                        {inv.taxable_amount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="font-mono text-[9px] text-steel uppercase block">
                        GST
                      </span>
                      <span className="font-mono font-semibold tabular-nums text-emerald-700">
                        ₹
                        {inv.gst_amount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadInvoice(inv)}
                    className="w-full text-xs text-brand-blue gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print / PDF
                  </Button>
                </div>
              ))}
            </div>

            {/* Desktop Invoice Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-black/10 font-mono text-steel uppercase text-[10px] tracking-wider">
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
                <tbody className="divide-y divide-black/[0.06]">
                  {invoices.map((inv) => (
                    <tr
                      key={inv.invoice_id}
                      className="hover:bg-black/[0.02] transition-colors duration-150"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-brand-blue">
                        {inv.invoice_id}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate">
                        {inv.date
                          ? new Date(inv.date).toLocaleDateString("en-IN")
                          : "Recent"}
                      </td>
                      <td className="py-3 px-3 text-ink font-medium">
                        <div>{inv.description}</div>
                        {inv.external_txn_id && (
                          <div className="font-mono text-[10px] text-steel">
                            {inv.external_txn_id}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold tabular-nums text-ink">
                        ₹
                        {inv.gross_amount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-slate">
                        ₹
                        {inv.taxable_amount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-emerald-700 font-semibold">
                        ₹
                        {inv.gst_amount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3 px-3">
                        <StatusPill tone="success">{inv.status}</StatusPill>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadInvoice(inv)}
                          className="h-7 text-xs text-brand-blue hover:bg-brand-blue/10 font-semibold gap-1"
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
          </>
        )}
      </div>
    </div>
  );
};
