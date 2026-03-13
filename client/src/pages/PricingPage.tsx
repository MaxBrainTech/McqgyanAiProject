import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function PricingPage() {
  const navigate = useNavigate();

  const { t } = useTranslation();

  const plans = [
    {
      name: t("plan_free"),
      price: "0",
      description: t("plan_free_desc"),
      features: [
        { text: t("feature_language_learning"), included: true },
        { text: t("feature_science_quizzes"), included: true },
        { text: t("feature_10_questions"), included: true },
        { text: t("feature_difficulty_levels"), included: true },
        { text: t("feature_instant_feedback"), included: true },
        { text: t("feature_custom_tests_limit"), included: false },
        { text: t("feature_answer_sheet_evaluator"), included: false },
        { text: t("feature_teacher_dashboard"), included: false },
      ],
      cta: t("cta_get_started"),
      highlighted: false,
    },
    {
      name: t("plan_pro"),
      price: "99",
      period: t("month"),
      description: t("plan_pro_desc"),
      features: [
        { text: t("feature_language_learning"), included: true },
        { text: t("feature_science_quizzes"), included: true },
        { text: t("feature_50_questions"), included: true },
        { text: t("feature_difficulty_levels"), included: true },
        { text: t("feature_instant_feedback"), included: true },
        { text: t("feature_unlimited_custom_tests"), included: true },
        { text: t("feature_answer_eval_10"), included: true },
        { text: t("feature_teacher_dashboard_basic"), included: true },
      ],
      cta: t("cta_upgrade_pro"),
      highlighted: true,
    },
    {
      name: t("plan_premium"),
      price: "299",
      period: t("month"),
      description: t("plan_premium_desc"),
      features: [
        { text: t("feature_language_learning"), included: true },
        { text: t("feature_science_quizzes"), included: true },
        { text: t("feature_100_questions"), included: true },
        { text: t("feature_difficulty_levels"), included: true },
        { text: t("feature_instant_feedback"), included: true },
        { text: t("feature_unlimited_custom_tests"), included: true },
        { text: t("feature_unlimited_answer_eval"), included: true },
        { text: t("feature_teacher_dashboard_advanced"), included: true },
      ],
      cta: t("cta_upgrade_premium"),
      highlighted: false,
    },
  ];

  const comparisonFeatures = [
    "Language Learning Modes",
    "Science Quiz Categories",
    "Custom MCQ Generation",
    "GPT Model Selection",
    "Answer Sheet Evaluation",
    "Offline Access",
    "API Access",
    "Priority Support",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header Section */}
      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
        <p className="text-sm font-semibold text-green-700 dark:text-green-400">
          {t("free_access_notice")}
        </p>

        {/* Free Until Badge */}
        <div className="inline-block bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-full px-6 py-3 mb-12">
          <p className="text-sm font-semibold text-green-700 dark:text-green-400">
            {t("free_access_notice")}
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`flex flex-col h-full transition-all duration-300 ${
                plan.highlighted
                  ? "md:scale-105 border-2 border-blue-500 shadow-2xl"
                  : "border border-gray-200 dark:border-gray-700"
              } hover-elevate`}
            >
              {plan.highlighted && (
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 text-center text-sm font-bold rounded-t-lg">
                {t("recommended")}
              </div>
              )}

              <div className="flex-1 p-6 sm:p-8">
                {/* Plan Name */}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold">₹{plan.price}</span>
                    {plan.period && (
                      <span className="text-gray-600 dark:text-gray-400">
                        /{plan.period}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Free until Dec 31, 2025
                  </p>
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => navigate("/")}
                  className={`w-full mb-8 ${
                    plan.highlighted
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      : ""
                  }`}
                  variant={plan.highlighted ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>

                {/* Features List */}
                <div className="space-y-4">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-5 w-5 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5" />
                      )}
                      <span
                        className={`text-sm ${
                          feature.included
                            ? "text-gray-900 dark:text-gray-100"
                            : "text-gray-400 dark:text-gray-600"
                        }`}
                      >
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Detailed Comparison Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">
                    {t("features")}
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-900 dark:text-white">
                    {t("plan_free")}
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-white">
                    {t("plan_pro")}
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-900 dark:text-white">
                    {t("plan_premium")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {feature}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center bg-blue-50/50 dark:bg-blue-900/10">
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t("faq_title")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-6 sm:p-8">
              <h3 className="font-bold text-lg mb-3">Are all features free until Dec 31, 2025?</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Yes! All pricing tiers are completely free for all users until December 31, 2025. 
                After that date, paid plans will be activated.
              </p>
            </Card>

            <Card className="p-6 sm:p-8">
              <h3 className="font-bold text-lg mb-3">Can I change my plan anytime?</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </Card>

            <Card className="p-6 sm:p-8">
              <h3 className="font-bold text-lg mb-3">Do you offer refunds?</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                We offer a 7-day money-back guarantee if you're not satisfied with our service. 
                No questions asked!
              </p>
            </Card>

            <Card className="p-6 sm:p-8">
              <h3 className="font-bold text-lg mb-3">
                {t("faq_teacher_discount")}
              </h3>

              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {t("faq_teacher_discount_desc")}
              </p>
            </Card>

            <Card className="p-6 sm:p-8">
              <h3 className="font-bold text-lg mb-3">
                {t("faq_teacher_discount")}
              </h3>

              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {t("faq_teacher_discount_desc")}
              </p>
            </Card>

            <Card className="p-6 sm:p-8">
              <h3 className="font-bold text-lg mb-3">
                {t("faq_payment_methods")}
              </h3>

              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {t("faq_payment_methods_desc")}
              </p>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-12 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t("cta_ready_learning")}
          </h2>

          <p className="text-lg mb-8 opacity-90">
            {t("cta_join_students")}
          </p>
          <Button
            onClick={() => navigate("/")}
            variant="default"
            className="bg-white text-blue-600 hover:bg-gray-100 font-bold px-8 py-3 text-lg"
          >
            {t("start_free_now")}
          </Button>
        </div>
      </div>
    </div>
  );
}
