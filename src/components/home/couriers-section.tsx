import Image from "next/image";
import { COURIERS } from "@/lib/utils";

export function CouriersSection() {
  return (
    <section className="py-16 border-t border-white/5">
      <div className="container mx-auto px-4">
        <p className="text-center text-xs font-medium text-neutral-500 uppercase tracking-[0.25em] mb-10">
          Supported Couriers
        </p>

        {/* Courier grid with image */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          {/* Left: Courier logos as simple text list */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-x-8 gap-y-4">
            {COURIERS.map((courier) => (
              <div 
                key={courier.code}
                className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
              >
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: courier.color }}
                />
                <span className="text-sm font-medium">{courier.name}</span>
              </div>
            ))}
          </div>

          {/* Right: Professional courier image */}
          <div className="relative h-64 lg:h-80 rounded-xl overflow-hidden">
            <Image
              src="/courier-trust.png"
              alt="Courier delivery"
              fill
              className="object-cover rounded-xl"
              quality={85}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
