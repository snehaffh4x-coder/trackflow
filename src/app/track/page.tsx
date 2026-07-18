"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageTransition } from "@/components/ui/page-transition";
import { TrackingSearch } from "@/components/home/tracking-search";
import { TrackingCard } from "@/components/tracking/tracking-card";
import { TrackingSkeleton } from "@/components/tracking/tracking-skeleton";
import { useTracking } from "@/hooks/use-tracking";
import { useVisitorLog } from "@/hooks/use-visitor-log";

function TrackingContent() {
  useVisitorLog();
  const searchParams = useSearchParams();
  const initialNumber = searchParams.get("number");
  const initialCourier = searchParams.get("courier");
  
  const { 
    setTrackingNumber, 
    setCourier, 
    setFullName,
    setMobileNumber,
    isLoading, 
    result,
    error,
    handleTrack 
  } = useTracking();

  useEffect(() => {
    if (initialNumber) {
      setTrackingNumber(initialNumber);
      if (initialCourier) setCourier(initialCourier);
      
      const storedName = typeof window !== 'undefined' ? sessionStorage.getItem('tf_name') : '';
      const storedMobile = typeof window !== 'undefined' ? sessionStorage.getItem('tf_mobile') : '';
      
      if (storedName) setFullName(storedName);
      if (storedMobile) setMobileNumber(storedMobile);
      
      setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        handleTrack(fakeEvent, false, {
          trackingNumber: initialNumber,
          courier: initialCourier || "",
          fullName: storedName || "",
          mobileNumber: storedMobile || ""
        });
      }, 0);
    }
  }, [initialNumber, initialCourier]);

  return (
    <div className="container mx-auto px-4 py-24 min-h-screen bg-white">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900">
          Track your Shipment
        </h1>
        <p className="text-lg text-gray-600">
          Enter your tracking number below for real-time updates.
        </p>
      </div>

      <div className="mb-16">
        <TrackingSearch />
      </div>

      {isLoading ? (
        <TrackingSkeleton />
      ) : error ? (
        <div className="max-w-md mx-auto text-center py-16 bg-red-50 border border-red-200 rounded-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-red-800 mb-2">Tracking Not Found</h3>
          <p className="text-red-600">{error}</p>
        </div>
      ) : result ? (
        <TrackingCard data={result} />
      ) : null}
    </div>
  );
}

export default function TrackPage() {
  return (
    <PageTransition>
      <Suspense fallback={<TrackingSkeleton />}>
        <TrackingContent />
      </Suspense>
    </PageTransition>
  );
}
