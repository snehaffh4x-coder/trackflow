import type { TrackingResult, TrackingEvent } from "@/types";
import { detectCourier } from "@/lib/utils";

export async function fetchLiveTrackingStatus(trackingNumber: string, courier?: string): Promise<{ success: boolean; data?: TrackingResult; error?: string }> {
  try {
    const detectedCourier = courier && courier !== "Auto" ? courier : detectCourier(trackingNumber);
    let apiCourier = detectedCourier.toLowerCase().replace(/_|\s/g, "");
    
    const courierMap: Record<string, string> = {
      "indiapost": "india",
      "royalmail": "royalmail",
      "australiapost": "auspost",
      "canadapost": "canpost",
      "chinapost": "youzhengguonei",
      "japanpost": "japanposten",
    };
    
    apiCourier = courierMap[apiCourier] || apiCourier;

    const response = await fetch(`https://www.kuaidi100.com/query?type=${encodeURIComponent(apiCourier)}&postid=${encodeURIComponent(trackingNumber)}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(6000)
    });
    
    const data = await response.json();
    
    if (data.status === "200" || data.message === "ok") {
      let status: TrackingResult["status"] = "in_transit";
      let progress = 50;
      
      switch (String(data.state)) {
        case "3":
          status = "delivered";
          progress = 100;
          break;
        case "5":
          status = "out_for_delivery";
          progress = 85;
          break;
        case "2":
        case "4":
        case "6":
          status = "exception";
          progress = 50;
          break;
        case "0":
        case "1":
        default:
          status = "in_transit";
          progress = 30;
          break;
      }
      
      const statusLabels: Record<TrackingResult["status"], string> = {
        pending: "Order Placed",
        in_transit: "In Transit",
        out_for_delivery: "Out for Delivery",
        delivered: "Delivered",
        exception: "Exception",
        unknown: "Unknown",
      };

      let translatedContexts: string[] = [];
      const rawEvents = data.data || [];
      
      try {
        const { default: translate } = await import('google-translate-api-x');
        translatedContexts = await Promise.all(
          rawEvents.map(async (item: { context?: string }) => {
            if (!item.context) return "No description";
            try {
              const res = await translate(item.context, { to: 'en' });
              return (res as { text: string }).text;
            } catch {
              return item.context;
            }
          })
        );
      } catch {
        translatedContexts = rawEvents.map((item: { context?: string }) => item.context || "No description");
      }

      const timeline: TrackingEvent[] = rawEvents.map((item: { time?: string; context?: string; location?: string }, index: number) => {
        const d = item.time ? new Date(item.time) : new Date();
        return {
          date: d.toISOString(),
          time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          location: "Update", 
          status: "Update",
          description: translatedContexts[index] || item.context || "No description",
        };
      });

      const trackingData: TrackingResult = {
        tracking_number: trackingNumber,
        courier: data.com || detectedCourier,
        status,
        status_label: statusLabels[status],
        estimated_delivery: null,
        current_location: timeline.length > 0 ? timeline[0].location : "Unknown",
        origin: "Unknown",
        destination: "Unknown",
        progress,
        last_updated: new Date().toISOString(),
        timeline: timeline, 
      };

      return { success: true, data: trackingData };
    } else {
      return { success: false, error: data.message || "Lookup failed" };
    }
  } catch (error) {
    const err = error as Error;
    console.error("[TrackingService] Error:", err);
    return { success: false, error: err.message || "Network error" };
  }
}
