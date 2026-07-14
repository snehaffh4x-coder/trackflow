import { cn } from "@/lib/utils";
import { Loader2, Package } from "lucide-react";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "default" | "lg" | "xl";
  brand?: boolean;
}

export function LoadingSpinner({ className, size = "default", brand = false }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    default: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  if (brand) {
    return (
      <div className={cn("relative flex items-center justify-center", className)}>
        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
        <div className="relative bg-background rounded-full p-2 border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          <Package className={cn("text-primary animate-pulse", sizeClasses[size])} />
        </div>
      </div>
    );
  }

  return (
    <Loader2 className={cn("animate-spin text-muted-foreground", sizeClasses[size], className)} />
  );
}
