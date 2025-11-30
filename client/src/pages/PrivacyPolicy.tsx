import { Card } from "@/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-16">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Last Updated: November 2025</p>

        <div className="space-y-8">
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">Introduction</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              MCQGyaan AI ("we" or "us" or "our") operates the website. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our service.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">Information Collection</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We collect several different types of information for various purposes:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Personal Data:</strong> Name, email address, phone number, educational board, class level</li>
              <li><strong>Usage Data:</strong> Browser type, pages visited, time spent, test performance</li>
              <li><strong>Device Information:</strong> IP address, operating system, device type</li>
            </ul>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">Use of Data</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              MCQGyaan AI uses the collected data for various purposes:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-4 space-y-2">
              <li>To provide and maintain our service</li>
              <li>To notify you about changes to our service</li>
              <li>To provide personalized learning recommendations</li>
              <li>To gather analysis or valuable information to improve our service</li>
              <li>To monitor the usage of our service</li>
            </ul>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">Data Security</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              The security of your data is important to us but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. We use industry-standard encryption and security protocols to protect your information.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">Cookies</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We use cookies to enhance your experience and analyze site traffic. You can choose to disable cookies through your browser, but this may limit functionality.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">Children's Privacy</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Our service is designed for students aged 11-16. We do not knowingly collect personally identifiable information from children under 11 years old. If we become aware of such collection, we take immediate action to delete such information.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">Changes to This Policy</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy and updating the "Last Updated" date.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at privacy@mcqgyaan.com
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
