"use client";

import Link from "next/link";
import { Package, Globe, MessageCircle, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 pt-16 pb-8 mt-auto">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-gray-900 hover:text-blue-600 transition-colors">
              <Package className="w-6 h-6" />
              <span className="font-bold text-xl tracking-tight">TrackFlow</span>
            </Link>
            <p className="text-gray-600 text-sm leading-relaxed max-w-xs">
              Track your packages across all major Indian couriers in one place.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Globe className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <MessageCircle className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Mail className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Product</h3>
            <ul className="space-y-3">
              <li><Link href="/track" className="text-sm text-muted-foreground hover:text-primary transition-colors">Track Package</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">Legal</h3>
            <ul className="space-y-3">
              <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/disclaimer" className="text-sm text-muted-foreground hover:text-primary transition-colors">Disclaimer</Link></li>
            </ul>
          </div>
        </div>



        <div className="pt-8 border-t border-gray-300 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} TrackFlow. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            Built with <span className="text-red-500 mx-1">❤</span> using Next.js 15
          </div>
        </div>
      </div>
    </footer>
  );
}
