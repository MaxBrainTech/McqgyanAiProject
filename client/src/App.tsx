// import { useState } from "react";
// import { QueryClientProvider } from "@tanstack/react-query";
// import { queryClient } from "./lib/queryClient";
// import { Toaster } from "@/components/ui/toaster";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import Header from "@/components/Header";
// import Home from "@/pages/Home";
// import TestPage from "@/pages/TestPage";
// import TeacherAuth from "@/pages/TeacherAuth";
// import TeacherDashboard from "@/pages/TeacherDashboard";
// import CustomTestPage from "@/pages/CustomTestPage";
// import AnswerSheetEvaluator from "@/pages/AnswerSheetEvaluator";

// function App() {
//   const [currentPage, setCurrentPage] = useState<"home" | "test" | "teacher-auth" | "teacher-dashboard" | "custom-test" | "answer-evaluator">("home");
//   const [testConfig, setTestConfig] = useState<any>(null);
//   const [teacherData, setTeacherData] = useState<any>(null);

//   const handleStartTest = (config: any) => {
//     setTestConfig(config);
//     setCurrentPage("test");
//   };

//   const handleExitTest = () => {
//     setCurrentPage("home");
//     setTestConfig(null);
//   };

//   const handleTeacherLogin = () => {
//     setCurrentPage("teacher-auth");
//   };

//   const handleTeacherSuccess = (data: any) => {
//     setTeacherData(data);
//     setCurrentPage("teacher-dashboard");
//   };

//   const handleTeacherLogout = () => {
//     setTeacherData(null);
//     setCurrentPage("home");
//   };

//   const handleStudentTest = () => {
//     setCurrentPage("custom-test");
//   };

//   const handleBackToHome = () => {
//     setCurrentPage("home");
//   };

//   const handleAnswerEvaluator = () => {
//     setCurrentPage("answer-evaluator");
//   };

//   const renderPage = () => {
//     switch (currentPage) {
//       case "home":
//         return (
//           <Home
//             onStartTest={handleStartTest}
//             onCustomMCQ={{
//               teacher: handleTeacherLogin,
//               student: handleStudentTest,
//             }}
//             onAnswerEvaluator={handleAnswerEvaluator}
//           />
//         );
//       case "test":
//         return <TestPage config={testConfig} onExit={handleExitTest} />;
//       case "teacher-auth":
//         return <TeacherAuth onSuccess={handleTeacherSuccess} />;
//       case "teacher-dashboard":
//         return <TeacherDashboard teacherData={teacherData} onLogout={handleTeacherLogout} />;
//       case "custom-test":
//         return <CustomTestPage onBack={handleBackToHome} />;
//       case "answer-evaluator":
//         return <AnswerSheetEvaluator />;
//       default:
//         return <Home onStartTest={handleStartTest} onCustomMCQ={{ teacher: handleTeacherLogin, student: handleStudentTest }} onAnswerEvaluator={handleAnswerEvaluator} />;
//     }
//   };

//   return (
//     <QueryClientProvider client={queryClient}>
//       <TooltipProvider>
//         <div className="min-h-screen bg-background">
//           {currentPage === "home" && <Header />}
//           {renderPage()}
//         </div>
//         <Toaster />
//       </TooltipProvider>
//     </QueryClientProvider>
//   );
// }

// export default App;



// App.tsx
import { Router, Route, Switch } from "wouter";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Header from "@/components/Header";

// Navigation Pages
import Home from "@/pages/Home";
import Features from "@/pages/Feature";
import Pricing from "@/pages/Pricing";
import Contact from "@/pages/Contact";
import Login from "@/pages/Login";

// MCQ System Pages
import TestPage from "@/pages/TestPage";
import TeacherAuth from "@/pages/TeacherAuth";
import TeacherDashboard from "@/pages/TeacherDashboard";
import CustomTestPage from "@/pages/CustomTestPage";
import AnswerSheetEvaluator from "@/pages/AnswerSheetEvaluator";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Header />

            <Switch>
              {/* Navbar Pages */}
              <Route path="/" component={Home} />
              <Route path="/features" component={Features} />
              <Route path="/pricing" component={Pricing} />
              <Route path="/contact" component={Contact} />
              <Route path="/login" component={Login} />

              {/* MCQ System Pages */}
              <Route path="/test" component={TestPage} />
              <Route path="/teacher-auth" component={TeacherAuth} />
              <Route path="/teacher-dashboard" component={TeacherDashboard} />
              <Route path="/custom-test" component={CustomTestPage} />
              <Route path="/answer-evaluator" component={AnswerSheetEvaluator} />
            </Switch>
          </div>
          <Toaster />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
