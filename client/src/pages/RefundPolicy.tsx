import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export default function RefundPolicy() {

  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-16">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">

        <h1 className="text-4xl font-bold mb-8">
          {t("refund_title")}
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {t("refund_last_updated")}
        </p>

        <div className="space-y-8">

          <Card className="p-8 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <h2 className="text-2xl font-bold mb-4 text-green-900 dark:text-green-400">
              {t("refund_guarantee_title")}
            </h2>

            <p className="text-green-800 dark:text-green-300 leading-relaxed font-semibold">
              {t("refund_guarantee_desc")}
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("refund_eligibility_title")}
            </h2>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {t("refund_eligibility_desc")}
            </p>

            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li>{t("refund_eligibility_li1")}</li>
              <li>{t("refund_eligibility_li2")}</li>
              <li>{t("refund_eligibility_li3")}</li>
              <li>{t("refund_eligibility_li4")}</li>
            </ul>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("refund_request_title")}
            </h2>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {t("refund_request_desc")}
            </p>

            <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li>{t("refund_request_li1")}</li>
              <li>{t("refund_request_li2")}</li>
              <li>{t("refund_request_li3")}</li>
              <li>{t("refund_request_li4")}</li>
            </ol>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("refund_processing_title")}
            </h2>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("refund_processing_desc")}
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("refund_special_title")}
            </h2>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {t("refund_special_desc1")}
            </p>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("refund_special_desc2")}
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("refund_exceptions_title")}
            </h2>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("refund_exceptions_desc")}
            </p>

            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-4 space-y-2">
              <li>{t("refund_exceptions_li1")}</li>
              <li>{t("refund_exceptions_li2")}</li>
              <li>{t("refund_exceptions_li3")}</li>
              <li>{t("refund_exceptions_li4")}</li>
            </ul>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {t("refund_contact_title")}
            </h2>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t("refund_contact_desc")}
            </p>

            <p className="text-gray-700 dark:text-gray-300 mt-4">
              {t("refund_contact_email")} <br/>
              {t("refund_contact_time")}
            </p>
          </Card>

        </div>
      </div>
    </div>
  );
}