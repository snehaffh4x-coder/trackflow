import { Skeleton } from "@/components/ui/skeleton";

export function TrackingSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl mb-8">
        
        {/* Header Skeleton */}
        <div className="p-6 md:p-8 border-b border-white/5">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-3">
              <Skeleton className="h-5 w-32 bg-white/5" />
              <Skeleton className="h-10 w-64 bg-white/5" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-10 rounded-xl bg-white/5" />
              <Skeleton className="h-10 w-10 rounded-xl bg-white/5" />
              <Skeleton className="h-10 w-10 rounded-xl bg-white/5 hidden sm:block" />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-24 w-full rounded-xl bg-white/5" />
            <Skeleton className="h-24 w-full rounded-xl bg-white/5" />
            <Skeleton className="h-24 w-full rounded-xl bg-white/5" />
          </div>
        </div>

        {/* Progress Skeleton */}
        <div className="p-6 md:p-8 border-b border-white/5">
          <div className="flex justify-between mb-4">
            <Skeleton className="h-4 w-16 bg-white/5" />
            <Skeleton className="h-4 w-16 bg-white/5" />
            <Skeleton className="h-4 w-24 bg-white/5" />
            <Skeleton className="h-4 w-20 bg-white/5" />
          </div>
          <Skeleton className="h-2 w-full rounded-full bg-white/5" />
        </div>

        {/* Timeline Skeleton */}
        <div className="p-6 md:p-8">
          <Skeleton className="h-6 w-48 bg-white/5 mb-8" />
          
          <div className="space-y-8 pl-8 md:pl-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 md:gap-8">
                <Skeleton className="hidden md:block h-10 w-[100px] bg-white/5 shrink-0" />
                <Skeleton className="h-8 w-8 rounded-full bg-white/5 shrink-0 absolute left-8 md:relative md:left-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-48 bg-white/5" />
                  <Skeleton className="h-4 w-full max-w-md bg-white/5" />
                  <Skeleton className="h-4 w-32 bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
        
      </div>
    </div>
  );
}
