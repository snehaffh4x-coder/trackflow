"use client";

import { motion } from "framer-motion";
import { COURIERS } from "@/lib/utils";

export function CouriersSection() {
  return (
    <section className="py-20 border-y border-white/5 bg-background/50 relative overflow-hidden">
      <div className="container mx-auto px-4 mb-10 text-center">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
          Trusted globally by 500+ carriers
        </p>
      </div>

      <div className="relative flex overflow-x-hidden group">
        <div className="py-4 animate-shimmer whitespace-nowrap flex items-center gap-12 sm:gap-24 px-12 sm:px-24">
          {[...COURIERS, ...COURIERS].map((courier, i) => (
            <div 
              key={`${courier.code}-${i}`}
              className="flex items-center gap-3 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer"
            >
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: courier.color }}
              />
              <span className="font-heading font-semibold text-xl tracking-tight text-foreground">
                {courier.name}
              </span>
            </div>
          ))}
        </div>
        
        <div className="absolute top-0 py-4 animate-shimmer whitespace-nowrap flex items-center gap-12 sm:gap-24 px-12 sm:px-24" style={{ transform: "translateX(100%)" }}>
          {[...COURIERS, ...COURIERS].map((courier, i) => (
            <div 
              key={`${courier.code}-${i}-clone`}
              className="flex items-center gap-3 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer"
            >
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: courier.color }}
              />
              <span className="font-heading font-semibold text-xl tracking-tight text-foreground">
                {courier.name}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Gradient masks for seamless loop */}
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
    </section>
  );
}
