"use client";

import { motion } from "framer-motion";
import { Copy, Share2, Printer, MapPin, CheckCircle2, Clock, AlertTriangle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { COURIERS, getStatusBgColor, getStatusColor, formatDateTime } from "@/lib/utils";
import type { TrackingResult } from "@/types";
import { TrackingTimeline } from "./tracking-timeline";
import { TrackingActions } from "./tracking-actions";

export function TrackingCard({ data }: { data: TrackingResult }) {
  const courierInfo = COURIERS.find(c => c.name === data.courier) || { color: "#3b82f6" };
  
  const getStatusIcon = (status: string) => {
    switch(status) {
      case "delivered": return <CheckCircle2 className="w-5 h-5" />;
      case "exception": return <AlertTriangle className="w-5 h-5" />;
      case "in_transit": return <Package className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto"
    >
      {/* Main Status Card */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm mb-8">
        <div className="p-6 md:p-8 border-b border-gray-200 relative overflow-hidden">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Tracking Number
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 border border-gray-200 flex items-center gap-2 text-gray-700">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: courierInfo.color }} />
                  {data.courier}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold font-mono tracking-tight text-gray-900">
                {data.tracking_number}
              </h1>
            </div>
            
            <TrackingActions trackingNumber={data.tracking_number} />
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-4 rounded-xl border flex flex-col gap-2 ${getStatusBgColor(data.status)}`}>
              <div className="flex items-center gap-2">
                {getStatusIcon(data.status)}
                <span className="font-semibold">{data.status_label}</span>
              </div>
              <span className="text-sm opacity-80">Current Status</span>
            </div>
            
            <div className="p-4 rounded-md border border-gray-200 bg-gray-50 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-gray-900 font-semibold">
                <MapPin className="w-5 h-5 text-blue-600" />
                {data.current_location}
              </div>
              <span className="text-sm text-gray-600">Current Location</span>
            </div>
            
            <div className="p-4 rounded-md border border-gray-200 bg-gray-50 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-gray-900 font-semibold">
                <Clock className="w-5 h-5 text-blue-600" />
                {data.estimated_delivery ? formatDateTime(data.estimated_delivery) : "Delivered"}
              </div>
              <span className="text-sm text-gray-600">Estimated Delivery</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-50 p-6 md:p-8 border-b border-gray-200">
          <div className="flex justify-between text-sm font-medium mb-4">
            <span className={data.progress >= 0 ? "text-blue-600" : "text-gray-400"}>Origin</span>
            <span className={data.progress >= 50 ? "text-blue-600" : "text-gray-400"}>In Transit</span>
            <span className={data.progress >= 85 ? "text-blue-600" : "text-gray-400"}>Out for Delivery</span>
            <span className={data.progress === 100 ? "text-blue-600" : "text-gray-400"}>Destination</span>
          </div>
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden relative">
            <motion.div 
              className="absolute top-0 left-0 h-full bg-blue-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${data.progress}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            >
            </motion.div>
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-2">
            <span>{data.origin}</span>
            <span>{data.destination}</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="p-6 md:p-8 bg-white">
          <h3 className="text-xl font-semibold mb-6 text-gray-900">Tracking History</h3>
          <TrackingTimeline events={data.timeline} />
        </div>
      </div>
    </motion.div>
  );
}
