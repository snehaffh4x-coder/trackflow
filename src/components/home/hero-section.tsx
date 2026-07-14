"use client";

import Image from "next/image";
import { TrackingSearch } from "./tracking-search";

export function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-bg.png"
          alt="Logistics network"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 text-center py-20">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm font-medium text-blue-400 uppercase tracking-[0.2em] mb-5">
            Real-Time Package Tracking
          </p>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-heading tracking-tight mb-6 leading-[1.1] text-white">
            Track Any Shipment,{" "}
            <span className="text-blue-400">Anywhere</span>
          </h1>

          <p className="text-lg text-neutral-400 mb-10 max-w-xl mx-auto leading-relaxed">
            Enter your tracking number below. We support 500+ couriers worldwide with instant status updates.
          </p>
        </div>

        <TrackingSearch />
      </div>
    </section>
  );
}
