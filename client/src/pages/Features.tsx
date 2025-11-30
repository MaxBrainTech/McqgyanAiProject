import { Check, Zap, Brain, Users, Sparkles, Award, BookOpen, BarChart3, Target, Shield, Lightbulb, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function FeaturesPage() {
  const navigate = useNavigate();

  const mainFeatures = [
    {
      icon: Languages,
      title: "6 Language Learning Modes",
      description: "Master French, German, Spanish, Hindi, Marathi, and Kannada with AI-powered interactive lessons tailored to your level.",
      benefits: ["Real pronunciations", "Cultural context", "Grammar explanations", "Progressive difficulty"]
    },
    {
      icon: Atom,
      title: "Comprehensive Science Quizzes",
      description: "Deep dive into Physics, Chemistry, Biology, and General Science with questions aligned to CBSE curriculum.",
      benefits: ["Real-world applications", "Concept clarity", "Step-by-step solutions", "Visual diagrams"]
    },
    {
      icon: Sparkles,
      title: "AI-Powered Custom Tests",
      description: "Generate unlimited personalized MCQ tests by selecting topics, difficulty, and preferred GPT model.",
      benefits: ["GPT-4o quality", "Cost-effective options", "No question duplication", "Instant feedback"]
    },
    {
      icon: FileText,
      title: "Answer Sheet Evaluator",
      description: "Upload answer sheets for automatic AI evaluation with detailed feedback and improvement suggestions.",
      benefits: ["Batch processing", "Quality assessment", "Detailed analysis", "Score tracking"]
    },
  ];

  const premiumFeatures = [
    { text: "Adaptive Difficulty Levels", icon: Target },
    { text: "Real-time Progress Tracking", icon: BarChart3 },
    { text: "Comprehensive Leaderboard", icon: Award },
    { text: "Multi-Board Support (CBSE/ICSE/IB)", icon: BookOpen },
    { text: "AI Feedback & Explanations", icon: Brain },
    { text: "Downloadable Reports & PDFs", icon: Sparkles },
    { text: "Teacher Dashboard", icon: Users },
    { text: "Anti-Duplication Controls", icon: Shield },
    { text: "Custom Educational Content", icon: Lightbulb },
    { text: "Advanced Analytics", icon: BarChart3 },
  ];

  const forStudents = [
    { title: "Self-Paced Learning", desc: "Learn at your own speed with 24/7 access to all resources" },
    { title: "Instant Feedback", desc: "Get immediate explanations for every answer you give" },
    { title: "Performance Tracking", desc: "Monitor your progress with detailed analytics and reports" },
    { title: "Confidence Building", desc: "Master topics with progressively challenging questions" },
    { title: "Exam Preparation", desc: "Practice with questions that match your board's pattern" },
    { title: "Doubt Clarification", desc: "AI-powered explanations for complex concepts" },
  ];

  const forTeachers = [
    { title: "Custom Test Creation", desc: "Generate tests in seconds without manual question writing" },
    { title: "Time Saving", desc: "Automate assessment with zero effort" },
    { title: "Student Analytics", desc: "Track individual and class performance at a glance" },
    { title: "Flexible Assessment", desc: "Mix MCQ, open-ended, and custom question types" },
    { title: "Class Management", desc: "Organize students, share codes, and track submissions" },
    { title: "Answer Evaluation", desc: "Auto-evaluate answer sheets with detailed feedback" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Powerful Features for Smarter Learning
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            MCQGyaan AI combines AI-powered learning, comprehensive assessments, and intuitive tools to help students excel and teachers teach effectively.
          </p>
          <Button
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
          >
            Get Started Free
          </Button>
        </div>
      </div>

      {/* Main Features Section */}
      <div className="container mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-4xl font-bold text-center mb-4">
          Core Features
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
          Everything you need for comprehensive learning and assessment
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {mainFeatures.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Card key={idx} className="p-8 hover-elevate transition-all group">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{feature.title}</h3>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{feature.description}</p>
                <div className="space-y-2">
                  {feature.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      {benefit}
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Premium Features Grid */}
      <div className="bg-white dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-4xl font-bold text-center mb-4">
            Advanced Capabilities
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            Beyond the basics: what makes MCQGyaan AI stand out
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {premiumFeatures.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="flex flex-col items-center text-center p-6 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg mb-4">
                    <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{feature.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* For Students Section */}
      <div className="container mx-auto px-4 sm:px-6 py-16">
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-center mb-4">
            Designed for Students
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Everything you need to succeed in your studies
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {forStudents.map((item, idx) => (
            <div key={idx} className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-2 w-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
                <h3 className="font-bold text-gray-900 dark:text-white">{item.title}</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* For Teachers Section */}
      <div className="bg-white dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-center mb-4">
              Built for Teachers
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400">
              Streamline assessment and boost classroom efficiency
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {forTeachers.map((item, idx) => (
              <div key={idx} className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-2 w-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full"></div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{item.title}</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Technology Section */}
      <div className="container mx-auto px-4 sm:px-6 py-16">
        <Card className="p-8 sm:p-12 bg-gradient-to-r from-blue-600 to-purple-600 border-0 text-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Powered by Advanced AI</h2>
              <p className="mb-6 text-blue-100">
                MCQGyaan uses cutting-edge GPT models to generate high-quality questions, provide intelligent feedback, and adapt to student learning patterns.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0" />
                  <span>Smart question generation with anti-duplication</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0" />
                  <span>Context-aware explanations and feedback</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0" />
                  <span>Adaptive difficulty based on performance</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0" />
                  <span>Multi-language support with proper transliteration</span>
                </li>
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-white/10 rounded-lg backdrop-blur-sm">
                <Sparkles className="h-8 w-8 mb-3" />
                <p className="font-semibold text-sm">GPT-4o</p>
                <p className="text-xs text-blue-100">Best quality</p>
              </div>
              <div className="p-6 bg-white/10 rounded-lg backdrop-blur-sm">
                <Zap className="h-8 w-8 mb-3" />
                <p className="font-semibold text-sm">GPT-4o-mini</p>
                <p className="text-xs text-blue-100">Fast & affordable</p>
              </div>
              <div className="p-6 bg-white/10 rounded-lg backdrop-blur-sm">
                <Brain className="h-8 w-8 mb-3" />
                <p className="font-semibold text-sm">GPT-3.5-turbo</p>
                <p className="text-xs text-blue-100">Budget option</p>
              </div>
              <div className="p-6 bg-white/10 rounded-lg backdrop-blur-sm">
                <Shield className="h-8 w-8 mb-3" />
                <p className="font-semibold text-sm">Quality Control</p>
                <p className="text-xs text-blue-100">100% verified</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Comparison Table */}
      <div className="bg-white dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Feature Comparison</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                  <th className="text-left py-4 px-4 font-bold">Feature</th>
                  <th className="text-center py-4 px-4 font-bold text-sm">Student</th>
                  <th className="text-center py-4 px-4 font-bold text-sm">Teacher</th>
                  <th className="text-center py-4 px-4 font-bold text-sm">Parent</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Language Learning", student: true, teacher: true, parent: true },
                  { feature: "Science Quizzes", student: true, teacher: true, parent: true },
                  { feature: "Performance Analytics", student: true, teacher: true, parent: true },
                  { feature: "Custom Test Creation", student: true, teacher: true, parent: false },
                  { feature: "Answer Sheet Evaluation", student: true, teacher: true, parent: true },
                  { feature: "Class Management", student: false, teacher: true, parent: false },
                  { feature: "Student Progress Tracking", student: true, teacher: true, parent: true },
                  { feature: "Download Reports", student: true, teacher: true, parent: true },
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">{row.feature}</td>
                    <td className="py-4 px-4 text-center">
                      {row.student ? (
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.teacher ? (
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.parent ? (
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 sm:px-6 py-16">
        <Card className="p-12 sm:p-16 text-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border-2 border-blue-200 dark:border-blue-800">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Experience MCQGyaan AI Today
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Start with free access to all features until December 31, 2025. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate("/")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3 text-lg"
            >
              Start Learning Free
            </Button>
            <Button
              onClick={() => navigate("/pricing")}
              variant="outline"
              className="px-8 py-3 text-lg"
            >
              View Pricing
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

