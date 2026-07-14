import { HeroSection } from "@/components/home/hero-section";
import { CouriersSection } from "@/components/home/couriers-section";
import { FeaturesSection } from "@/components/home/features-section";
import { HowItWorksSection } from "@/components/home/how-it-works-section";
import { StatsSection } from "@/components/home/stats-section";
import { PageTransition } from "@/components/ui/page-transition";

export default function Home() {
  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen">
        <HeroSection />
        <CouriersSection />
        <FeaturesSection />
        <HowItWorksSection />
        <StatsSection />
      </div>
    </PageTransition>
  );
}
