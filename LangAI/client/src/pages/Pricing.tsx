import React, { useState } from "react";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 dark:from-gray-900 dark:to-black p-6">
      {/* Title */}
      <div className="text-center text-white mb-10">
        <h1 className="text-3xl font-bold">Our Pricing & Plans</h1>
        <p className="opacity-70">
          Choose your plan that fits best for you.
        </p>

        {/* Toggle Monthly / Yearly */}
        <div className="mt-5 bg-white/20 p-2 rounded-xl inline-flex backdrop-blur">
          <button
            onClick={() => setIsYearly(false)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              !isYearly ? "bg-white text-black" : "text-white"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              isYearly ? "bg-white text-black" : "text-white"
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.title}
            className="bg-white/20 dark:bg-white/10 backdrop-blur-lg rounded-xl p-6 text-white shadow-lg"
          >
            <div className="inline-block bg-purple-500 text-xs font-bold px-3 py-1 rounded">
              {plan.title}
            </div>

            <h2 className="text-3xl font-bold mt-4">
              ${isYearly ? plan.yearly : plan.monthly}
              <span className="text-sm opacity-70">/ {isYearly ? "year" : "mon"}</span>
            </h2>

            <ul className="mt-4 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2 items-center">
                  <span className="text-green-400">✔</span> {f}
                </li>
              ))}

              {plan.missing.map((m) => (
                <li key={m} className="flex gap-2 items-center opacity-50">
                  <span className="text-red-400">✘</span> {m}
                </li>
              ))}
            </ul>

            <button className="mt-5 w-full py-2 bg-white text-black rounded-lg font-semibold hover:bg-gray-200">
              BUY NOW
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}







// export default function Pricing() {
//   return <div className="p-10 text-3xl font-bold">Pricing Page</div>;
// }
