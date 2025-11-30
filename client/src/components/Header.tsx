import { Languages, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Header() {
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();

  // Toggle Dark Mode
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [isDark]);

  const handleHomeClick = () => {
    navigate("/", { replace: true });
  };

  return (
    <header
      className="bg-card border-b border-card-border sticky top-0 z-50"
      style={{ boxShadow: "0 4px 6px rgba(255, 165, 0, 0.5)" }}
    >
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">

        {/* LEFT — LOGO */}
        <button onClick={handleHomeClick} className="flex items-center gap-3 hover:opacity-80 transition-opacity" data-testid="button-home">
          <div className="bg-primary text-primary-foreground p-2 rounded-xl">
            <Languages className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            MCQGyaan AI
          </h1>
        </button>

        {/* CENTER — NAVIGATION */}
        <nav className="hidden sm:flex items-center gap-8 text-sm font-medium">
          <button onClick={handleHomeClick} className="hover:text-yellow-300 transition-colors" data-testid="nav-home">Home</button>
          <Link to="/features" className="hover:text-yellow-300 transition-colors">Features</Link>
          <Link to="/pricing" className="hover:text-yellow-300 transition-colors">Pricing</Link>
          <Link to="/contact" className="hover:text-yellow-300 transition-colors">Contact</Link>
        </nav>

        {/* RIGHT — LOGIN + THEME TOGGLE */}
        <div className="flex items-center gap-4">

          {/* LOGIN BUTTON */}
          <Link to="/login">
            <button className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/80 transition" data-testid="button-login">
              Login
            </button>
          </Link>

          {/* THEME TOGGLE */}
          <Button
            variant="ghost"
            onClick={() => setIsDark(!isDark)}
            data-testid="button-theme-toggle"
            className="hover-elevate h-11 w-11 p-0"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

        </div>

      </div>
    </header>
  );
}
