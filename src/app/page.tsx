import { HeroSection } from "@/components/home/hero-section";
import { CouriersSection } from "@/components/home/couriers-section";
import { VisualSection } from "@/components/home/visual-section";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <CouriersSection />
      <VisualSection />
    </div>
  );
}
