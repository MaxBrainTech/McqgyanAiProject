import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const plans = [
  {
    title: "BASIC",
    monthly: 4.99,
    yearly: 49.99,
    features: ["50 GB Bandwidth", "Finace Analysing", "24-hour support"],
    missing: ["Customer Management"],
  },
  {
    title: "STANDARD",
    monthly: 9.99,
    yearly: 99.99,
    features: ["50 GB Bandwidth", "Finace Analysing", "24-hour support"],
    missing: ["Customer Management"],
  },
  {
    title: "PREMIUM",
    monthly: 14.99,
    yearly: 149.99,
    features: ["50 GB Bandwidth", "Finace Analysing", "24-hour support", "Customer Management"],
    missing: [],
  },
  {
    title: "SPECIAL",
    monthly: 99.99,
    yearly: 999.99,
    features: ["50 GB Bandwidth", "Finace Analysing", "24-hour support", "Customer Management"],
    missing: [],
  },
];

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-6 dark:from-gray-900 dark:to-black">
      <div className="mb-10 text-center text-white">
        <h1 className="text-3xl font-bold">{t("pricing_legacy_title")}</h1>
        <p className="opacity-70">{t("pricing_legacy_desc")}</p>

        <div className="mt-5 inline-flex rounded-xl bg-white/20 p-2 backdrop-blur">
          <button
            onClick={() => setIsYearly(false)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${!isYearly ? "bg-white text-black" : "text-white"}`}
          >
            {t("month")}
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${isYearly ? "bg-white text-black" : "text-white"}`}
          >
            {t("year")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <div
            key={plan.title}
            className="rounded-xl bg-white/20 p-6 text-white shadow-lg backdrop-blur-lg dark:bg-white/10"
          >
            <div className="inline-block rounded bg-purple-500 px-3 py-1 text-xs font-bold">
              {plan.title}
            </div>

            <h2 className="mt-4 text-3xl font-bold">
              ${isYearly ? plan.yearly : plan.monthly}
              <span className="text-sm opacity-70">/ {isYearly ? t("year") : t("month_short")}</span>
            </h2>

            <ul className="mt-4 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> {feature}
                </li>
              ))}

              {plan.missing.map((feature) => (
                <li key={feature} className="flex items-center gap-2 opacity-50">
                  <span className="text-red-400">✕</span> {feature}
                </li>
              ))}
            </ul>

            <button className="mt-5 w-full rounded-lg bg-white py-2 font-semibold text-black hover:bg-gray-200">
              {t("buy_now")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
