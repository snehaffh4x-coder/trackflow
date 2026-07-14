"use client";

import { PageTransition } from "@/components/ui/page-transition";
import { GlassCard } from "@/components/ui/glass-card";
import { useVisitorLog } from "@/hooks/use-visitor-log";

export default function DisclaimerPage() {
  useVisitorLog();

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-32 md:py-40 max-w-4xl">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">Disclaimer</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        <GlassCard className="p-8 md:p-12 prose prose-invert prose-blue max-w-none">
          <h2>1. General Information</h2>
          <p>
            The information provided by TrackFlow ("we," "us," or "our") on our website is for general informational purposes only. 
            All information on the site is provided in good faith, however, we make no representation or warranty of any kind, 
            express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any 
            information on the site, particularly tracking data sourced from third parties.
          </p>

          <h2>2. Third-Party Tracking Data</h2>
          <p>
            TrackFlow is an independent package tracking aggregator. We are not affiliated with, endorsed by, or in any way 
            officially connected to FedEx, UPS, USPS, DHL, Amazon, or any other courier company whose tracking data is displayed 
            on our platform. All carrier names, logos, and brands are property of their respective owners.
          </p>

          <h2>3. No Liability for Delivery</h2>
          <p>
            TrackFlow does not handle, transport, or deliver packages. We solely provide a consolidated view of public tracking 
            data. We cannot resolve issues related to lost packages, delayed deliveries, customs holds, or misdeliveries. 
            For any such issues, you must contact the respective courier company directly.
          </p>

          <h2>4. Accuracy of Predictions</h2>
          <p>
            Any AI-powered delivery predictions or estimated delivery dates provided by our service are algorithmic estimations 
            based on historical data and current routing information. They are not guarantees of delivery dates. Actual delivery 
            times may vary due to weather, operational delays, customs processing, or other factors outside our control.
          </p>

          <h2>5. External Links</h2>
          <p>
            The site may contain links to other websites or content belonging to or originating from third parties. Such external 
            links are not investigated, monitored, or checked for accuracy, adequacy, validity, reliability, availability or 
            completeness by us.
          </p>

          <h2>6. Contact Us</h2>
          <p>
            If you have any questions about this disclaimer, please contact us at:
            <br />
            <strong>Email:</strong> legal@trackflow.app
          </p>
        </GlassCard>
      </div>
    </PageTransition>
  );
}
