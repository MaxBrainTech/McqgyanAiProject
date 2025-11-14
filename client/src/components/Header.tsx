import { Languages, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export default function Header() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <header className="bg-card border-b border-card-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-primary text-primary-foreground p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
            <Languages className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            MCQGyaan AI
          </h1>
        </div>
        <Button
          variant="ghost"
          onClick={() => setIsDark(!isDark)}
          data-testid="button-theme-toggle"
          className="hover-elevate h-11 w-11 p-0"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </div>
    </header>
  );
}
