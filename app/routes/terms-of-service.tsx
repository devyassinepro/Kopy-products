import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [
    { title: "Terms of Service - Poky-fy Import & Copy Products" },
    { name: "description", content: "Terms of Service for Poky-fy Import & Copy Products Shopify App" },
  ];
};

export default function TermsOfService() {
  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Terms of Service</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>Terms and conditions for using Poky-fy Import & Copy Products</p>

      <div style={{ lineHeight: "1.8", color: "#333" }}>
        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Agreement to Terms</h2>
        <p>
          By installing and using Poky-fy Import & Copy Products, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our application.
        </p>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Description of Service</h2>
        <p>Poky-fy Import & Copy Products is a Shopify application that enables merchants to import and manage products from external sources. The service includes:</p>
        <ul style={{ marginLeft: "2rem", marginBottom: "1rem" }}>
          <li>Product import functionality</li>
          <li>Bulk product operations</li>
          <li>Product synchronization</li>
          <li>Import history tracking</li>
        </ul>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>User Obligations</h2>
        <p>You agree to:</p>
        <ul style={{ marginLeft: "2rem", marginBottom: "1rem" }}>
          <li>Provide accurate information during registration and use</li>
          <li>Maintain the security of your Shopify store credentials</li>
          <li>Use the service only for lawful purposes</li>
          <li>Respect intellectual property rights of product content</li>
          <li>Comply with all applicable laws and regulations</li>
        </ul>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Intellectual Property</h2>
        <p>
          You are responsible for ensuring that you have the right to import and use any product content. We do not claim ownership of any product data you import through our service.
        </p>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Service Availability</h2>
        <p>While we strive to maintain high availability, we do not guarantee uninterrupted access to the service. We may:</p>
        <ul style={{ marginLeft: "2rem", marginBottom: "1rem" }}>
          <li>Perform scheduled maintenance</li>
          <li>Make updates or improvements</li>
          <li>Temporarily suspend service for technical reasons</li>
        </ul>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Limitation of Liability</h2>
        <p>To the maximum extent permitted by law, Poky-fy Import & Copy Products shall not be liable for:</p>
        <ul style={{ marginLeft: "2rem", marginBottom: "1rem" }}>
          <li>Indirect, incidental, or consequential damages</li>
          <li>Loss of profits, data, or business opportunities</li>
          <li>Errors or inaccuracies in imported product data</li>
          <li>Third-party content or services</li>
        </ul>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Termination</h2>
        <p>We reserve the right to suspend or terminate your access to the service if:</p>
        <ul style={{ marginLeft: "2rem", marginBottom: "1rem" }}>
          <li>You violate these Terms of Service</li>
          <li>You engage in fraudulent or illegal activities</li>
          <li>We discontinue the service</li>
        </ul>
        <p>You may terminate your use of the service at any time by uninstalling the application from your Shopify store.</p>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Payment and Refunds</h2>
        <p>
          Billing is handled through Shopify's billing system. All charges are subject to Shopify's terms. Refunds, if applicable, will be processed according to our refund policy.
        </p>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Modifications to Terms</h2>
        <p>
          We reserve the right to modify these Terms of Service at any time. We will notify you of significant changes. Continued use of the service after changes constitutes acceptance of the modified terms.
        </p>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Governing Law</h2>
        <p>
          These Terms of Service shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.
        </p>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Contact Information</h2>
        <p>
          For questions about these Terms of Service, please visit our <a href="/support" style={{ color: "#0066cc" }}>Support Page</a>.
        </p>

        <p style={{ marginTop: "2rem", color: "#666" }}>
          <strong>Last Updated: November 20, 2025</strong>
        </p>
      </div>
    </div>
  );
}
