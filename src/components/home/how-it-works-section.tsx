"use client";

import { motion } from "framer-motion";
import { Search, Radar, CheckCircle } from "lucide-react";
import { GradientText } from "@/components/ui/gradient-text";

const steps = [
  {
    icon: Search,
    title: "Enter Tracking Number",
    description: "Simply paste any tracking number. We'll auto-detect the courier from over 500+ supported carriers worldwide."
  },
  {
    icon: Radar,
    title: "We Track It Down",
    description: "Our system connects to carrier APIs in real-time, pulling the latest location, status, and timeline data instantly."
  },
  {
    icon: CheckCircle,
    title: "Get Notified",
    description: "See the exact location on a map and receive push notifications when your package is out for delivery."
  }
];

export function HowItWorksSection() {
  return (
    <section className="py-24 relative z-10 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold font-heading mb-4">
            How it <GradientText>Works</GradientText>
          </h2>
          <p className="text-lg text-muted-foreground">
            Three simple steps to complete peace of mind.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.2 }}
                  className="relative flex flex-col items-center text-center"
                >
                  <div className="w-24 h-24 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center mb-6 relative z-10 shadow-[0_0_30px_rgba(59,130,246,0.15)] group hover:border-primary/50 transition-colors">
                    <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-20" style={{ animationDelay: `${i * 1.5}s` }} />
                    <Icon className="w-10 h-10 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  
                  <h3 className="text-2xl font-semibold mb-4">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed max-w-xs">
                    {step.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
