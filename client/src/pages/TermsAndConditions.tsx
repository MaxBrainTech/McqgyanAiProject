import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export default function TermsAndConditions() {

  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-16">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">

        <h1 className="text-4xl font-bold mb-8">
          {t("terms_title")}
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {t("terms_last_updated")}
        </p>

        <div className="space-y-8">

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("terms_section1_title")}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("terms_section1_desc")}
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("terms_section2_title")}
            </h2>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("terms_section2_desc")}
            </p>

            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-4 space-y-2">
              <li>{t("terms_section2_li1")}</li>
              <li>{t("terms_section2_li2")}</li>
              <li>{t("terms_section2_li3")}</li>
              <li>{t("terms_section2_li4")}</li>
              <li>{t("terms_section2_li5")}</li>
            </ul>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("terms_section3_title")}
            </h2>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("terms_section3_desc")}
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("terms_section4_title")}
            </h2>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("terms_section4_desc")}
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("terms_section5_title")}
            </h2>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("terms_section5_desc")}
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("terms_section6_title")}
            </h2>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("terms_section6_desc")}
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("terms_section7_title")}
            </h2>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("terms_section7_desc")}
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("terms_section8_title")}
            </h2>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("terms_section8_desc")}
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("terms_section9_title")}
            </h2>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("terms_section9_desc")}
            </p>
          </Card>

        </div>
      </div>
    </div>
  );
}
