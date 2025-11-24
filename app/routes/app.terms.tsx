import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Terms() {
  return (
    <s-page
      title="Terms of Service"
      subtitle="Terms and conditions for using Poky-fy Import & Copy Products"
    >
      <s-layout>
        <s-layout-section>
          <s-card>
            <s-card-section>
              <s-text-container>
                <s-heading>Agreement to Terms</s-heading>
                <s-text-block>
                  By installing and using Poky-fy Import & Copy Products, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our application.
                </s-text-block>

                <s-heading>Description of Service</s-heading>
                <s-text-block>
                  Poky-fy Import & Copy Products is a Shopify application that enables merchants to import and manage products from external sources. The service includes:
                </s-text-block>
                <s-list type="bullet">
                  <s-list-item>Product import functionality</s-list-item>
                  <s-list-item>Bulk product operations</s-list-item>
                  <s-list-item>Product synchronization</s-list-item>
                  <s-list-item>Import history tracking</s-list-item>
                </s-list>

                <s-heading>User Obligations</s-heading>
                <s-text-block>
                  You agree to:
                </s-text-block>
                <s-list type="bullet">
                  <s-list-item>Provide accurate information during registration and use</s-list-item>
                  <s-list-item>Maintain the security of your Shopify store credentials</s-list-item>
                  <s-list-item>Use the service only for lawful purposes</s-list-item>
                  <s-list-item>Respect intellectual property rights of product content</s-list-item>
                  <s-list-item>Comply with all applicable laws and regulations</s-list-item>
                </s-list>

                <s-heading>Intellectual Property</s-heading>
                <s-text-block>
                  You are responsible for ensuring that you have the right to import and use any product content. We do not claim ownership of any product data you import through our service.
                </s-text-block>

                <s-heading>Service Availability</s-heading>
                <s-text-block>
                  While we strive to maintain high availability, we do not guarantee uninterrupted access to the service. We may:
                </s-text-block>
                <s-list type="bullet">
                  <s-list-item>Perform scheduled maintenance</s-list-item>
                  <s-list-item>Make updates or improvements</s-list-item>
                  <s-list-item>Temporarily suspend service for technical reasons</s-list-item>
                </s-list>

                <s-heading>Limitation of Liability</s-heading>
                <s-text-block>
                  To the maximum extent permitted by law, Poky-fy Import & Copy Products shall not be liable for:
                </s-text-block>
                <s-list type="bullet">
                  <s-list-item>Indirect, incidental, or consequential damages</s-list-item>
                  <s-list-item>Loss of profits, data, or business opportunities</s-list-item>
                  <s-list-item>Errors or inaccuracies in imported product data</s-list-item>
                  <s-list-item>Third-party content or services</s-list-item>
                </s-list>

                <s-heading>Termination</s-heading>
                <s-text-block>
                  We reserve the right to suspend or terminate your access to the service if:
                </s-text-block>
                <s-list type="bullet">
                  <s-list-item>You violate these Terms of Service</s-list-item>
                  <s-list-item>You engage in fraudulent or illegal activities</s-list-item>
                  <s-list-item>We discontinue the service</s-list-item>
                </s-list>
                <s-text-block>
                  You may terminate your use of the service at any time by uninstalling the application from your Shopify store.
                </s-text-block>

                <s-heading>Payment and Refunds</s-heading>
                <s-text-block>
                  Billing is handled through Shopify's billing system. All charges are subject to Shopify's terms. Refunds, if applicable, will be processed according to our refund policy.
                </s-text-block>

                <s-heading>Modifications to Terms</s-heading>
                <s-text-block>
                  We reserve the right to modify these Terms of Service at any time. We will notify you of significant changes. Continued use of the service after changes constitutes acceptance of the modified terms.
                </s-text-block>

                <s-heading>Governing Law</s-heading>
                <s-text-block>
                  These Terms of Service shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.
                </s-text-block>

                <s-heading>Contact Information</s-heading>
                <s-text-block>
                  For questions about these Terms of Service, please visit our Support page.
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
