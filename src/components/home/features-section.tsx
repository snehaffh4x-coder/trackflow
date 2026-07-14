"use client";

import { motion } from "framer-motion";
import { Zap, ShieldCheck, Map, BellRing, Sparkles, Smartphone } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";

const features = [
  {
    icon: Zap,
    title: "Real-time Tracking",
    description: "Get instant updates as your package moves through the logistics network. No delays.",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: Map,
    title: "Global Mapping",
    description: "Visualize the journey with interactive maps showing precise package locations.",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    icon: BellRing,
    title: "Smart Notifications",
    description: "Receive push notifications and emails for out-for-delivery and delivered events.",
    gradient: "from-orange-500 to-red-500"
  },
  {
    icon: ShieldCheck,
    title: "Secure & Private",
    description: "Your tracking history is encrypted and private. We don't sell your data.",
    gradient: "from-emerald-500 to-teal-500"
  },
  {
    icon: Sparkles,
    title: "AI Predictions",
    description: "Our machine learning models predict delivery times with 98% accuracy.",
    gradient: "from-indigo-500 to-blue-500"
  },
  {
    icon: Smartphone,
    title: "Mobile First",
    description: "Designed to look and feel like a native app on your phone or tablet.",
    gradient: "from-rose-500 to-orange-500"
  }
];

export function FeaturesSection() {
  return (
    <section className="py-24 relative z-10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold font-heading mb-4">
            Everything you need for <GradientText>perfect visibility</GradientText>
          </h2>
          <p className="text-lg text-muted-foreground">
            We've completely re-engineered the tracking experience from the ground up to be faster, smarter, and more beautiful.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <GlassCard className="p-8 h-full group">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-gradient-to-br ${feature.gradient} shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
