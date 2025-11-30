import { Card } from "@/components/ui/card";

export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-16">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Disclaimer</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Last Updated: November 2025</p>

        <div className="space-y-8">
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">Educational Use</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              MCQGyaan AI is designed as a supplementary educational tool for CBSE students. While we strive to provide accurate and high-quality content, we do not guarantee that all information is 100% accurate or suitable for all learning contexts.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">AI-Generated Content</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Questions and answers on our platform are generated or enhanced using AI technology. While we implement quality control measures, AI-generated content may occasionally contain errors or inaccuracies. We recommend verifying important information through official textbooks or teacher guidance.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">No Guarantee of Results</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              MCQGyaan AI does not guarantee any specific academic results or exam performance. Success depends on individual effort, understanding, and consistent practice. The platform is a learning tool, not a replacement for classroom teaching.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">Curriculum Alignment</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We align our content with CBSE curriculum, but educational boards frequently update curricula. We recommend checking official board websites for the latest updates and ensuring content aligns with your current curriculum.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">Technical Limitations</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              MCQGyaan AI is provided on an "as-is" basis. We do not warrant that the service will be uninterrupted, error-free, or secure. We are not liable for any loss of data, service disruption, or other technical issues that may occur.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">Third-Party Content</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              MCQGyaan AI may contain links to third-party websites or services. We are not responsible for the content, accuracy, or practices of external sites. Use third-party resources at your own discretion.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">Limitation of Liability</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              To the maximum extent permitted by law, MCQGyaan AI and its creators are not liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">Medical/Professional Advice</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              MCQGyaan AI is an educational platform and does not provide medical, legal, or professional advice. For such matters, consult appropriate qualified professionals.
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">User Responsibility</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Users are responsible for:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-4 space-y-2">
              <li>Maintaining account security and confidentiality</li>
              <li>Using the platform in compliance with all laws and policies</li>
              <li>Not using the platform for harmful or illegal purposes</li>
              <li>Respecting intellectual property rights</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
