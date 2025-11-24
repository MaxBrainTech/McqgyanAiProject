// import { Languages, Sun, Moon } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { useState, useEffect } from "react";

// export default function Header() {
//   const [isDark, setIsDark] = useState(false);

//   useEffect(() => {
//     const root = document.documentElement;
//     if (isDark) {
//       root.classList.add("dark");
//     } else {
//       root.classList.remove("dark");
//     }
//   }, [isDark]);

//   return (
//     <header className="bg-card border-b border-card-border sticky top-0 z-50 shadow-sm">
//       <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
//         <div className="flex items-center gap-2 sm:gap-3">
//           <div className="bg-primary text-primary-foreground p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
//             <Languages className="w-5 h-5 sm:w-6 sm:h-6" />
//           </div>
//           <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
//             MCQGyaan AI
//           </h1>
//         </div>
//         <Button
//           variant="ghost"
//           onClick={() => setIsDark(!isDark)}
//           data-testid="button-theme-toggle"
//           className="hover-elevate h-11 w-11 p-0"
//         >
//           {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
//         </Button>
//       </div>
//     </header>
//   );
// }

import { Languages, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

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

        {/* LOGO */}
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground p-2 rounded-xl">
            <Languages className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            MCQGyaan AI
          </h1>
        </div>

        {/* NAVIGATION */}
        <nav className="hidden sm:flex items-center gap-12 text-sm font-medium">
          <Link to="/" className="hover:text-primary leading-none">Home</Link>
          
          <Link to="/features" state={{ autoOpenScience: true }}>
             Features
          </Link>






          <Link to="/pricing" className="hover:text-primary leading-none">Pricing</Link>
          <Link to="/contact" className="hover:text-primary leading-none">Contact</Link>
          <button className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/80 transition">
            <Link to="/login" className="w-full h-full block">
              Login
            </Link>
          </button>

        </nav>

        {/* THEME TOGGLE */}
        <Button
          variant="ghost"
          onClick={() => setIsDark(!isDark)}
          data-testid="button-theme-toggle"
          className="hover-elevate h-11 w-11 p-0 ml-4"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>

      </div>
    </header>
  );
}

