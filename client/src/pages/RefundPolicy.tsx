import { Card } from "@/components/ui/card";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-16">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Refund Policy</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Last Updated: November 2025</p>

        <div className="space-y-8">
          <Card className="p-8 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <h2 className="text-2xl font-bold mb-4 text-green-900 dark:text-green-400">7-Day Money-Back Guarantee</h2>
            <p className="text-green-800 dark:text-green-300 leading-relaxed font-semibold">
              We're confident you'll love MCQGyaan AI. If you're not satisfied within 7 days of purchase, we'll refund 100% of your money.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">Refund Eligibility</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              To be eligible for a refund, your purchase must meet the following criteria:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li>Refund requested within 7 days of purchase</li>
              <li>For annual subscriptions, within 30 days of purchase</li>
              <li>Original payment method must be valid</li>
              <li>Account must not show abuse or excessive usage</li>
            </ul>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">How to Request a Refund</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              To request a refund, please follow these steps:
            </p>
            <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li>Contact our support team at support@mcqgyaan.com</li>
              <li>Provide your order/subscription ID</li>
              <li>Briefly explain why you'd like a refund</li>
              <li>We'll process your request within 5-7 business days</li>
            </ol>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">Processing Time</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Approved refunds will be credited back to your original payment method within 5-10 business days. Bank processing times may add 1-2 additional business days.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">Special Cases</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              <strong>Free Trial Period (Until Dec 31, 2025):</strong> All features are free until December 31, 2025. No refund is required.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              <strong>Teacher Accounts:</strong> Teachers who have generated tests cannot request refunds as they have consumed the service.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">Exceptions</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Refunds will NOT be issued for:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-4 space-y-2">
              <li>Requests made after 7 days (30 days for annual) of purchase</li>
              <li>Accounts showing abuse or violation of terms</li>
              <li>Gift card purchases or promotional credits</li>
              <li>Previously refunded amounts</li>
            </ul>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">Contact Support</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              For refund-related inquiries, contact our support team:
            </p>
            <p className="text-gray-700 dark:text-gray-300 mt-4">
              Email: support@mcqgyaan.com<br/>
              Response Time: Within 24 hours (business days)
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
