"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function useVisitorLog() {
  const pathname = usePathname();
  const loggedRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    // Only log once per path per session to avoid spamming the DB during dev/navigation
    if (loggedRef.current[pathname]) return;
    
    const logVisitor = async () => {
      try {
        await fetch("/api/visitor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page: pathname }),
        });
        loggedRef.current[pathname] = true;
      } catch (error) {
        console.error("Failed to log visitor:", error);
      }
    };

    logVisitor();
  }, [pathname]);
}
