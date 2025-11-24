import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [
    { title: "Support - Poky-fy Import & Copy Products" },
    { name: "description", content: "Support and help for Poky-fy Import & Copy Products Shopify App" },
  ];
};

export default function Support() {
  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Support</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>Get help with Poky-fy Import & Copy Products</p>

      <div style={{ lineHeight: "1.8", color: "#333" }}>
        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Need Help?</h2>
        <p>
          We're here to help you get the most out of Poky-fy Import & Copy Products. Below you'll find resources and ways to get support.
        </p>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Frequently Asked Questions</h2>

        <h3 style={{ fontSize: "1.25rem", marginTop: "1.5rem", marginBottom: "0.75rem" }}>How do I import products?</h3>
        <p>
          Navigate to the Import page, paste the product URL from your source, and click Import. The product will be imported to your Shopify store with all available details.
        </p>

        <h3 style={{ fontSize: "1.25rem", marginTop: "1.5rem", marginBottom: "0.75rem" }}>Can I import multiple products at once?</h3>
        <p>
          Yes! Use the Bulk Import feature to import multiple products simultaneously. Simply provide a list of URLs and start the bulk import process.
        </p>

        <h3 style={{ fontSize: "1.25rem", marginTop: "1.5rem", marginBottom: "0.75rem" }}>What happens to imported products?</h3>
        <p>
          Imported products are created as draft products in your Shopify store. You can review and publish them when ready.
        </p>

        <h3 style={{ fontSize: "1.25rem", marginTop: "1.5rem", marginBottom: "0.75rem" }}>Can I sync product updates?</h3>
        <p>
          Yes, you can synchronize products from the History page to update product information from the original source.
        </p>

        <h3 style={{ fontSize: "1.25rem", marginTop: "1.5rem", marginBottom: "0.75rem" }}>How do I view my import history?</h3>
        <p>
          Go to the History page to see all your imported products, their status, and perform actions like syncing or viewing details.
        </p>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Contact Support</h2>
        <p>If you can't find the answer to your question, please reach out to us:</p>
        <ul style={{ marginLeft: "2rem", marginBottom: "1rem" }}>
          <li>Email: support@kopyproducts.com</li>
          <li>Response time: Within 24-48 hours</li>
        </ul>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Report a Bug</h2>
        <p>If you've encountered a technical issue, please provide:</p>
        <ul style={{ marginLeft: "2rem", marginBottom: "1rem" }}>
          <li>A detailed description of the problem</li>
          <li>Steps to reproduce the issue</li>
          <li>Screenshots if applicable</li>
          <li>Your Shopify store domain</li>
        </ul>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Feature Requests</h2>
        <p>
          We're always looking to improve! If you have suggestions for new features or improvements, we'd love to hear from you. Send your ideas to support@kopyproducts.com
        </p>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Troubleshooting</h2>

        <h3 style={{ fontSize: "1.25rem", marginTop: "1.5rem", marginBottom: "0.75rem" }}>Import is failing</h3>
        <ul style={{ marginLeft: "2rem", marginBottom: "1rem" }}>
          <li>Verify the product URL is correct and accessible</li>
          <li>Check that you have sufficient permissions in your Shopify store</li>
          <li>Ensure you're not exceeding Shopify's rate limits</li>
        </ul>

        <h3 style={{ fontSize: "1.25rem", marginTop: "1.5rem", marginBottom: "0.75rem" }}>Images not importing</h3>
        <ul style={{ marginLeft: "2rem", marginBottom: "1rem" }}>
          <li>Check that images are publicly accessible</li>
          <li>Verify image URLs are valid</li>
          <li>Large images may take longer to process</li>
        </ul>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>System Status</h2>
        <p>All systems operational. If you're experiencing issues, please contact support.</p>

        <h2 style={{ fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}>Additional Resources</h2>
        <ul style={{ marginLeft: "2rem", marginBottom: "1rem" }}>
          <li><a href="/privacy-policy" style={{ color: "#0066cc" }}>Privacy Policy</a> - Learn how we protect your data</li>
          <li><a href="/terms-of-service" style={{ color: "#0066cc" }}>Terms of Service</a> - Understand your rights and obligations</li>
          <li><a href="/gdpr" style={{ color: "#0066cc" }}>GDPR Compliance</a> - Information about data protection</li>
        </ul>
      </div>
    </div>
  );
}
