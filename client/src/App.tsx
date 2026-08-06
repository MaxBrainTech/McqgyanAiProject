import NotFound from "@/pages/NotFound";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

// Navigation Pages
import Home from "@/pages/Home";
import Features from "@/pages/Features";
import PricingPage from "@/pages/PricingPage";
import Contact from "@/pages/Contact";
import Login from "@/pages/Login";
import LoginChoice from "./pages/LoginChoice";
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
import StudentProfile from "@/pages/StudentProfile";
import { TeacherRouteGuard, StudentProfileRouteGuard } from "@/components/RoleRouteGuards";
import TeacherVerificationPending from "@/pages/TeacherVerificationPending";
import TeacherApprovalPending from "@/pages/TeacherApprovalPending";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminTeacherDetails from "@/pages/AdminTeacherDetails";
import AdminStudentDetails from "@/pages/AdminStudentDetails";
import { AdminRouteGuard } from "@/components/AdminRouteGuard";

// <Route path="/signup" element={<Signup />} />

function AppShell() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-background">
      {!isAdminRoute && <Header />}

      <main className="flex-1 w-full overflow-x-hidden">
        <Routes>
          {/* Navbar Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<LoginChoice />} />
          <Route path="/student-login" element={<Login />} />
          <Route
            path="/student/forgot-password"
            element={<ForgotPassword />}
          />
          <Route
            path="/student/reset-password"
            element={<ResetPassword />}
          />
          <Route path="/signup" element={<Signup />} />
          <Route path="/about-us" element={<AboutUs />} />

          {/* Admin Pages */}
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route
            path="/admin-dashboard"
            element={
              <AdminRouteGuard>
                <AdminDashboard />
              </AdminRouteGuard>
            }
          />
          <Route
            path="/admin/teachers/:teacherId"
            element={
              <AdminRouteGuard>
                <AdminTeacherDetails />
              </AdminRouteGuard>
            }
          />
          <Route
            path="/admin/students/:studentId"
            element={
              <AdminRouteGuard>
                <AdminStudentDetails />
              </AdminRouteGuard>
            }
          />

          {/* Legal Pages */}
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/disclaimer" element={<Disclaimer />} />

          {/* MCQ System Pages */}
          <Route path="/test" element={<TestPage />} />
          <Route path="/teacher-auth" element={<TeacherAuth />} />
          <Route
            path="/teacher/forgot-password"
            element={<ForgotPassword />}
          />
          <Route
            path="/teacher/reset-password"
            element={<ResetPassword />}
          />
          <Route
            path="/teacher-dashboard"
            element={
              <TeacherRouteGuard>
                <TeacherDashboard />
              </TeacherRouteGuard>
            }
          />
          <Route
            path="/teacher-verification-pending"
            element={<TeacherVerificationPending />}
          />
          <Route
            path="/teacher-approval-pending"
            element={<TeacherApprovalPending />}
          />
          <Route path="/custom-test" element={<CustomTestPage />} />
          <Route
            path="/answer-evaluator"
            element={<AnswerSheetEvaluator />}
          />
          <Route
            path="/profile"
            element={
              <StudentProfileRouteGuard>
                <StudentProfile />
              </StudentProfileRouteGuard>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AppShell />

          <Toaster />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
