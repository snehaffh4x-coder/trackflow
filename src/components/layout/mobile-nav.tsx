"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types";

export function MobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-10 w-10 md:hidden">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px] border-l border-gray-200 bg-white">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <nav className="flex flex-col gap-6 mt-12">
          {items.map((item, index) => {
            const Icon = (item as any).icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-4 text-lg font-medium transition-all p-3 rounded-md hover:bg-gray-50",
                  isActive ? "text-blue-600 bg-blue-50" : "text-gray-600"
                )}
                style={{
                  animation: `slide-up 0.3s ease-out ${index * 0.1}s forwards`,
                  opacity: 0,
                }}
              >
                {Icon && <Icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "")} />}
                {item.label}
              </Link>
            );
          })}
          
          <div className="mt-8 px-3">
            <Link href="/admin" onClick={() => setOpen(false)}>
              <Button variant="outline" className="w-full justify-start gap-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-900 rounded-md">
                Admin Dashboard
              </Button>
            </Link>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
