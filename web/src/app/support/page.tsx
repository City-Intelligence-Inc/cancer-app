export const metadata = {
  title: "Support — Canopy",
};

export default function SupportPage() {
  return (
    <main className="min-h-screen px-6 py-16 max-w-2xl mx-auto">
      <h1 className="text-3xl font-extrabold text-text-primary mb-8">
        Support
      </h1>

      <div className="space-y-6 text-base text-text-secondary leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            About Canopy
          </h2>
          <p>
            Canopy matches cancer patients and carers with non-medical support
            resources — charities, peer groups, financial aid, and more — based
            on your location, diagnosis, and needs. We are not a medical service
            and do not provide medical advice.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            How It Works
          </h2>
          <ol className="list-decimal pl-6 space-y-1">
            <li>Enter your city to see nearby support resources</li>
            <li>
              Optionally use &quot;Refine search&quot; to answer a few questions
              about your age, diagnosis, treatment stage, and the kind of help
              you need
            </li>
            <li>
              Browse your personalised matches and visit the resources that fit
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <div>
              <p className="font-semibold text-text-primary">
                Is Canopy free to use?
              </p>
              <p>
                Yes. Canopy is completely free and does not require an account.
              </p>
            </div>

            <div>
              <p className="font-semibold text-text-primary">
                Is my data private?
              </p>
              <p>
                Yes. We don&apos;t collect your name, email, or any personally
                identifiable information. Session data is anonymous and
                automatically deleted after 30 days. See our{" "}
                <a href="/privacy" className="text-primary underline">
                  Privacy Policy
                </a>{" "}
                for details.
              </p>
            </div>

            <div>
              <p className="font-semibold text-text-primary">
                A resource link is broken or incorrect
              </p>
              <p>
                Please let us know at{" "}
                <a
                  href="mailto:support@cityintelligence.com"
                  className="text-primary underline"
                >
                  support@cityintelligence.com
                </a>{" "}
                and we&apos;ll fix it.
              </p>
            </div>

            <div>
              <p className="font-semibold text-text-primary">
                I want to suggest a resource
              </p>
              <p>
                We&apos;d love to hear from you. Email us at{" "}
                <a
                  href="mailto:support@cityintelligence.com"
                  className="text-primary underline"
                >
                  support@cityintelligence.com
                </a>{" "}
                with the organisation name, website, and what they offer.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            Contact Us
          </h2>
          <p>
            Email:{" "}
            <a
              href="mailto:support@cityintelligence.com"
              className="text-primary underline"
            >
              support@cityintelligence.com
            </a>
          </p>
          <p className="mt-2">
            Built by{" "}
            <span className="font-semibold text-text-primary">
              City Intelligence Inc.
            </span>
          </p>
        </section>
      </div>
    </main>
  );
}
