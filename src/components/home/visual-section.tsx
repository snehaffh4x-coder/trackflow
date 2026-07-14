import Image from "next/image";

export function VisualSection() {
  return (
    <section className="py-20 border-t border-white/5">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Global Tracking Image */}
          <div className="relative h-64 rounded-xl overflow-hidden border border-white/5">
            <Image
              src="/tracking-map.png"
              alt="Global package tracking"
              fill
              className="object-cover"
              quality={85}
            />
            <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-sm font-medium text-white">Global Tracking</p>
              <p className="text-xs text-neutral-400">150+ countries covered</p>
            </div>
          </div>

          {/* Warehouse Image */}
          <div className="relative h-64 rounded-xl overflow-hidden border border-white/5">
            <Image
              src="/warehouse.png"
              alt="Package sorting warehouse"
              fill
              className="object-cover"
              quality={85}
            />
            <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-sm font-medium text-white">Fast Processing</p>
              <p className="text-xs text-neutral-400">Real-time status updates</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
