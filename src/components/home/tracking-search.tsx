"use client";

import { useEffect } from "react";
import { Search, Package, MapPin, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTracking } from "@/hooks/use-tracking";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { GlassCard } from "@/components/ui/glass-card";

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

      // Only auto-fill name and mobile if we have a tracking number in the URL (meaning they were redirected here)
      // Otherwise keep it clean
      if (num) {
        const storedName = sessionStorage.getItem("tf_name");
        const storedMobile = sessionStorage.getItem("tf_mobile");
        
        if (storedName) setFullName(storedName);
        if (storedMobile) setMobileNumber(storedMobile);
      }
    }
  }, [setTrackingNumber, setCourier, setFullName, setMobileNumber]);

  return (
    <GlassCard className="p-4 md:p-6 max-w-3xl mx-auto w-full">
      <form 
        onSubmit={(e) => handleTrack(e, true)} 
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your Full Name"
            className="py-3 md:py-4 h-auto bg-background/50 border-white/10 text-base md:text-lg rounded-xl focus-visible:ring-primary/50"
            required
          />
          <Input
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            placeholder="Mobile Number"
            type="tel"
            className="py-3 md:py-4 h-auto bg-background/50 border-white/10 text-base md:text-lg rounded-xl focus-visible:ring-primary/50"
            required
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter your tracking number..."
              className="pl-12 py-3 md:py-4 h-auto bg-background/50 border-white/10 text-base md:text-lg rounded-xl focus-visible:ring-primary/50"
              required
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full sm:w-auto">
              <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
                placeholder="Courier (Optional)"
                className="pl-12 py-3 md:py-4 h-auto bg-background/50 border-white/10 text-base md:text-lg rounded-xl focus-visible:ring-primary/50 min-w-[200px]"
              />
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="py-3 md:py-4 h-auto px-6 md:px-8 rounded-xl bg-primary text-primary-foreground shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:shadow-[0_0_25px_rgba(59,130,246,0.7)] transition-all font-semibold text-base md:text-lg w-full sm:w-auto"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : "Auto Search"}
            </Button>
          </div>
        </div>
      </form>

      <div className="mt-4 flex items-center justify-center gap-6 text-sm text-muted-foreground hidden sm:flex">
        <span className="flex items-center gap-2"><Package className="w-4 h-4" /> Real-time Updates</span>
        <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Global Coverage</span>
        <span className="flex items-center gap-2"><Map className="w-4 h-4" /> Interactive Maps</span>
      </div>
    </GlassCard>
  );
}
