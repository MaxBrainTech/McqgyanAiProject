import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";
import Home from "@/pages/Home";
import TestPage from "@/pages/TestPage";
import TeacherAuth from "@/pages/TeacherAuth";
import TeacherDashboard from "@/pages/TeacherDashboard";
import CustomTestPage from "@/pages/CustomTestPage";

function App() {
  const [currentPage, setCurrentPage] = useState<"home" | "test" | "teacher-auth" | "teacher-dashboard" | "custom-test">("home");
  const [testConfig, setTestConfig] = useState<any>(null);
  const [teacherData, setTeacherData] = useState<any>(null);

  const handleStartTest = (config: any) => {
    setTestConfig(config);
    setCurrentPage("test");
  };

  const handleExitTest = () => {
    setCurrentPage("home");
    setTestConfig(null);
  };

  const handleTeacherLogin = () => {
    setCurrentPage("teacher-auth");
  };

  const handleTeacherSuccess = (data: any) => {
    setTeacherData(data);
    setCurrentPage("teacher-dashboard");
  };

  const handleTeacherLogout = () => {
    setTeacherData(null);
    setCurrentPage("home");
  };

  const handleStudentTest = () => {
    setCurrentPage("custom-test");
  };

  const handleBackToHome = () => {
    setCurrentPage("home");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return (
          <Home
            onStartTest={handleStartTest}
            onCustomMCQ={{
              teacher: handleTeacherLogin,
              student: handleStudentTest,
            }}
          />
        );
      case "test":
        return <TestPage config={testConfig} onExit={handleExitTest} />;
      case "teacher-auth":
        return <TeacherAuth onSuccess={handleTeacherSuccess} />;
      case "teacher-dashboard":
        return <TeacherDashboard teacherData={teacherData} onLogout={handleTeacherLogout} />;
      case "custom-test":
        return <CustomTestPage onBack={handleBackToHome} />;
      default:
        return <Home onStartTest={handleStartTest} onCustomMCQ={{ teacher: handleTeacherLogin, student: handleStudentTest }} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          {currentPage === "home" && <Header />}
          {renderPage()}
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
