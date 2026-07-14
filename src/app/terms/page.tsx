"use client";

import { PageTransition } from "@/components/ui/page-transition";
import { GlassCard } from "@/components/ui/glass-card";
import { useVisitorLog } from "@/hooks/use-visitor-log";

export default function TermsPage() {
  useVisitorLog();

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-32 md:py-40 max-w-4xl">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        <GlassCard className="p-8 md:p-12 prose prose-invert prose-blue max-w-none">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using TrackFlow ("the Service"), you agree to be bound by these Terms of Service. 
            If you do not agree to these terms, please do not use our Service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            TrackFlow provides package tracking aggregation services. We collect and display tracking information 
            from various third-party couriers and logistics providers. We do not handle, ship, or deliver any packages ourselves.
          </p>

          <h2>3. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any illegal purpose or in violation of any local, state, national, or international law.</li>
            <li>Violate, or encourage others to violate, any right of a third party, including by infringing or misappropriating any third-party intellectual property right.</li>
            <li>Attempt to bypass any security measures of the Service.</li>
            <li>Use automated systems (bots, spiders, scrapers) to access the Service without our express written permission.</li>
            <li>Submit false, inaccurate, or misleading information.</li>
          </ul>

          <h2>4. Data Collection & Fraud Prevention</h2>
          <p>
            To maintain the security and integrity of our Service, we employ automated systems to detect and prevent fraudulent activities. By using the Service, you consent to the collection of information such as your name, contact details, device information, and IP address. This data is used solely for security verification, service optimization, and ensuring a safe environment for all users, in compliance with applicable laws and our Privacy Policy.
          </p>

          <h2>5. Third-Party Data</h2>
          <p>
            The tracking data provided through our Service is sourced from third-party couriers. We do not guarantee the 
            accuracy, completeness, or timeliness of this data. We are not responsible for any delays or errors in the tracking information.
          </p>

          <h2>6. Limitation of Liability</h2>
          <p>
            In no event shall TrackFlow, its directors, employees, partners, agents, suppliers, or affiliates, be liable for any 
            indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, 
            use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; 
            (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and 
            (iv) unauthorized access, use or alteration of your transmissions or content.
          </p>

          <h2>7. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a 
            material change will be determined at our sole discretion.
          </p>

          <h2>8. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
            <br />
            <strong>Email:</strong> legal@trackflow.app
          </p>
        </GlassCard>
      </div>
    </PageTransition>
  );
}
