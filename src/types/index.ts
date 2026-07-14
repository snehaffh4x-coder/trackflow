// ============================================
// TrackFlow — Type Definitions
// ============================================

// --- Tracking Result (live API integration) ---

export interface TrackingEvent {
  date: string;
  time: string;
  location: string;
  status: string;
  description: string;
}

export interface TrackingResult {
  tracking_number: string;
  courier: string;
  status: "in_transit" | "delivered" | "pending" | "out_for_delivery" | "exception" | "unknown";
  status_label: string;
  estimated_delivery: string | null;
  current_location: string;
  origin: string;
  destination: string;
  progress: number; // 0-100
  last_updated: string;
  timeline: TrackingEvent[];
}

// --- API Response Types ---

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// --- Courier ---

export interface Courier {
  name: string;
  code: string;
  color: string;
  icon?: string;
}

// --- Feature ---

export interface Feature {
  icon: string;
  title: string;
  description: string;
  gradient: string;
}

// --- Navigation ---

export interface NavItem {
  label: string;
  href: string;
}
