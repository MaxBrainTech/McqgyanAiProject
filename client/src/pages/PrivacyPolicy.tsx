import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export default function PrivacyPolicy() {

  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-16">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">

        <h1 className="text-4xl font-bold mb-8">
          {t("privacy_title")}
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {t("privacy_last_updated")}
        </p>

        <div className="space-y-8">

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("privacy_intro_title")}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("privacy_intro_desc")}
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("privacy_collection_title")}
            </h2>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {t("privacy_collection_desc")}
            </p>

            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li>{t("privacy_collection_li1")}</li>
              <li>{t("privacy_collection_li2")}</li>
              <li>{t("privacy_collection_li3")}</li>
            </ul>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("privacy_use_title")}
            </h2>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("privacy_use_desc")}
            </p>

            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-4 space-y-2">
              <li>{t("privacy_use_li1")}</li>
              <li>{t("privacy_use_li2")}</li>
              <li>{t("privacy_use_li3")}</li>
              <li>{t("privacy_use_li4")}</li>
              <li>{t("privacy_use_li5")}</li>
            </ul>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("privacy_security_title")}
            </h2>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("privacy_security_desc")}
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("privacy_cookies_title")}
            </h2>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("privacy_cookies_desc")}
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("privacy_children_title")}
            </h2>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("privacy_children_desc")}
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("privacy_changes_title")}
            </h2>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("privacy_changes_desc")}
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("privacy_contact_title")}
            </h2>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("privacy_contact_desc")}
            </p>
          </Card>

        </div>
      </div>
    </div>
  );
}