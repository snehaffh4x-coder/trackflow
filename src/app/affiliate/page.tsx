"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Package, LogOut, Download, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

interface Lead {
  id: string;
  tracking_number: string;
  courier_name: string;
  full_name: string;
  mobile_number: string;
  status: string;
  created_at: string;
}

export default function AffiliateDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/affiliate/leads");
      const data = await res.json();
      
      if (res.status === 401 || !data.ok) {
        toast.error("Session expired or unauthorized");
        router.push("/admin");
        return;
      }
      
      setLeads(data.leads);
    } catch (err) {
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" })
      });
    } catch (e) {}
    router.push("/admin");
  };

  const handleExportCSV = () => {
    if (leads.length === 0) return toast.error("No leads to export");
    const headers = ["Tracking Number", "Courier", "Full Name", "Mobile Number", "Status", "Created At"];
    const rows = leads.map(l => [
      l.tracking_number,
      l.courier_name,
      l.full_name || "",
      l.mobile_number || "",
      l.status,
      l.created_at
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `my_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#060913] text-white font-sans selection:bg-purple-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-xl flex items-center justify-center font-bold text-lg shadow-md shadow-purple-500/20">
            TF
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight flex items-center gap-2">
              Affiliate Dashboard
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                PARTNER
              </span>
            </h1>
            <p className="text-xs text-gray-400">Track your generated leads securely.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-2 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto p-6 space-y-8 mt-6">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
          {/* Glowing element behind the card */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="relative z-10">
            <h3 className="font-bold text-xl flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" /> 
              My Leads ({leads.length})
            </h3>
            <p className="text-sm text-gray-400 mt-1">Below are all the tracking numbers logged via your affiliate link.</p>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-black/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs font-bold uppercase tracking-wider text-gray-400 bg-white/[0.02]">
                  <th className="p-5">Tracking Number</th>
                  <th className="p-5">Courier</th>
                  <th className="p-5">Customer Details</th>
                  <th className="p-5">Status</th>
                  <th className="p-5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-500">
                      Loading leads...
                    </td>
                  </tr>
                ) : leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-5 font-mono font-bold text-white">{lead.tracking_number}</td>
                    <td className="p-5 uppercase text-xs font-semibold text-purple-300">{lead.courier_name}</td>
                    <td className="p-5">
                      <div className="font-semibold text-white">{lead.full_name || "N/A"}</div>
                      <div className="text-xs text-gray-400">{lead.mobile_number || "No mobile"}</div>
                    </td>
                    <td className="p-5">
                      <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-bold">
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-5 text-xs text-gray-400">
                      {new Date(lead.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {!loading && leads.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-500">
                      You haven't generated any leads yet. Share your affiliate link to get started!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
