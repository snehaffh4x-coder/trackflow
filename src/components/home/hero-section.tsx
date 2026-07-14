"use client";

import { motion } from "framer-motion";
import { GradientText } from "@/components/ui/gradient-text";
import { TrackingSearch } from "./tracking-search";
import dynamic from "next/dynamic";

const ThreeDPackage = dynamic(() => import("@/components/ui/3d-package").then(m => m.ThreeDPackage), { ssr: false });

export function HeroSection() {
  return (
    <section className="relative pt-24 pb-12 sm:pt-32 sm:pb-20 md:pt-48 md:pb-32 overflow-hidden flex flex-col items-center justify-center min-h-[70vh] md:min-h-[80vh]">
      <div className="container mx-auto px-4 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Real-Time Courier Tracking
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold font-heading tracking-tight mb-6 leading-tight">
            Global Package Tracking <br className="hidden md:block" />
            <GradientText>All Couriers in One Place</GradientText>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Enter your tracking number to get instant delivery status, location updates, and notifications for over 500+ worldwide couriers.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <TrackingSearch />
        </motion.div>
      </div>

      {/* 3D Background Element */}
      <ThreeDPackage />

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div 
          className="absolute top-1/4 left-[10%] w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            y: [0, -20, 0],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-[10%] w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            y: [0, 30, 0],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </section>
  );
}
