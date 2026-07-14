"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useSpring, useTransform, motion } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  direction?: "up" | "down";
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function AnimatedCounter({
  value,
  direction = "up",
  duration = 2,
  className,
  prefix = "",
  suffix = "",
  decimals = 0,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (inView && !hasStarted) {
      setHasStarted(true);
    }
  }, [inView, hasStarted]);

  const startValue = direction === "up" ? 0 : value * 2;
  
  const spring = useSpring(startValue, {
    duration: duration * 1000,
    bounce: 0,
  });
  
  const displayValue = useTransform(spring, (current) => {
    return prefix + current.toFixed(decimals) + suffix;
  });

  useEffect(() => {
    if (hasStarted) {
      spring.set(value);
    }
  }, [hasStarted, spring, value]);

  return <motion.span ref={ref} className={className}>{displayValue}</motion.span>;
}
