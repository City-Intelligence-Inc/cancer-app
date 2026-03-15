export const metadata = {
  title: "Privacy Policy — Canopy",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-6 py-16 max-w-2xl mx-auto">
      <h1 className="text-3xl font-extrabold text-text-primary mb-8">
        Privacy Policy
      </h1>
      <p className="text-sm text-text-secondary mb-8">
        Last updated: 13 March 2026
      </p>

      <div className="space-y-6 text-base text-text-secondary leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            What Canopy Does
          </h2>
          <p>
            Canopy helps cancer patients and carers find non-medical support
            resources based on their location, diagnosis, age, treatment stage,
            role, and the type of help they need. We do not provide medical
            advice, diagnosis, or treatment.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            Information We Collect
          </h2>
          <p>
            When you use Canopy, we collect the answers you provide during the
            matching process (age range, location, diagnosis type, treatment
            stage, role, and help types). This information is stored temporarily
            in an anonymous session — we do not ask for your name, email, or any
            other personally identifiable information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            How We Use Your Information
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>To match you with relevant support resources</li>
            <li>
              To improve the quality and relevance of our matching algorithm
            </li>
            <li>To understand aggregate usage patterns (no individual tracking)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            Data Storage & Retention
          </h2>
          <p>
            Session data is stored in AWS DynamoDB and automatically expires
            after 30 days. We do not sell, share, or transfer your data to third
            parties. All data is transmitted over encrypted connections (HTTPS).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            No Account Required
          </h2>
          <p>
            Canopy does not require you to create an account. You can use the app
            completely anonymously. We do not use cookies for tracking or
            advertising purposes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            Third-Party Services
          </h2>
          <p>
            We use AWS (Amazon Web Services) for hosting and data storage.
            Resource links may direct you to third-party charity websites, which
            have their own privacy policies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            Children&apos;s Privacy
          </h2>
          <p>
            Canopy is not directed at children under 13. We do not knowingly
            collect information from children under 13.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            Changes to This Policy
          </h2>
          <p>
            We may update this privacy policy from time to time. Changes will be
            posted on this page with an updated revision date.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">Contact</h2>
          <p>
            If you have questions about this privacy policy, please contact us at{" "}
            <a
              href="mailto:support@cityintelligence.com"
              className="text-primary underline"
            >
              support@cityintelligence.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
