import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Support() {
  return (
    <s-page
      title="Support"
      subtitle="Get help with Poky-fy Import & Copy Products"
    >
      <s-layout>
        <s-layout-section>
          <s-card>
            <s-card-section>
              <s-text-container>
                <s-heading>Need Help?</s-heading>
                <s-text-block>
                  We're here to help you get the most out of Poky-fy Import & Copy Products. Below you'll find resources and ways to get support.
                </s-text-block>

                <s-heading>Frequently Asked Questions</s-heading>

                <s-text-block>
                  <strong>How do I import products?</strong>
                </s-text-block>
                <s-text-block>
                  Navigate to the Import page, paste the product URL from your source, and click Import. The product will be imported to your Shopify store with all available details.
                </s-text-block>

                <s-text-block>
                  <strong>Can I import multiple products at once?</strong>
                </s-text-block>
                <s-text-block>
                  Yes! Use the Bulk Import feature to import multiple products simultaneously. Simply provide a list of URLs and start the bulk import process.
                </s-text-block>

                <s-text-block>
                  <strong>What happens to imported products?</strong>
                </s-text-block>
                <s-text-block>
                  Imported products are created as draft products in your Shopify store. You can review and publish them when ready.
                </s-text-block>

                <s-text-block>
                  <strong>Can I sync product updates?</strong>
                </s-text-block>
                <s-text-block>
                  Yes, you can synchronize products from the History page to update product information from the original source.
                </s-text-block>

                <s-text-block>
                  <strong>How do I view my import history?</strong>
                </s-text-block>
                <s-text-block>
                  Go to the History page to see all your imported products, their status, and perform actions like syncing or viewing details.
                </s-text-block>

                <s-heading>Contact Support</s-heading>
                <s-text-block>
                  If you can't find the answer to your question, please reach out to us:
                </s-text-block>
                <s-list type="bullet">
                  <s-list-item>Email: support@kopyproducts.com</s-list-item>
                  <s-list-item>Response time: Within 24-48 hours</s-list-item>
                </s-list>

                <s-heading>Report a Bug</s-heading>
                <s-text-block>
                  If you've encountered a technical issue, please provide:
                </s-text-block>
                <s-list type="bullet">
                  <s-list-item>A detailed description of the problem</s-list-item>
                  <s-list-item>Steps to reproduce the issue</s-list-item>
                  <s-list-item>Screenshots if applicable</s-list-item>
                  <s-list-item>Your Shopify store domain</s-list-item>
                </s-list>

                <s-heading>Feature Requests</s-heading>
                <s-text-block>
                  We're always looking to improve! If you have suggestions for new features or improvements, we'd love to hear from you. Send your ideas to support@kopyproducts.com
                </s-text-block>

                <s-heading>Troubleshooting</s-heading>

                <s-text-block>
                  <strong>Import is failing</strong>
                </s-text-block>
                <s-list type="bullet">
                  <s-list-item>Verify the product URL is correct and accessible</s-list-item>
                  <s-list-item>Check that you have sufficient permissions in your Shopify store</s-list-item>
                  <s-list-item>Ensure you're not exceeding Shopify's rate limits</s-list-item>
                </s-list>

                <s-text-block>
                  <strong>Images not importing</strong>
                </s-text-block>
                <s-list type="bullet">
                  <s-list-item>Check that images are publicly accessible</s-list-item>
                  <s-list-item>Verify image URLs are valid</s-list-item>
                  <s-list-item>Large images may take longer to process</s-list-item>
                </s-list>

                <s-heading>System Status</s-heading>
                <s-text-block>
                  All systems operational. If you're experiencing issues, please contact support.
                </s-text-block>

                <s-heading>Additional Resources</s-heading>
                <s-list type="bullet">
                  <s-list-item>Privacy Policy - Learn how we protect your data</s-list-item>
                  <s-list-item>Terms of Service - Understand your rights and obligations</s-list-item>
                  <s-list-item>GDPR Compliance - Information about data protection</s-list-item>
                </s-list>
              </s-text-container>
            </s-card-section>
          </s-card>
        </s-layout-section>
      </s-layout>
    </s-page>
  );
}
