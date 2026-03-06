import { Card } from "@/components/ui/card";

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-16">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Terms and Conditions</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Last Updated: November 2025</p>

        <div className="space-y-8">
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              By accessing and using MCQGyaan AI, you accept and agree to be bound by these terms and conditions. If you do not agree to abide by the above, please do not use this service.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">2. Use License</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Permission is granted to temporarily download one copy of the materials (information or software) on MCQGyaan AI for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-4 space-y-2">
              <li>Modifying or copying the materials</li>
              <li>Using the materials for any commercial purpose or for any public display</li>
              <li>Attempting to decompile or reverse engineer any software contained on the platform</li>
              <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
              <li>Removing any copyright or other proprietary notations from the materials</li>
            </ul>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">3. Disclaimer</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              The materials on MCQGyaan AI's website are provided for educational purposes. MCQGyaan AI does not warrant the accuracy, completeness, or usefulness of this information.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">4. Limitations of Liability</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              In no event shall MCQGyaan AI or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on the site, even if MCQGyaan AI or an authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">5. Accuracy of Materials</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              The materials appearing on MCQGyaan AI's website could include technical, typographical, or photographic errors. MCQGyaan AI does not warrant that any of the materials on the website are accurate, complete, or current. MCQGyaan AI may make changes to the materials contained on its website at any time without notice.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">6. User Accounts</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              When you create an account with MCQGyaan AI, you must provide accurate and complete information. You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">7. Free Trial</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              All features are free until December 31, 2025. After this date, paid subscription may be required to access certain features. We will notify users of any changes in advance.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">8. Modifications</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              MCQGyaan AI may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">9. Governing Law</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts in Jaipur.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}


                        