"use client";

import { AnimatedCounter } from "@/components/ui/animated-counter";

export function StatsSection() {
  return (
    <section className="py-20 border-y border-white/5 bg-background/50 relative z-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
          <div>
            <div className="text-4xl md:text-5xl font-bold font-heading text-foreground mb-2 flex justify-center items-center">
              <AnimatedCounter value={100} suffix="K+" />
            </div>
            <p className="text-sm md:text-base text-muted-foreground font-medium uppercase tracking-wider">Packages Tracked</p>
          </div>
          
          <div>
            <div className="text-4xl md:text-5xl font-bold font-heading text-foreground mb-2 flex justify-center items-center">
              <AnimatedCounter value={500} suffix="+" />
            </div>
            <p className="text-sm md:text-base text-muted-foreground font-medium uppercase tracking-wider">Couriers Supported</p>
          </div>
          
          <div>
            <div className="text-4xl md:text-5xl font-bold font-heading text-foreground mb-2 flex justify-center items-center">
              <AnimatedCounter value={99} decimals={1} suffix="%" />
            </div>
            <p className="text-sm md:text-base text-muted-foreground font-medium uppercase tracking-wider">API Uptime</p>
          </div>
          
          <div>
            <div className="text-4xl md:text-5xl font-bold font-heading text-foreground mb-2 flex justify-center items-center">
              <AnimatedCounter value={150} suffix="+" />
            </div>
            <p className="text-sm md:text-base text-muted-foreground font-medium uppercase tracking-wider">Countries Served</p>
          </div>
        </div>
      </div>
    </section>
  );
}
