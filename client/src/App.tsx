import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";
import Home from "@/pages/Home";
import TestPage from "@/pages/TestPage";

function App() {
  const [currentPage, setCurrentPage] = useState<"home" | "test">("home");
  const [testConfig, setTestConfig] = useState<any>(null);

  const handleStartTest = (config: any) => {
    setTestConfig(config);
    setCurrentPage("test");
  };

  const handleExitTest = () => {
    setCurrentPage("home");
    setTestConfig(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Header />
          {currentPage === "home" ? (
            <Home onStartTest={handleStartTest} />
          ) : (
            <TestPage config={testConfig} onExit={handleExitTest} />
          )}
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
