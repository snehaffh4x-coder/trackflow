"use client";

import Image from "next/image";
import { TrackingSearch } from "./tracking-search";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left side - Text + Form */}
          <div>
            <p className="text-sm font-medium text-blue-600 uppercase tracking-[0.2em] mb-5">
              Real-Time Package Tracking
            </p>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.1] text-gray-900">
              Track Any Shipment,{" "}
              <span className="text-blue-600">Anywhere</span>
            </h1>

            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Enter your tracking number below for real-time delivery updates.
            </p>

            <TrackingSearch />
          </div>

          {/* Right side - Images grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative h-48 rounded-md overflow-hidden border border-gray-200 shadow-sm">
              <Image
                src="/hero-bg.png"
                alt="Delivery boxes and truck"
                fill
                className="object-cover"
                priority
                quality={85}
              />
            </div>
            <div className="relative h-48 rounded-md overflow-hidden border border-gray-200 shadow-sm mt-8">
              <Image
                src="/courier-trust.png"
                alt="Courier delivery"
                fill
                className="object-cover"
                quality={85}
              />
            </div>
            <div className="relative h-48 rounded-md overflow-hidden border border-gray-200 shadow-sm">
              <Image
                src="/tracking-map.png"
                alt="Global tracking"
                fill
                className="object-cover"
                quality={85}
              />
            </div>
            <div className="relative h-48 rounded-md overflow-hidden border border-gray-200 shadow-sm mt-8">
              <Image
                src="/warehouse.png"
                alt="Package warehouse"
                fill
                className="object-cover"
                quality={85}
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
