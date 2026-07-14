"use client";

import { PageTransition } from "@/components/ui/page-transition";
import { GlassCard } from "@/components/ui/glass-card";
import { useVisitorLog } from "@/hooks/use-visitor-log";

export default function PrivacyPage() {
  useVisitorLog();

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-32 md:py-40 max-w-4xl">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        <GlassCard className="p-8 md:p-12 prose prose-invert prose-blue max-w-none">
          <h2>1. Introduction</h2>
          <p>
            Welcome to TrackFlow. We respect your privacy and are committed to protecting your personal data. 
            This privacy policy will inform you as to how we look after your personal data when you visit our website 
            and tell you about your privacy rights and how the law protects you.
          </p>

          <h2>2. The Data We Collect About You</h2>
          <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
          <ul>
            <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
            <li><strong>Contact Data</strong> includes email address and telephone numbers.</li>
            <li><strong>Technical Data</strong> includes internet protocol (IP) address, browser type and version, time zone setting and location, operating system and platform.</li>
            <li><strong>Usage Data</strong> includes information about how you use our website, products and services (including tracking numbers you search for).</li>
          </ul>

          <h2>3. How We Use Your Data</h2>
          <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
          <ul>
            <li><strong>Service Delivery:</strong> To perform the contract we are about to enter into or have entered into with you, including providing accurate tracking information and resolving delivery exceptions.</li>
            <li><strong>Security & Fraud Prevention:</strong> To ensure the security of our services, prevent fraudulent activities, verify identities, and protect against malicious bots or unauthorized automated access.</li>
            <li><strong>Service Improvement & Analytics:</strong> Where it is necessary for our legitimate interests (or those of a third party) to improve our products, services, and user experience, provided your interests and fundamental rights do not override those interests.</li>
            <li><strong>Legal Compliance:</strong> Where we need to comply with a legal or regulatory obligation.</li>
          </ul>

          <h2>4. Data Security</h2>
          <p>
            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, 
            used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data 
            to those employees, agents, contractors and other third parties who have a business need to know.
          </p>

          <h2>5. Your Legal Rights</h2>
          <p>Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:</p>
          <ul>
            <li>Request access to your personal data.</li>
            <li>Request correction of your personal data.</li>
            <li>Request erasure of your personal data.</li>
            <li>Object to processing of your personal data.</li>
            <li>Request restriction of processing your personal data.</li>
          </ul>

          <h2>6. Contact Us</h2>
          <p>
            If you have any questions about this privacy policy or our privacy practices, please contact us at:
            <br />
            <strong>Email:</strong> privacy@trackflow.app
          </p>
        </GlassCard>
      </div>
    </PageTransition>
  );
}
