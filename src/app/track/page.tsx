"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageTransition } from "@/components/ui/page-transition";
import { TrackingSearch } from "@/components/home/tracking-search";
import { TrackingCard } from "@/components/tracking/tracking-card";
import { TrackingSkeleton } from "@/components/tracking/tracking-skeleton";
import { useTracking } from "@/hooks/use-tracking";
import { useVisitorLog } from "@/hooks/use-visitor-log";
import { GradientText } from "@/components/ui/gradient-text";

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
      
      // Auto-trigger search if params exist
      // Use a timeout to ensure state is set before triggering
      setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        // Don't navigate, just fetch
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
    <div className="container mx-auto px-4 py-32 md:py-40 min-h-screen">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">
          Track your <GradientText>Shipment</GradientText>
        </h1>
        <p className="text-lg text-muted-foreground">
          Enter your tracking number below for real-time updates.
        </p>
      </div>

      <div className="mb-16">
        <TrackingSearch />
      </div>

      {isLoading ? (
        <TrackingSkeleton />
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
