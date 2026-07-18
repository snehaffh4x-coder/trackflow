"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Users,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Ban,
  RotateCcw,
  Trash2,
  Search,
  Download,
  RefreshCw,
  TrendingUp,
  Activity,
  Package,
  Lock,
  ExternalLink,
  AlertTriangle,
  FileText
} from "lucide-react";

interface Affiliate {
  id: string;
  chat_id: string;
  affiliate_id: string;
  telegram_username?: string;
  is_active: boolean;
  is_banned?: boolean;
  ban_reason?: string;
  created_at: string;
  leadsCount?: number;
}

interface Lead {
  id: string;
  tracking_number: string;
  courier_name: string;
  full_name: string;
  mobile_number: string;
  status: string;
  affiliate_id?: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [authError, setAuthError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "affiliates" | "leads">("overview");

  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalLeadsCount, setTotalLeadsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "PENDING" | "BANNED">("ALL");

  // Modal State for Ban Reason
  const [banModalAffiliate, setBanModalAffiliate] = useState<Affiliate | null>(null);
  const [banReasonInput, setBanReasonInput] = useState("Violation of affiliate guidelines & duplicate link abuse");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const saved = sessionStorage.getItem("admin_auth_ok");
    if (saved === "true") {
      setIsAuthenticated(true);
      fetchData();
      
      // Real-time updates every 10 seconds without showing loading spinner
      interval = setInterval(() => {
        fetchData(false);
      }, 10000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase })
      });
      const data = await res.json();
      if (data.ok) {
        sessionStorage.setItem("admin_auth_ok", "true");
        setIsAuthenticated(true);
        fetchData();
      } else {
        setAuthError(data.error || "Access Denied");
      }
    } catch (err) {
      setAuthError("Failed to authenticate with server");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [affRes, leadsRes] = await Promise.all([
        fetch("/api/admin/affiliates"),
        fetch("/api/admin/leads?limit=150")
      ]);
      const affData = await affRes.json();
      const leadsData = await leadsRes.json();

      if (affRes.status === 401 || leadsRes.status === 401) {
        sessionStorage.removeItem("admin_auth_ok");
        setIsAuthenticated(false);
        setAuthError("Session expired. Please login again.");
        return;
      }

      if (affData.ok) setAffiliates(affData.affiliates);
      if (leadsData.ok) {
        setLeads(leadsData.leads);
        setTotalLeadsCount(leadsData.totalCount);
      }
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleAction = async (chatId: string, action: string, reason?: string) => {
    setActionLoading(`${chatId}_${action}`);
    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, action, reason })
      });
      const data = await res.json();
      if (data.ok) {
        fetchData();
        if (banModalAffiliate) setBanModalAffiliate(null);
      } else {
        toast.error(`Action failed: ${data.error}`);
      }
    } catch (err) {
      toast.error("Error performing action");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCleanDuplicates = async () => {
    if (!confirm("Are you sure you want to run duplicate link cleanup? This keeps only the newest record per chat ID.")) return;
    setActionLoading("clean_duplicates");
    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clean_duplicates" })
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(data.message || "Duplicate cleanup successful");
        fetchData();
      }
    } catch (err) {
      toast.error("Duplicate cleanup failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportLeadsCSV = () => {
    if (leads.length === 0) return toast.error("No leads to export");
    const headers = ["Tracking Number", "Courier", "Full Name", "Mobile Number", "Status", "Affiliate ID", "Created At"];
    const rows = leads.map(l => [
      l.tracking_number,
      l.courier_name,
      l.full_name || "",
      l.mobile_number || "",
      l.status,
      l.affiliate_id || "Direct",
      l.created_at
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `trackflow_all_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportLeadsTXT = () => {
    if (leads.length === 0) return toast.error("No leads to export");
    let content = `====================================================\n`;
    content += `        TRACKFLOW - ALL LEADS REPORT (TXT)\n`;
    content += `        Generated on: ${new Date().toLocaleString()}\n`;
    content += `====================================================\n\n`;

    leads.forEach((l, index) => {
      content += `[Lead #${index + 1}]\n`;
      content += `📦 Tracking Number: ${l.tracking_number}\n`;
      content += `🚚 Courier Name:    ${l.courier_name}\n`;
      content += `👤 Full Name:       ${l.full_name || "N/A"}\n`;
      content += `📱 Mobile Number:   ${l.mobile_number || "N/A"}\n`;
      content += `📊 Status:          ${l.status}\n`;
      content += `🔗 Affiliate ID:    ${l.affiliate_id || "Direct Website Traffic"}\n`;
      content += `🕐 Timestamp:       ${new Date(l.created_at).toLocaleString()}\n`;
      content += `----------------------------------------------------\n\n`;
    });

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `trackflow_all_leads_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Affiliates
  const filteredAffiliates = affiliates.filter(aff => {
    const matchesSearch =
      aff.chat_id.includes(searchQuery) ||
      aff.affiliate_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (aff.telegram_username && aff.telegram_username.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterStatus === "ACTIVE") return aff.is_active && !aff.is_banned;
    if (filterStatus === "PENDING") return !aff.is_active && !aff.is_banned;
    if (filterStatus === "BANNED") return !!aff.is_banned;
    return true;
  });

  // KPIs
  const activeCount = affiliates.filter(a => a.is_active && !a.is_banned).length;
  const pendingCount = affiliates.filter(a => !a.is_active && !a.is_banned).length;
  const bannedCount = affiliates.filter(a => !!a.is_banned).length;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#060913] text-white flex items-center justify-center p-4 font-sans relative overflow-hidden">
        {/* Glowing Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-md w-full bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/30">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-center tracking-tight mb-2">TrackFlow Admin</h1>
          <p className="text-gray-400 text-center text-sm mb-8">
            Restricted Access. Enter your Admin Passphrase or Telegram Chat ID (@cozy_look).
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
                Admin Passphrase / Chat ID
              </label>
              <input
                type="password"
                required
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter passphrase..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              />
            </div>

            {authError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-600/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <span>Unlock Admin Portal</span>}
            </button>
          </form>
        </div>
      </div>
    );
  }

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
              TrackFlow Command Center
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                PRO ADMIN
              </span>
            </h1>
            <p className="text-xs text-gray-400">Owner: @cozy_look | Anti-Abuse & Affiliate Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-400" : ""}`} />
            <span>Refresh Data</span>
          </button>
          <button
            onClick={handleCleanDuplicates}
            disabled={!!actionLoading}
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm font-medium flex items-center gap-2 transition-all"
            title="Purge duplicate link entries from database"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Audit Duplicates</span>
          </button>
          <button
            onClick={async () => {
              try {
                await fetch("/api/admin/auth", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "logout" })
                });
              } catch (e) {}
              sessionStorage.removeItem("admin_auth_ok");
              setIsAuthenticated(false);
            }}
            className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-medium transition-all"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${
              activeTab === "overview"
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-600/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>System Overview</span>
          </button>
          <button
            onClick={() => setActiveTab("affiliates")}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${
              activeTab === "affiliates"
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-600/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Affiliate Manager ({affiliates.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("leads")}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${
              activeTab === "leads"
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-600/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>All Tracking Leads ({totalLeadsCount})</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-purple-500/40 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Affiliates</span>
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold">{affiliates.length}</div>
                <div className="mt-2 text-xs text-gray-400 flex items-center gap-2">
                  <span className="text-green-400 font-semibold">{activeCount} Active</span> •
                  <span className="text-amber-400 font-semibold">{pendingCount} Pending</span>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-green-500/40 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Active Partners</span>
                  <div className="p-2.5 rounded-xl bg-green-500/10 text-green-400 group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-green-400">{activeCount}</div>
                <div className="mt-2 text-xs text-gray-400">Receiving instant Telegram data</div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-red-500/40 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Banned & Blocked</span>
                  <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 group-hover:scale-110 transition-transform">
                    <Ban className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-red-400">{bannedCount}</div>
                <div className="mt-2 text-xs text-gray-400">Stripped of all attribution</div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-blue-500/40 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Leads Tracked</span>
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-blue-400">{totalLeadsCount}</div>
                <div className="mt-2 text-xs text-gray-400">Across all couriers and links</div>
              </div>
            </div>

            {/* Quick Actions Panel & Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-black/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <span>Top Performing Affiliates (By Leads Generated)</span>
                </h3>
                <div className="space-y-3">
                  {affiliates
                    .slice()
                    .sort((a, b) => (b.leadsCount || 0) - (a.leadsCount || 0))
                    .slice(0, 5)
                    .map((aff, idx) => (
                      <div
                        key={aff.id}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 font-bold text-xs flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="font-semibold text-sm flex items-center gap-2">
                              <span>@{aff.telegram_username || "UnknownUser"}</span>
                              {aff.is_banned ? (
                                <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-bold">BANNED</span>
                              ) : aff.is_active ? (
                                <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-bold">ACTIVE</span>
                              ) : (
                                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold">PENDING</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 font-mono">ID: {aff.chat_id} | ref: {aff.affiliate_id}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-extrabold text-purple-400">{aff.leadsCount || 0}</div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-wider">Leads Tracked</div>
                        </div>
                      </div>
                    ))}
                  {affiliates.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">No affiliate records yet.</div>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-900/30 via-blue-900/20 to-black/60 border border-purple-500/30 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-white">
                    <ShieldAlert className="w-5 h-5 text-purple-400" />
                    <span>Affiliate Security & Control</span>
                  </h3>
                  <p className="text-xs text-gray-300 leading-relaxed mb-6">
                    Manage permissions, instantly ban spamming users from generating links, and prevent duplicate links across your entire platform.
                  </p>

                  <div className="space-y-3">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs">
                      <div className="font-bold text-purple-300 mb-1">🔗 Zero Duplicate Links Check</div>
                      <p className="text-gray-400">Every link is verified against unique constraints and nanoid collision loops before generation.</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs">
                      <div className="font-bold text-blue-300 mb-1">⚡ Telegram Admin Sync</div>
                      <p className="text-gray-400">Use commands <code className="text-purple-300">/ban</code>, <code className="text-purple-300">/unban</code>, or <code className="text-purple-300">/affiliates</code> inside Telegram anytime.</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab("affiliates")}
                  className="mt-6 w-full py-3 rounded-xl bg-white text-black font-extrabold text-sm hover:bg-gray-200 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <span>Manage All Affiliates</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AFFILIATES MANAGER */}
        {activeTab === "affiliates" && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-black/40 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
              <div className="relative flex-1 min-w-[280px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by username, Chat ID, or Ref ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                {(["ALL", "ACTIVE", "PENDING", "BANNED"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      filterStatus === status
                        ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                        : "bg-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    {status} ({affiliates.filter(a => {
                      if (status === "ACTIVE") return a.is_active && !a.is_banned;
                      if (status === "PENDING") return !a.is_active && !a.is_banned;
                      if (status === "BANNED") return !!a.is_banned;
                      return true;
                    }).length})
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="bg-black/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-xs font-bold uppercase tracking-wider text-gray-400 bg-white/[0.02]">
                      <th className="p-4">Affiliate & Telegram ID</th>
                      <th className="p-4">Ref Link & ID</th>
                      <th className="p-4">Leads Tracked</th>
                      <th className="p-4">Status & Ban Reason</th>
                      <th className="p-4">Created Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {filteredAffiliates.map((aff) => (
                      <tr key={aff.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>@{aff.telegram_username || "NoUsername"}</span>
                          </div>
                          <div className="text-xs text-gray-400 font-mono">Chat: {aff.chat_id}</div>
                        </td>

                        <td className="p-4 font-mono">
                          <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-bold">
                            /?ref={aff.affiliate_id}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className="font-extrabold text-base text-white">{aff.leadsCount || 0}</span>
                          <span className="text-xs text-gray-400 ml-1">leads</span>
                        </td>

                        <td className="p-4">
                          {aff.is_banned ? (
                            <div>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold">
                                <Ban className="w-3 h-3" /> BANNED
                              </span>
                              {aff.ban_reason && (
                                <div className="text-[11px] text-red-300/80 mt-1 max-w-xs truncate" title={aff.ban_reason}>
                                  Reason: {aff.ban_reason}
                                </div>
                              )}
                            </div>
                          ) : aff.is_active ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold">
                              <CheckCircle2 className="w-3 h-3" /> ACTIVE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold">
                              ⏳ PENDING APPROVAL
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-xs text-gray-400">
                          {new Date(aff.created_at).toLocaleDateString()}
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Approve Button */}
                            {(!aff.is_active || aff.is_banned) && (
                              <button
                                onClick={() => handleAction(aff.chat_id, "approve")}
                                disabled={!!actionLoading}
                                className="px-3 py-1.5 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold flex items-center gap-1 transition-all"
                                title="Approve & Activate Affiliate"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                            )}

                            {/* Suspend Button */}
                            {aff.is_active && !aff.is_banned && (
                              <button
                                onClick={() => handleAction(aff.chat_id, "suspend")}
                                disabled={!!actionLoading}
                                className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all"
                                title="Suspend Link"
                              >
                                Suspend
                              </button>
                            )}

                            {/* Ban / Unban Button */}
                            {aff.is_banned ? (
                              <button
                                onClick={() => handleAction(aff.chat_id, "unban")}
                                disabled={!!actionLoading}
                                className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold flex items-center gap-1 transition-all"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Unban</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setBanModalAffiliate(aff)}
                                disabled={!!actionLoading}
                                className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1 transition-all"
                                title="Ban Affiliate & Block Link Generation"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                <span>Ban</span>
                              </button>
                            )}

                            {/* Delete Button */}
                            <button
                              onClick={() => {
                                if (confirm(`Delete affiliate @${aff.telegram_username} (${aff.chat_id}) completely?`)) {
                                  handleAction(aff.chat_id, "delete");
                                }
                              }}
                              disabled={!!actionLoading}
                              className="p-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
                              title="Delete row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredAffiliates.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-gray-500">
                          No affiliates matching your filter/search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LEADS & TRAFFIC */}
        {activeTab === "leads" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-black/40 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
              <div>
                <h3 className="font-bold text-base">Tracking Leads Repository</h3>
                <p className="text-xs text-gray-400">Total verified search attempts across all couriers</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportLeadsCSV}
                  className="px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-green-600/20 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={handleExportLeadsTXT}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span>Export TXT (A-to-Z)</span>
                </button>
              </div>
            </div>

            {/* Leads Table */}
            <div className="bg-black/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs font-bold uppercase tracking-wider text-gray-400 bg-white/[0.02]">
                      <th className="p-4">Tracking Number</th>
                      <th className="p-4">Courier</th>
                      <th className="p-4">Customer Details</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Affiliate Ref</th>
                      <th className="p-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-mono font-bold text-white">{lead.tracking_number}</td>
                        <td className="p-4 uppercase text-xs font-semibold text-purple-300">{lead.courier_name}</td>
                        <td className="p-4">
                          <div className="font-semibold text-white">{lead.full_name || "N/A"}</div>
                          <div className="text-xs text-gray-400">{lead.mobile_number || "No mobile"}</div>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-bold">
                            {lead.status}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-xs">
                          {lead.affiliate_id ? (
                            <span className="text-green-400 font-bold">ref: {lead.affiliate_id}</span>
                          ) : (
                            <span className="text-gray-500 italic">Direct / No Ref</span>
                          )}
                        </td>
                        <td className="p-4 text-xs text-gray-400">
                          {new Date(lead.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {leads.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-gray-500">
                          No tracking requests recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* BAN CONFIRMATION MODAL */}
      {banModalAffiliate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0e1324] border border-red-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mb-4">
              <Ban className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-extrabold text-white mb-2">
              Ban Affiliate @{banModalAffiliate.telegram_username || banModalAffiliate.chat_id}?
            </h3>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Banning this affiliate immediately strips all future tracking attribution and prevents them from generating new links via Telegram.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Ban Reason (Sent to user & stored in DB)
                </label>
                <textarea
                  rows={3}
                  value={banReasonInput}
                  onChange={(e) => setBanReasonInput(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-all"
                  placeholder="Why is this user being banned?"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBanModalAffiliate(null)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleAction(banModalAffiliate.chat_id, "ban", banReasonInput)}
                  disabled={!!actionLoading}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2"
                >
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Confirm Ban</span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
