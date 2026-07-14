import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Courier, TrackingResult, TrackingEvent } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Courier Detection ---

export const COURIERS: Courier[] = [
  { name: "Blue Dart", code: "bluedart", color: "#003399" },
  { name: "Delhivery", code: "delhivery", color: "#E21836" },
  { name: "DTDC", code: "dtdc", color: "#D4003C" },
  { name: "Ecom Express", code: "ecomexpress", color: "#0056A8" },
  { name: "Ekart", code: "ekart", color: "#F2BB13" },
  { name: "India Post", code: "indiapost", color: "#E31E24" },
  { name: "Shadowfax", code: "shadowfax", color: "#E02128" },
  { name: "XpressBees", code: "xpressbees", color: "#ED1C24" },
];

export function detectCourier(trackingNumber: string): string {
  const num = trackingNumber.trim().toUpperCase();
  if (/^\d{12,22}$/.test(num)) return "FedEx";
  if (/^1Z[A-Z0-9]{16}$/.test(num)) return "UPS";
  if (/^(94|93|92|94|95)\d{18,22}$/.test(num)) return "USPS";
  if (/^\d{10,11}$/.test(num)) return "DHL";
  if (/^TBA\d{12,}$/.test(num)) return "Amazon";
  return "Auto-detect";
}

// --- Tracking Number Validation ---

export function isValidTrackingNumber(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 5 && trimmed.length <= 50 && /^[A-Za-z0-9\-]+$/.test(trimmed);
}

// --- Date Formatters ---

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

// --- CSV Export ---

export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// --- Mock Tracking Data ---

export function generateMockTracking(trackingNumber: string, courier: string): TrackingResult {
  // Use tracking number to seed the random generation so it's consistent for the same number
  let seed = 0;
  for (let i = 0; i < trackingNumber.length; i++) {
    seed += trackingNumber.charCodeAt(i);
  }
  
  // Pseudo-random function based on seed
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const statuses: TrackingResult["status"][] = [
    "pending", "in_transit", "out_for_delivery", "delivered"
  ];
  const statusLabels: Record<TrackingResult["status"], string> = {
    pending: "Order Placed",
    in_transit: "In Transit",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    exception: "Exception",
    unknown: "Unknown",
  };

  const randomStatus = statuses[Math.floor(random() * statuses.length)];
  const progress = randomStatus === "delivered" ? 100
    : randomStatus === "out_for_delivery" ? 85
    : randomStatus === "in_transit" ? 50
    : 15;

  const now = new Date();
  
  // Generate random past dates based on seed
  const daysAgo1 = Math.floor(random() * 2) + 3; // 3-4 days ago
  const daysAgo2 = daysAgo1 - 1; 
  const daysAgo3 = daysAgo2 - 1;

  const timeline: TrackingEvent[] = [
    {
      date: new Date(now.getTime() - daysAgo1 * 86400000).toISOString(),
      time: "09:00 AM",
      location: "Mumbai, MH",
      status: "Order Placed",
      description: "Shipment information received",
    },
    {
      date: new Date(now.getTime() - daysAgo2 * 86400000).toISOString(),
      time: "02:30 PM",
      location: "Pune, MH",
      status: "Picked Up",
      description: "Package picked up by courier",
    },
    {
      date: new Date(now.getTime() - daysAgo3 * 86400000).toISOString(),
      time: "11:15 AM",
      location: "New Delhi, DL",
      status: "In Transit",
      description: "Package arrived at sorting facility",
    },
  ];

  if (randomStatus === "out_for_delivery" || randomStatus === "delivered") {
    timeline.push({
      date: new Date(now.getTime() - 1 * 86400000).toISOString(),
      time: "06:00 AM",
      location: "Bangalore, KA",
      status: "Out for Delivery",
      description: "Package is out for delivery",
    });
  }

  if (randomStatus === "delivered") {
    timeline.push({
      date: now.toISOString(),
      time: "10:45 AM",
      location: "Bangalore, KA",
      status: "Delivered",
      description: "Package delivered — signed by customer",
    });
  }

  return {
    tracking_number: trackingNumber,
    courier: courier || detectCourier(trackingNumber),
    status: randomStatus,
    status_label: statusLabels[randomStatus],
    estimated_delivery: randomStatus === "delivered"
      ? null
      : new Date(now.getTime() + 2 * 86400000).toISOString(),
    current_location: timeline[timeline.length - 1].location,
    origin: "Mumbai, MH",
    destination: "Bangalore, KA",
    progress,
    last_updated: now.toISOString(),
    timeline: timeline.reverse(),
  };
}

// --- Status Colors ---

export function getStatusColor(status: string): string {
  switch (status) {
    case "delivered": return "text-emerald-400";
    case "in_transit": return "text-blue-400";
    case "out_for_delivery": return "text-amber-400";
    case "pending": return "text-zinc-400";
    case "exception": return "text-red-400";
    default: return "text-zinc-500";
  }
}

export function getStatusBgColor(status: string): string {
  switch (status) {
    case "delivered": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "in_transit": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "out_for_delivery": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "pending": return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    case "exception": return "bg-red-500/10 text-red-400 border-red-500/20";
    default: return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
  }
}
