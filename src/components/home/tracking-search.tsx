"use client";

import { useEffect } from "react";
import { Search, Package } from "lucide-react";
import { useTracking } from "@/hooks/use-tracking";

export function TrackingSearch() {
  const { 
    trackingNumber, 
    setTrackingNumber,
    fullName,
    setFullName,
    mobileNumber,
    setMobileNumber,
    courier, 
    setCourier, 
    isLoading, 
    handleTrack 
  } = useTracking();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const num = params.get("number");
      const cou = params.get("courier");
      
      if (num) setTrackingNumber(num);
      if (cou) setCourier(cou);

      if (num) {
        const storedName = sessionStorage.getItem("tf_name");
        const storedMobile = sessionStorage.getItem("tf_mobile");
        
        if (storedName) setFullName(storedName);
        if (storedMobile) setMobileNumber(storedMobile);
      }
    }
  }, [setTrackingNumber, setCourier, setFullName, setMobileNumber]);

  return (
    <div className="max-w-2xl mx-auto w-full">
      <form 
        onSubmit={(e) => handleTrack(e, true)} 
        className="flex flex-col gap-3"
      >
        {/* Name + Phone row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full Name"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500/50 transition-colors"
            required
          />
          <input
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            placeholder="Mobile Number"
            type="tel"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500/50 transition-colors"
            required
          />
        </div>

        {/* Tracking + Courier + Button row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Tracking number"
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500/50 transition-colors"
              required
            />
          </div>
          
          <div className="relative">
            <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
              placeholder="Courier (optional)"
              className="w-full sm:w-44 pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isLoading ? "Searching..." : "Track"}
          </button>
        </div>
      </form>
    </div>
  );
}
