import { Check, Zap, Brain, Users, Sparkles, Award, BookOpen, BarChart3, Target, Shield, Lightbulb, Settings, Languages, Atom, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function FeaturesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const mainFeatures = [
    {
      icon: Languages,
      title: t("feature_language_learning_title"),
      description: t("feature_language_learning_desc"),
      benefits: [
        t("benefit_real_pronunciation"),
        t("benefit_cultural_context"),
        t("benefit_grammar_explanation"),
        t("benefit_progressive_difficulty")
      ]
    },
    {
      icon: Atom,
      title: t("feature_science_quiz_title"),
      description: t("feature_science_quiz_desc"),
      benefits: [
        t("benefit_real_world"),
        t("benefit_concept_clarity"),
        t("benefit_step_solution"),
        t("benefit_visual_diagrams")
      ]
    },
    {
      icon: Sparkles,
      title: t("feature_custom_tests_title"),
      description: t("feature_custom_tests_desc"),
      benefits: [
        t("benefit_gpt_quality"),
        t("benefit_cost_effective"),
        t("benefit_no_duplication"),
        t("benefit_instant_feedback")
      ]
    },
    {
      icon: FileText,
      title: t("feature_answer_eval_title"),
      description: t("feature_answer_eval_desc"),
      benefits: [
        t("benefit_batch_processing"),
        t("benefit_quality_assessment"),
        t("benefit_detailed_analysis"),
        t("benefit_score_tracking")
      ]
    }
  ];

  const premiumFeatures = [
    { text: t("premium_adaptive_difficulty"), icon: Target },
    { text: t("premium_progress_tracking"), icon: BarChart3 },
    { text: t("premium_leaderboard"), icon: Award },
    { text: t("premium_multiboard"), icon: BookOpen },
    { text: t("premium_ai_feedback"), icon: Brain },
    { text: t("premium_pdf_reports"), icon: Sparkles },
    { text: t("premium_teacher_dashboard"), icon: Users },
    { text: t("premium_anti_duplication"), icon: Shield },
    { text: t("premium_custom_content"), icon: Lightbulb },
    { text: t("premium_analytics"), icon: BarChart3 }
  ];

  const forStudents = [
    { title: t("student_self_paced"), desc: t("student_self_paced_desc") },
    { title: t("student_instant_feedback"), desc: t("student_instant_feedback_desc") },
    { title: t("student_performance_tracking"), desc: t("student_performance_tracking_desc") },
    { title: t("student_confidence"), desc: t("student_confidence_desc") },
    { title: t("student_exam_prep"), desc: t("student_exam_prep_desc") },
    { title: t("student_doubt_clarification"), desc: t("student_doubt_clarification_desc") }
  ];

  const forTeachers = [
    { title: t("teacher_test_creation"), desc: t("teacher_test_creation_desc") },
    { title: t("teacher_time_saving"), desc: t("teacher_time_saving_desc") },
    { title: t("teacher_student_analytics"), desc: t("teacher_student_analytics_desc") },
    { title: t("teacher_flexible_assessment"), desc: t("teacher_flexible_assessment_desc") },
    { title: t("teacher_class_management"), desc: t("teacher_class_management_desc") },
    { title: t("teacher_answer_evaluation"), desc: t("teacher_answer_evaluation_desc") }
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
            <h2 className="text-4xl font-bold text-center mb-4">
              {t("core_features")}
            </h2>

            <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
              {t("core_features_desc")}
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
            {t("advanced_capabilities")}
          </h2>

          <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            {t("advanced_capabilities_desc")}
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
            {t("built_for_teachers")}
          </h2>

          <p className="text-center text-gray-600 dark:text-gray-400">
            {t("built_for_teachers_desc")}
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
              {t("built_for_teachers")}
            </h2>

            <p className="text-center text-gray-600 dark:text-gray-400">
              {t("built_for_teachers_desc")}
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
              <h2 className="text-3xl font-bold mb-4">
                {t("powered_by_ai")}
              </h2>

              <p className="mb-6 text-blue-100">
                {t("powered_by_ai_desc")}
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0" />
                  <span>{t("smart_question_generation")}</span>
                </li>

                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0" />
                  <span>{t("context_aware_feedback")}</span>
                </li>

                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0" />
                  <span>{t("adaptive_difficulty")}</span>
                </li>

                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0" />
                  <span>{t("multilanguage_support")}</span>
                </li>
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-white/10 rounded-lg backdrop-blur-sm">
                <Sparkles className="h-8 w-8 mb-3" />
                <p className="font-semibold text-sm">GPT-4o</p>
                <span>{t("gpt4o_desc")}</span>
              </div>
              <div className="p-6 bg-white/10 rounded-lg backdrop-blur-sm">
                <Zap className="h-8 w-8 mb-3" />
                <p className="font-semibold text-sm">GPT-3.5-turbo</p>
                <p className="text-xs text-blue-100">{t("gpt35_desc")}</p>
              </div>
              <div className="p-6 bg-white/10 rounded-lg backdrop-blur-sm">
                <Brain className="h-8 w-8 mb-3" />

                <p className="font-semibold text-sm">{t("quality_control")}</p>
                <p className="text-xs text-blue-100">{t("quality_control_desc")}</p>
              </div>
              <div className="p-6 bg-white/10 rounded-lg backdrop-blur-sm">
                <Shield className="h-8 w-8 mb-3" />

                <p className="font-semibold text-sm">{t("quality_control")}</p>
                <p className="text-xs text-blue-100">{t("quality_control_desc")}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Comparison Table */}
      <div className="bg-white dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t("feature_comparison")}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                  <th className="text-left py-4 px-4 font-bold">
                    {t("feature")}
                  </th>

                  <th className="text-center py-4 px-4 font-bold text-sm">
                    {t("student")}
                  </th>

                  <th className="text-center py-4 px-4 font-bold text-sm">
                    {t("teacher")}
                  </th>

                  <th className="text-center py-4 px-4 font-bold text-sm">
                    {t("parent")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: t("feature_language_learning"), student: true, teacher: true, parent: true },
                  { feature: t("feature_science_quizzes"), student: true, teacher: true, parent: true },
                  { feature: t("feature_performance_analytics"), student: true, teacher: true, parent: true },
                  { feature: t("feature_custom_test_creation"), student: true, teacher: true, parent: false },
                  { feature: t("feature_answer_evaluation"), student: true, teacher: true, parent: true },
                  { feature: t("feature_class_management"), student: false, teacher: true, parent: false },
                  { feature: t("feature_student_progress"), student: true, teacher: true, parent: true },
                  { feature: t("feature_download_reports"), student: true, teacher: true, parent: true }
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
            {t("experience_mcqgyaan")}
          </h2>

          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            {t("experience_desc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate("/")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3 text-lg"
            >
              {t("start_learning_free")}
            </Button>

            <Button
              onClick={() => navigate("/pricing")}
              variant="outline"
              className="px-8 py-3 text-lg"
            >
              {t("view_pricing")}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

