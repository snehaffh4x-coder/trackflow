"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FileQuestion, Search, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientText } from "@/components/ui/gradient-text";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-20 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center relative z-10"
      >
        <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8 shadow-2xl relative">
          <div className="absolute inset-0 bg-primary/20 rounded-3xl animate-ping opacity-20" />
          <FileQuestion className="w-12 h-12 text-primary" />
        </div>
        
        <h1 className="text-7xl md:text-9xl font-black font-mono tracking-tighter mb-4 opacity-10">404</h1>
        
        <h2 className="text-3xl md:text-5xl font-bold font-heading mb-6">
          Package <GradientText>Not Found</GradientText>
        </h2>
        
        <p className="text-lg text-muted-foreground mb-12 max-w-md mx-auto">
          It looks like this page got lost in transit. Let's get you back on the right route.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/">
            <Button size="lg" className="h-14 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg w-full sm:w-auto">
              <Home className="w-5 h-5 mr-2" />
              Return Home
            </Button>
          </Link>
          <Link href="/track">
            <Button size="lg" variant="outline" className="h-14 px-8 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 w-full sm:w-auto">
              <Search className="w-5 h-5 mr-2" />
              Track Shipment
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
