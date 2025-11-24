import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [
    { title: "Privacy Policy - Poky-fy Import & Copy Products" },
    { name: "description", content: "Privacy Policy for Poky-fy Import & Copy Products Shopify App" },
  ];
};

export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Privacy Policy</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>How we collect, use, and protect your data</p>

      <div style={{ lineHeight: "1.8", color: "#333" }}>
        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Introduction</h2>
        <p>
          This Privacy Policy describes how Poky-fy Import & Copy Products ("we", "us", or "our") collects, uses, and shares information when you use our Shopify application.
        </p>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Information We Collect</h2>
        <p>We collect the following types of information:</p>
        <ul style={{ marginLeft: "2rem", marginBottom: "1rem" }}>
          <li>Store information (store name, domain, email)</li>
          <li>Product data that you choose to import</li>
          <li>Usage data and analytics</li>
          <li>Technical information (IP address, browser type)</li>
        </ul>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>How We Use Your Information</h2>
        <p>We use the collected information to:</p>
        <ul style={{ marginLeft: "2rem", marginBottom: "1rem" }}>
          <li>Provide and maintain our service</li>
          <li>Process product imports and synchronization</li>
          <li>Improve and optimize our application</li>
          <li>Communicate with you about updates and support</li>
          <li>Ensure security and prevent fraud</li>
        </ul>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Data Storage and Security</h2>
        <p>
          We implement appropriate technical and organizational measures to protect your personal information. Your data is stored securely and we follow industry best practices for data protection.
        </p>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Data Sharing</h2>
        <p>We do not sell, trade, or rent your personal information to third parties. We may share information with:</p>
        <ul style={{ marginLeft: "2rem", marginBottom: "1rem" }}>
          <li>Service providers who assist in operating our application</li>
          <li>Law enforcement when required by law</li>
        </ul>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Your Rights</h2>
        <p>You have the right to:</p>
        <ul style={{ marginLeft: "2rem", marginBottom: "1rem" }}>
          <li>Access your personal data</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Withdraw consent at any time</li>
        </ul>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Data Retention</h2>
        <p>
          We retain your information only for as long as necessary to provide our services and comply with legal obligations. When you uninstall the app, your data will be deleted according to our retention policy.
        </p>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us at: <a href="/support" style={{ color: "#0066cc" }}>Support Page</a>
        </p>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Updates to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date.
        </p>

        <p style={{ marginTop: "2rem", color: "#666" }}>
          <strong>Last Updated: November 20, 2025</strong>
        </p>
      </div>
    </div>
  );
}
