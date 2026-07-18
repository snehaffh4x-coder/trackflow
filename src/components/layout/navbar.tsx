"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Package, Search, Shield, Info, Phone, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";
import { useMediaQuery } from "@/hooks/use-media-query";

const NAV_ITEMS = [
  { label: "Track", href: "/track", icon: Search },
];

export function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="w-full bg-white border-b border-gray-200 py-4">
      <div className="container mx-auto px-4 md:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-gray-900 hover:text-blue-600 transition-colors">
          <Package className="w-6 h-6" />
          <span className="font-bold text-xl tracking-tight">TrackFlow</span>
        </Link>

        {!isMobile && (
          <nav className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary relative group",
                  pathname === item.href ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
                <span 
                  className={cn(
                    "absolute -bottom-1 left-0 w-full h-0.5 bg-primary rounded-full transition-all duration-300",
                    pathname === item.href ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-50"
                  )}
                />
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-4">
          <Link href="/track">
            <Button className="rounded-md px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium">
              Track Package
            </Button>
          </Link>
          {isMobile && <MobileNav items={NAV_ITEMS} />}
        </div>
      </div>
    </header>
  );
}
