import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

// Navigation Pages
import Home from "@/pages/Home";
import Features from "@/pages/Features";
import PricingPage from "@/pages/PricingPage";
import Contact from "@/pages/Contact";
import Login from "@/pages/Login";
import AboutUs from "@/pages/AboutUs";
import TermsAndConditions from "@/pages/TermsAndConditions";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import RefundPolicy from "@/pages/RefundPolicy";
import Disclaimer from "@/pages/Disclaimer";

// MCQ System Pages
import TestPage from "@/pages/TestPage";
import TeacherAuth from "@/pages/TeacherAuth";
import TeacherDashboard from "@/pages/TeacherDashboard";
import CustomTestPage from "@/pages/CustomTestPage";
import AnswerSheetEvaluator from "@/pages/AnswerSheetEvaluator";
import Signup from "@/pages/Signup";

// <Route path="/signup" element={<Signup />} />

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <ScrollToTop />

          <div className="min-h-screen flex flex-col bg-background">
            <Header />

            <main className="flex-1">
              <Routes>
                {/* Navbar Pages */}
                <Route path="/" element={<Home />} />
                <Route path="/features" element={<Features />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/about-us" element={<AboutUs />} />

                {/* Legal Pages */}
                <Route path="/terms" element={<TermsAndConditions />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/refund-policy" element={<RefundPolicy />} />
                <Route path="/disclaimer" element={<Disclaimer />} />

                {/* MCQ System Pages */}
                <Route path="/test" element={<TestPage />} />
                <Route path="/teacher-auth" element={<TeacherAuth />} />
                <Route
                  path="/teacher-dashboard"
                  element={<TeacherDashboard />}
                />
                <Route path="/custom-test" element={<CustomTestPage />} />
                <Route
                  path="/answer-evaluator"
                  element={<AnswerSheetEvaluator />}
                />
              </Routes>
            </main>

            <Footer />
          </div>

          <Toaster />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
