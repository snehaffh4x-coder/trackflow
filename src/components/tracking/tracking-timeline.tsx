"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, MapPin, Truck } from "lucide-react";
import { formatDateTime, timeAgo } from "@/lib/utils";
import type { TrackingEvent } from "@/types";

export function TrackingTimeline({ events }: { events: TrackingEvent[] }) {
  return (
    <div className="relative">
      {/* Vertical line connecting steps */}
      <div className="absolute left-[15px] md:left-[147px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-white/10" />

      <div className="space-y-8">
        {events.map((event, index) => {
          const isLatest = index === 0;
          
          let Icon = Clock;
          if (event.status.toLowerCase().includes("delivered")) Icon = CheckCircle2;
          else if (event.status.toLowerCase().includes("transit")) Icon = Truck;
          else if (event.status.toLowerCase().includes("out for delivery")) Icon = Truck;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`relative flex flex-col md:flex-row md:items-start gap-4 md:gap-8 group ${
                isLatest ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {/* Date/Time (Desktop) */}
              <div className="hidden md:block w-[100px] text-right shrink-0 pt-1">
                <div className="text-sm font-medium">{event.date.split("T")[0]}</div>
                <div className="text-xs opacity-70">{event.time}</div>
              </div>

              {/* Icon & Content */}
              <div className="flex gap-4 md:gap-0 flex-1">
                {/* Status Icon */}
                <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-background border-2 border-primary group-hover:scale-110 transition-transform shrink-0 md:mr-8">
                  {isLatest ? (
                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                  ) : null}
                  <Icon className={`w-4 h-4 ${isLatest ? "text-primary" : "text-muted-foreground"}`} />
                </div>

                {/* Event Content */}
                <div className="flex-1 pb-2">
                  <h4 className={`text-lg font-semibold mb-1 ${isLatest ? "text-primary" : ""}`}>
                    {event.status}
                  </h4>
                  <p className="text-sm leading-relaxed mb-2 opacity-90">
                    {event.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                    <span className="flex items-center gap-1 opacity-70">
                      <MapPin className="w-3.5 h-3.5" />
                      {event.location}
                    </span>
                    
                    {/* Date/Time (Mobile) */}
                    <span className="md:hidden opacity-70">
                      {formatDateTime(event.date).split(",")[0]} • {event.time}
                    </span>
                    
                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 opacity-70">
                      {timeAgo(event.date)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
