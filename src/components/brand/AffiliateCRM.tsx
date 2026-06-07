import React, { useEffect, useState } from "react";
import { getBrandConversions } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  IndianRupee, 
  TrendingUp, 
  Calendar, 
  Globe, 
  ShoppingBag, 
  HelpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Database
} from "lucide-react";

export const AffiliateCRM: React.FC = () => {
  const { toast } = useToast();
  const [conversions, setConversions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConversions = async () => {
    try {
      const data = await getBrandConversions();
      setConversions(data);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to load conversions history.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversions();
  }, []);

  const totalSales = conversions
    .filter(c => c.status === "completed")
    .reduce((sum, c) => sum + floatVal(c.order_amount), 0);

  const totalCommissions = conversions
    .filter(c => c.status === "completed")
    .reduce((sum, c) => sum + floatVal(c.commission_amount), 0);

  const uniquePartners = new Set(
    conversions.filter(c => c.creator_id).map(c => c.creator_id)
  ).size;

  function floatVal(val: any) {
    const f = parseFloat(val);
    return isNaN(f) ? 0.0 : f;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex items-center gap-4">
          <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Active Partners</span>
            <span className="text-xl font-black text-gray-800 block mt-0.5">{uniquePartners} Creator(s)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Referral Sales</span>
            <span className="text-xl font-black text-gray-800 block mt-0.5">₹{totalSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Commissions Paid</span>
            <span className="text-xl font-black text-gray-800 block mt-0.5">₹{totalCommissions.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </div>
        </div>
      </div>

      {/* Conversion Logs */}
      <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 text-base">Affiliate Relationship Manager (CRM)</h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <Clock className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
            <p className="font-semibold text-xs">Loading relationship records...</p>
          </div>
        ) : conversions.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Users className="w-12 h-12 mx-auto text-gray-200 mb-3" />
            <p className="font-bold text-gray-700 text-sm">No conversions logged yet</p>
            <p className="text-xs text-gray-400 mt-1">Conversions appear automatically as your integration endpoints receive referral orders.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-150 text-left">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-150 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Referrer Creator</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Order Reference</th>
                  <th className="px-6 py-4">Sales Amount</th>
                  <th className="px-6 py-4">Commission</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white text-xs text-gray-700">
                {conversions.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-bold text-gray-900">{c.creator_name}</td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 font-semibold capitalize text-gray-600">
                        {c.event_source === "shopify" && <ShoppingBag className="w-3.5 h-3.5 text-green-600" />}
                        {c.event_source === "custom" && <Globe className="w-3.5 h-3.5 text-blue-600" />}
                        {c.event_source === "cashfree" && <Database className="w-3.5 h-3.5 text-indigo-600" />}
                        {c.event_source}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-gray-500" title={c.product_name}>
                      {c.order_id}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800">
                      ₹{floatVal(c.order_amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-indigo-650">
                      ₹{floatVal(c.commission_amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {c.status === "completed" ? (
                        <span className="inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          Success
                        </span>
                      ) : c.status === "insufficient_budget" ? (
                        <span 
                          className="inline-flex items-center gap-1 bg-red-50 border border-red-200 text-red-700 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider cursor-help"
                          title="This referral occurred but the campaign's pre-allocated budget was exhausted. Crediting was skipped."
                        >
                          <XCircle className="w-3 h-3 text-red-500" />
                          No Budget
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                          {c.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-400 font-medium whitespace-nowrap">
                      {c.timestamp ? new Date(c.timestamp).toLocaleString() : "—"}
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
