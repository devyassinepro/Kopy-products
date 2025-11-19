import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function GDPR() {
  return (
    <s-page
      title="GDPR Compliance"
      subtitle="General Data Protection Regulation compliance information"
    >
      <s-layout>
        <s-layout-section>
          <s-card>
            <s-card-section>
              <s-text-container>
                <s-heading>Our Commitment to GDPR</s-heading>
                <s-text-block>
                  Kopy Products is committed to protecting your privacy and ensuring compliance with the General Data Protection Regulation (GDPR). This page outlines how we handle your personal data in accordance with GDPR requirements.
                </s-text-block>

                <s-heading>Legal Basis for Processing</s-heading>
                <s-text-block>
                  We process your personal data under the following legal bases:
                </s-text-block>
                <s-list type="bullet">
                  <s-list-item><strong>Consent:</strong> When you install and use our application</s-list-item>
                  <s-list-item><strong>Contract:</strong> To provide the services you've requested</s-list-item>
                  <s-list-item><strong>Legitimate Interest:</strong> To improve our services and ensure security</s-list-item>
                  <s-list-item><strong>Legal Obligation:</strong> To comply with applicable laws and regulations</s-list-item>
                </s-list>

                <s-heading>Your Rights Under GDPR</s-heading>
                <s-text-block>
                  As a data subject under GDPR, you have the following rights:
                </s-text-block>

                <s-text-block>
                  <strong>1. Right to Access</strong>
                </s-text-block>
                <s-text-block>
                  You have the right to request a copy of all personal data we hold about you. We will provide this information in a commonly used, machine-readable format.
                </s-text-block>

                <s-text-block>
                  <strong>2. Right to Rectification</strong>
                </s-text-block>
                <s-text-block>
                  You can request correction of any inaccurate or incomplete personal data we hold about you.
                </s-text-block>

                <s-text-block>
                  <strong>3. Right to Erasure (Right to be Forgotten)</strong>
                </s-text-block>
                <s-text-block>
                  You can request deletion of your personal data when it's no longer necessary for the purposes it was collected, or if you withdraw your consent.
                </s-text-block>

                <s-text-block>
                  <strong>4. Right to Restriction of Processing</strong>
                </s-text-block>
                <s-text-block>
                  You can request that we restrict processing of your personal data in certain circumstances.
                </s-text-block>

                <s-text-block>
                  <strong>5. Right to Data Portability</strong>
                </s-text-block>
                <s-text-block>
                  You can request to receive your personal data in a structured, commonly used, machine-readable format and transmit it to another controller.
                </s-text-block>

                <s-text-block>
                  <strong>6. Right to Object</strong>
                </s-text-block>
                <s-text-block>
                  You can object to processing of your personal data for direct marketing purposes or based on legitimate interests.
                </s-text-block>

                <s-text-block>
                  <strong>7. Right to Withdraw Consent</strong>
                </s-text-block>
                <s-text-block>
                  You can withdraw your consent at any time by uninstalling the application.
                </s-text-block>

                <s-heading>Data We Collect</s-heading>
                <s-text-block>
                  We collect and process the following categories of personal data:
                </s-text-block>
                <s-list type="bullet">
                  <s-list-item>Store identification data (shop domain, name)</s-list-item>
                  <s-list-item>Contact information (email address)</s-list-item>
                  <s-list-item>Product data you choose to import</s-list-item>
                  <s-list-item>Usage data and application logs</s-list-item>
                  <s-list-item>Technical data (IP address, session information)</s-list-item>
                </s-list>

                <s-heading>How We Protect Your Data</s-heading>
                <s-text-block>
                  We implement appropriate technical and organizational measures to ensure data security:
                </s-text-block>
                <s-list type="bullet">
                  <s-list-item>Encryption of data in transit and at rest</s-list-item>
                  <s-list-item>Regular security assessments and updates</s-list-item>
                  <s-list-item>Access controls and authentication</s-list-item>
                  <s-list-item>Data minimization principles</s-list-item>
                  <s-list-item>Secure data storage with regular backups</s-list-item>
                </s-list>

                <s-heading>Data Retention</s-heading>
                <s-text-block>
                  We retain personal data only for as long as necessary:
                </s-text-block>
                <s-list type="bullet">
                  <s-list-item>Active usage data: While you use the service</s-list-item>
                  <s-list-item>Account data: 30 days after app uninstallation</s-list-item>
                  <s-list-item>Legal compliance data: As required by applicable laws</s-list-item>
                </s-list>

                <s-heading>International Data Transfers</s-heading>
                <s-text-block>
                  If we transfer your data outside the European Economic Area (EEA), we ensure appropriate safeguards are in place, such as:
                </s-text-block>
                <s-list type="bullet">
                  <s-list-item>Standard Contractual Clauses approved by the European Commission</s-list-item>
                  <s-list-item>Adequacy decisions for certain countries</s-list-item>
                  <s-list-item>Privacy Shield certification (where applicable)</s-list-item>
                </s-list>

                <s-heading>Data Breach Notification</s-heading>
                <s-text-block>
                  In the event of a data breach that poses a risk to your rights and freedoms, we will:
                </s-text-block>
                <s-list type="bullet">
                  <s-list-item>Notify the relevant supervisory authority within 72 hours</s-list-item>
                  <s-list-item>Inform affected users without undue delay</s-list-item>
                  <s-list-item>Provide information about the breach and remedial actions</s-list-item>
                </s-list>

                <s-heading>Exercising Your Rights</s-heading>
                <s-text-block>
                  To exercise any of your GDPR rights, please contact us at:
                </s-text-block>
                <s-list type="bullet">
                  <s-list-item>Email: privacy@kopyproducts.com</s-list-item>
                  <s-list-item>Subject: GDPR Data Request</s-list-item>
                </s-list>
                <s-text-block>
                  We will respond to your request within 30 days. You also have the right to lodge a complaint with your local supervisory authority.
                </s-text-block>

                <s-heading>Data Protection Officer</s-heading>
                <s-text-block>
                  For any questions regarding data protection, you can contact our Data Protection Officer at dpo@kopyproducts.com
                </s-text-block>

                <s-heading>Automated Decision Making</s-heading>
                <s-text-block>
                  We do not use automated decision-making or profiling that produces legal effects or similarly significantly affects you.
                </s-text-block>

                <s-heading>Children's Privacy</s-heading>
                <s-text-block>
                  Our service is not directed at children under 16. We do not knowingly collect personal data from children under 16.
                </s-text-block>

                <s-heading>Updates to This Policy</s-heading>
                <s-text-block>
                  We may update this GDPR compliance information periodically. Material changes will be communicated to you via email or through the application.
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
