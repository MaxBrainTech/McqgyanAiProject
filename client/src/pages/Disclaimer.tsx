import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export default function Disclaimer() {

  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-16">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">

        <h1 className="text-4xl font-bold mb-8">
          {t("disclaimer_title")}
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {t("disclaimer_last_updated")}
        </p>

        <div className="space-y-8">

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("disclaimer_edu_title")}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("disclaimer_edu_desc")}
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("disclaimer_ai_title")}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("disclaimer_ai_desc")}
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("disclaimer_results_title")}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("disclaimer_results_desc")}
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("disclaimer_curriculum_title")}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("disclaimer_curriculum_desc")}
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("disclaimer_technical_title")}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("disclaimer_technical_desc")}
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("disclaimer_thirdparty_title")}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("disclaimer_thirdparty_desc")}
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("disclaimer_liability_title")}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("disclaimer_liability_desc")}
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("disclaimer_professional_title")}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("disclaimer_professional_desc")}
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("disclaimer_user_title")}
            </h2>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("disclaimer_user_desc")}
            </p>

            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-4 space-y-2">
              <li>{t("disclaimer_user_li1")}</li>
              <li>{t("disclaimer_user_li2")}</li>
              <li>{t("disclaimer_user_li3")}</li>
              <li>{t("disclaimer_user_li4")}</li>
            </ul>
          </Card>

        </div>
      </div>
    </div>
  );
}