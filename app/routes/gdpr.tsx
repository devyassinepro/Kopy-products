import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [
    { title: "GDPR Compliance - Kopy Products" },
    { name: "description", content: "GDPR Compliance information for Kopy Products Shopify App" },
  ];
};

export default function GDPR() {
  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>GDPR Compliance</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>General Data Protection Regulation compliance information</p>

      <div style={{ lineHeight: "1.8", color: "#333" }}>
        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Our Commitment to GDPR</h2>
        <p>
          Kopy Products is committed to protecting your privacy and ensuring compliance with the General Data Protection Regulation (GDPR). This page outlines how we handle your personal data in accordance with GDPR requirements.
        </p>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Legal Basis for Processing</h2>
        <p>We process your personal data under the following legal bases:</p>
        <ul style={{ marginLeft: "2rem", marginBottom: "1rem" }}>
          <li><strong>Consent:</strong> When you install and use our application</li>
          <li><strong>Contract:</strong> To provide the services you've requested</li>
          <li><strong>Legitimate Interest:</strong> To improve our services and ensure security</li>
          <li><strong>Legal Obligation:</strong> To comply with applicable laws and regulations</li>
        </ul>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Your Rights Under GDPR</h2>
        <p>As a data subject under GDPR, you have the following rights:</p>

        <h3 style={{ fontSize: "1.25rem", marginTop: "1.5rem", marginBottom: "0.75rem" }}>1. Right to Access</h3>
        <p>
          You have the right to request a copy of all personal data we hold about you. We will provide this information in a commonly used, machine-readable format.
        </p>

        <h3 style={{ fontSize: "1.25rem", marginTop: "1.5rem", marginBottom: "0.75rem" }}>2. Right to Rectification</h3>
        <p>You can request correction of any inaccurate or incomplete personal data we hold about you.</p>

        <h3 style={{ fontSize: "1.25rem", marginTop: "1.5rem", marginBottom: "0.75rem" }}>3. Right to Erasure (Right to be Forgotten)</h3>
        <p>
          You can request deletion of your personal data when it's no longer necessary for the purposes it was collected, or if you withdraw your consent.
        </p>

        <h3 style={{ fontSize: "1.25rem", marginTop: "1.5rem", marginBottom: "0.75rem" }}>4. Right to Restriction of Processing</h3>
        <p>You can request that we restrict processing of your personal data in certain circumstances.</p>

        <h3 style={{ fontSize: "1.25rem", marginTop: "1.5rem", marginBottom: "0.75rem" }}>5. Right to Data Portability</h3>
        <p>
          You can request to receive your personal data in a structured, commonly used, machine-readable format and transmit it to another controller.
        </p>

        <h3 style={{ fontSize: "1.25rem", marginTop: "1.5rem", marginBottom: "0.75rem" }}>6. Right to Object</h3>
        <p>You can object to processing of your personal data for direct marketing purposes or based on legitimate interests.</p>

        <h3 style={{ fontSize: "1.25rem", marginTop: "1.5rem", marginBottom: "0.75rem" }}>7. Right to Withdraw Consent</h3>
        <p>You can withdraw your consent at any time by uninstalling the application.</p>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Data We Collect</h2>
        <p>We collect and process the following categories of personal data:</p>
        <ul style={{ marginLeft: "2rem", marginBottom: "1rem" }}>
          <li>Store identification data (shop domain, name)</li>
          <li>Contact information (email address)</li>
          <li>Product data you choose to import</li>
          <li>Usage data and application logs</li>
          <li>Technical data (IP address, session information)</li>
        </ul>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>How We Protect Your Data</h2>
        <p>We implement appropriate technical and organizational measures to ensure data security:</p>
        <ul style={{ marginLeft: "2rem", marginBottom: "1rem" }}>
          <li>Encryption of data in transit and at rest</li>
          <li>Regular security assessments and updates</li>
          <li>Access controls and authentication</li>
          <li>Data minimization principles</li>
          <li>Secure data storage with regular backups</li>
        </ul>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Data Retention</h2>
        <p>We retain personal data only for as long as necessary:</p>
        <ul style={{ marginLeft: "2rem", marginBottom: "1rem" }}>
          <li>Active usage data: While you use the service</li>
          <li>Account data: 30 days after app uninstallation</li>
          <li>Legal compliance data: As required by applicable laws</li>
        </ul>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>International Data Transfers</h2>
        <p>If we transfer your data outside the European Economic Area (EEA), we ensure appropriate safeguards are in place, such as:</p>
        <ul style={{ marginLeft: "2rem", marginBottom: "1rem" }}>
          <li>Standard Contractual Clauses approved by the European Commission</li>
          <li>Adequacy decisions for certain countries</li>
          <li>Privacy Shield certification (where applicable)</li>
        </ul>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Data Breach Notification</h2>
        <p>In the event of a data breach that poses a risk to your rights and freedoms, we will:</p>
        <ul style={{ marginLeft: "2rem", marginBottom: "1rem" }}>
          <li>Notify the relevant supervisory authority within 72 hours</li>
          <li>Inform affected users without undue delay</li>
          <li>Provide information about the breach and remedial actions</li>
        </ul>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Exercising Your Rights</h2>
        <p>To exercise any of your GDPR rights, please contact us at:</p>
        <ul style={{ marginLeft: "2rem", marginBottom: "1rem" }}>
          <li>Email: privacy@kopyproducts.com</li>
          <li>Subject: GDPR Data Request</li>
        </ul>
        <p>
          We will respond to your request within 30 days. You also have the right to lodge a complaint with your local supervisory authority.
        </p>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Data Protection Officer</h2>
        <p>For any questions regarding data protection, you can contact our Data Protection Officer at dpo@kopyproducts.com</p>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Automated Decision Making</h2>
        <p>We do not use automated decision-making or profiling that produces legal effects or similarly significantly affects you.</p>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Children's Privacy</h2>
        <p>Our service is not directed at children under 16. We do not knowingly collect personal data from children under 16.</p>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Updates to This Policy</h2>
        <p>
          We may update this GDPR compliance information periodically. Material changes will be communicated to you via email or through the application.
        </p>

        <p style={{ marginTop: "2rem", color: "#666" }}>
          <strong>Last Updated: November 20, 2025</strong>
        </p>
      </div>
    </div>
  );
}
