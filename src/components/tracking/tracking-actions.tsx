"use client";

import { Copy, Share2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function TrackingActions({ trackingNumber }: { trackingNumber: string }) {
  
  const handleCopy = () => {
    navigator.clipboard.writeText(trackingNumber);
    toast.success("Tracking number copied to clipboard");
  };

  const handleShare = async () => {
    const shareData = {
      title: "TrackFlow Shipment",
      text: `Track shipment ${trackingNumber} on TrackFlow`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      handleCopy();
      toast.success("Link copied to clipboard");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex items-center gap-2 hide-on-print">
      <Button 
        variant="outline" 
        size="icon" 
        onClick={handleCopy}
        className="bg-background/50 hover:bg-white/10 hover:text-primary transition-colors border-white/10 rounded-xl"
        title="Copy tracking number"
      >
        <Copy className="w-4 h-4" />
      </Button>
      <Button 
        variant="outline" 
        size="icon" 
        onClick={handleShare}
        className="bg-background/50 hover:bg-white/10 hover:text-primary transition-colors border-white/10 rounded-xl"
        title="Share tracking link"
      >
        <Share2 className="w-4 h-4" />
      </Button>
      <Button 
        variant="outline" 
        size="icon" 
        onClick={handlePrint}
        className="bg-background/50 hover:bg-white/10 hover:text-primary transition-colors border-white/10 rounded-xl hidden sm:flex"
        title="Print details"
      >
        <Printer className="w-4 h-4" />
      </Button>
    </div>
  );
}
