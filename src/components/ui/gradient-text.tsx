import { cn } from "@/lib/utils";
import React from "react";

interface GradientTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  as?: "span" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export function GradientText({ children, className, as: Component = "span", ...props }: GradientTextProps) {
  return (
    <Component 
      className={cn("text-gradient", className)} 
      {...props}
    >
      {children}
    </Component>
  );
}
