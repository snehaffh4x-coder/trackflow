"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { isValidTrackingNumber } from "@/lib/utils";
import type { TrackingResult } from "@/types";

export function useTracking() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [courier, setCourier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const router = useRouter();

  const handleTrack = async (
    e?: React.FormEvent, 
    navigate = true, 
    overrideData?: { trackingNumber?: string; courier?: string; fullName?: string; mobileNumber?: string }
  ) => {
    if (e) e.preventDefault();
    
    const tn = overrideData?.trackingNumber || trackingNumber;
    const fn = overrideData?.fullName || fullName;
    const mn = overrideData?.mobileNumber || mobileNumber;
    const c = overrideData?.courier || courier;

    if (!tn) {
      toast.error("Please enter a tracking number");
      return;
    }

    if (!fn.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    if (!mn.trim()) {
      toast.error("Please enter your mobile number");
      return;
    }

    // Basic frontend validation for Indian mobile numbers
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanNumber = mn.replace(/\D/g, ""); // Remove non-digits
    if (!phoneRegex.test(cleanNumber)) {
      toast.error("Please enter a valid 10-digit Indian mobile number");
      return;
    }

    // We allow any tracking number format to proceed to the backend
    // to ensure we always capture the search attempt.

    setIsLoading(true);
    setResult(null);

    try {
      if (navigate) {
        // Save user details to sessionStorage so they persist across navigation
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('tf_name', fn);
          sessionStorage.setItem('tf_mobile', mn);
        }
        
        // If navigating to the tracking page, pass params in URL
        const params = new URLSearchParams(window.location.search); // Preserve existing params like ref
        params.set("number", tn);
        if (c && c !== "Auto-detect") params.set("courier", c);
        
        router.push(`/track?${params.toString()}`);
        return; // The actual tracking page will fetch the data
      }

        // If we are already on the tracking page, fetch the data
        const searchParams = new URLSearchParams(window.location.search);
        let affiliateId = searchParams.get('ref');
        
        // If not in ref param, try to extract from subdomain if it's not www or localhost
        if (!affiliateId && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            const parts = window.location.hostname.split('.');
            if (parts.length > 2 && parts[0] !== 'www') {
                affiliateId = parts[0];
            }
        }
        
        const res = await fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trackingNumber: tn, courier: c, fullName: fn, mobileNumber: mn, affiliateId }),
        });

      const data = await res.json();
      
      if (res.ok && data.success) {
        setResult(data.data);
      } else {
        toast.error(data.error || "Failed to track package");
      }
    } catch (error) {
      toast.error("An error occurred while tracking");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    trackingNumber,
    setTrackingNumber,
    fullName,
    setFullName,
    mobileNumber,
    setMobileNumber,
    courier,
    setCourier,
    isLoading,
    setIsLoading,
    result,
    setResult,
    handleTrack,
  };
}
