export function PrivacyPolicy() {
  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col gap-2">
      <div className="ghost max-w-[83ch]">
        <h1 className="!pb-6 leading-[42px]">Privacy Policy</h1>

        <div className="space-y-4 pb-4 text-sm">
          <h3>TL;DR</h3>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              We use cookies for authentication and to enable certain features.
            </li>
            <li>
              Your attachments are stored in an AWS S3 bucket, we use Cloudfront
              as a CDN.
            </li>
            <li>Website is being protected by Cloudflare.</li>

            <li>We will NEVER sell your data!</li>
          </ul>
        </div>

        <div className="space-y-4 text-sm">
          <h3>Introduction</h3>
          <p>
            Our privacy policy will help you understand what information we
            collect at{" "}
            <strong className="whitespace-nowrap">folkscommunity.com</strong>{" "}
            ("website"), how we use it, and what choices you have. If you choose
            to use our Service, then you agree to the collection and use of
            information in relation with this policy. The Personal Information
            that we collect are used for providing and improving the Service. We
            will not use or share your information with anyone except as
            described in this Privacy Policy.
          </p>
          <p>
            The terms used in this Privacy Policy have the same meanings as in
            our Terms and Conditions, which is accessible in our website, unless
            otherwise defined in this Privacy Policy.
          </p>
          <h3>Information</h3>
          <p>
            For a better experience while using our Service, we may require you
            to provide us with certain personally identifiable information,
            including but not limited to users name, email address, gender,
            location, pictures. The information that we request will be retained
            by us and used as described in this privacy policy.
          </p>
          <p>
            The app does use third party services that may collect information
            used to identify you.
          </p>
          <h3>Cookies</h3>
          <p>
            Cookies are files with small amount of data that is commonly used an
            anonymous unique identifier. These are sent to your browser from the
            website that you visit and are stored on your devices's internal
            memory.
          </p>
          <p className="font-bold">
            We use cookies for authentication, and for internal analytics.
          </p>
          <h3>Data Sale Policy</h3>
          <p>
            We will <strong>NEVER</strong> sell your data. Your privacy and
            trust are of utmost importance to us, and we are committed to
            protecting your personal information.
          </p>
          <h3>Device Information</h3>
          <p>
            We collect information from your device in some cases. The
            information will be utilized for the provision of better service and
            to prevent fraudulent acts.
          </p>
          <h3>Service Providers</h3>
          <p>
            We may employ third-party companies and individuals due to the
            following reasons:
          </p>
          <ul className="list-disc space-y-1 pl-6">
            <li>To facilitate our Service;</li>
            <li>To provide the Service on our behalf;</li>
            <li>To perform Service-related services; or</li>
            <li>To assist us in analyzing how our Service is used.</li>
          </ul>
          <p>
            We want to inform users of this Service that these third parties
            have access to your Personal Information. The reason is to perform
            the tasks assigned to them on our behalf. However, they are
            obligated not to disclose or use the information for any other
            purpose.
          </p>
          <p>Current third party service providers include:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Cloudflare - reverse proxy & cdn</li>
            <li>AWS - attachment storage, cdn and email delivery</li>
            <li>Sentry - error reporting</li>
            <li>
              PostHog - product analytics, feature flagging, and session
              recording to improve user experience
            </li>
            <li>Plausible (self hosted) - analytics</li>
          </ul>

          <h3>Analytics and Feature Management</h3>
          <p>
            We use PostHog to help us understand how our service is used and to
            provide better features. PostHog collects information about:
          </p>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              How you interact with our website (clicks, page views, navigation
              patterns)
            </li>
            <li>Technical information (browser type, device information)</li>
            <li>Feature flag preferences and configurations</li>
            <li>
              Session recordings (which help us identify and fix usability
              issues)
            </li>
          </ul>
          <p>
            PostHog processes this data in accordance with their{" "}
            <a
              href="https://posthog.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:font-bold"
            >
              privacy policy
            </a>
            .
          </p>

          <h3>Security</h3>
          <p>
            We value your trust in providing us your Personal Information, thus
            we are striving to use commercially acceptable means of protecting
            it. But remember that no method of transmission over the internet,
            or method of electronic storage is 100% secure and reliable, and we
            cannot guarantee its absolute security.
          </p>
          <h3>Data Deletion</h3>
          <p>
            You have the right to request the deletion of your personal data at
            any time. If you wish to delete your data, please contact us at{" "}
            <a
              href="mailto:help@folkscommunity.com"
              className="font-bold hover:underline"
            >
              help@folkscommunity.com
            </a>{" "}
            with your request. We will process your request promptly, and your
            data will be permanently deleted from our servers unless we are
            required to retain it for legal or regulatory reasons.
          </p>
          <h3>Age Restriction</h3>
          <p>
            Our Services are intended for users who are at least 18 years old.
            We do not knowingly collect personal identifiable information from
            individuals under 18. If you are a parent or guardian and you become
            aware that your child has provided us with personal information,
            please contact us immediately so we can take appropriate action to
            delete that information.
          </p>
          <h3>Changes to This Privacy Policy</h3>
          <p>
            We may update our Privacy Policy from time to time. Thus, you are
            advised to review this page periodically for any changes. These
            changes are effective immediately, after they are posted on this
            page.
          </p>
          <h3>Contact Us</h3>
          <p>
            If you have any questions or suggestions about our Privacy Policy,
            do not hesitate to contact us at:{" "}
            <a
              href="mailto:help@folkscommunity.com"
              className="underline hover:font-bold"
            >
              help@folkscommunity.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
