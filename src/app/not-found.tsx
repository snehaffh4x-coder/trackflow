"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FileQuestion, Search, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-20 bg-white">
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center relative z-10"
      >
        <div className="w-24 h-24 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-8 shadow-sm relative">
          <FileQuestion className="w-12 h-12 text-blue-600" />
        </div>
        
        <h1 className="text-7xl md:text-9xl font-black font-mono tracking-tighter mb-4 text-gray-200">404</h1>
        
        <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900">
          Package Not Found
        </h2>
        
        <p className="text-lg text-gray-600 mb-12 max-w-md mx-auto">
          It looks like this page got lost in transit. Let's get you back on the right route.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/">
            <Button size="lg" className="h-14 px-8 rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-sm w-full sm:w-auto">
              <Home className="w-5 h-5 mr-2" />
              Return Home
            </Button>
          </Link>
          <Link href="/track">
            <Button size="lg" variant="outline" className="h-14 px-8 rounded-md bg-white border-gray-300 hover:bg-gray-50 hover:text-blue-600 text-gray-700 w-full sm:w-auto">
              <Search className="w-5 h-5 mr-2" />
              Track Shipment
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
