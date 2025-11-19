import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Privacy() {
  return (
    <s-page
      title="Privacy Policy"
      subtitle="How we collect, use, and protect your data"
    >
      <s-layout>
        <s-layout-section>
          <s-card>
            <s-card-section>
              <s-text-container>
                <s-heading>Introduction</s-heading>
                <s-text-block>
                  This Privacy Policy describes how Kopy Products ("we", "us", or "our") collects, uses, and shares information when you use our Shopify application.
                </s-text-block>

                <s-heading>Information We Collect</s-heading>
                <s-text-block>
                  We collect the following types of information:
                </s-text-block>
                <s-list type="bullet">
                  <s-list-item>Store information (store name, domain, email)</s-list-item>
                  <s-list-item>Product data that you choose to import</s-list-item>
                  <s-list-item>Usage data and analytics</s-list-item>
                  <s-list-item>Technical information (IP address, browser type)</s-list-item>
                </s-list>

                <s-heading>How We Use Your Information</s-heading>
                <s-text-block>
                  We use the collected information to:
                </s-text-block>
                <s-list type="bullet">
                  <s-list-item>Provide and maintain our service</s-list-item>
                  <s-list-item>Process product imports and synchronization</s-list-item>
                  <s-list-item>Improve and optimize our application</s-list-item>
                  <s-list-item>Communicate with you about updates and support</s-list-item>
                  <s-list-item>Ensure security and prevent fraud</s-list-item>
                </s-list>

                <s-heading>Data Storage and Security</s-heading>
                <s-text-block>
                  We implement appropriate technical and organizational measures to protect your personal information. Your data is stored securely and we follow industry best practices for data protection.
                </s-text-block>

                <s-heading>Data Sharing</s-heading>
                <s-text-block>
                  We do not sell, trade, or rent your personal information to third parties. We may share information with:
                </s-text-block>
                <s-list type="bullet">
                  <s-list-item>Service providers who assist in operating our application</s-list-item>
                  <s-list-item>Law enforcement when required by law</s-list-item>
                </s-list>

                <s-heading>Your Rights</s-heading>
                <s-text-block>
                  You have the right to:
                </s-text-block>
                <s-list type="bullet">
                  <s-list-item>Access your personal data</s-list-item>
                  <s-list-item>Request correction of inaccurate data</s-list-item>
                  <s-list-item>Request deletion of your data</s-list-item>
                  <s-list-item>Withdraw consent at any time</s-list-item>
                </s-list>

                <s-heading>Data Retention</s-heading>
                <s-text-block>
                  We retain your information only for as long as necessary to provide our services and comply with legal obligations. When you uninstall the app, your data will be deleted according to our retention policy.
                </s-text-block>

                <s-heading>Contact Us</s-heading>
                <s-text-block>
                  If you have any questions about this Privacy Policy, please contact us through the Support page.
                </s-text-block>

                <s-heading>Updates to This Policy</s-heading>
                <s-text-block>
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date.
                </s-text-block>

                <s-text-block>
                  <strong>Last Updated: November 19, 2025</strong>
                </s-text-block>
              </s-text-container>
            </s-card-section>
          </s-card>
        </s-layout-section>
      </s-layout>
    </s-page>
  );
}
