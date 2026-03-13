// import { Languages, Sun, Moon, LogOut } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { useState, useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { onAuthStateChanged, signOut, User } from "firebase/auth";
// import { auth } from "@/pages/firebase";

// export default function Header() {
//   const [isDark, setIsDark] = useState(false);
//   const [user, setUser] = useState<User | null>(null);
//   const navigate = useNavigate();

  

//   // 🌙 Dark mode toggle
//   useEffect(() => {
//     const root = document.documentElement;
//     if (isDark) root.classList.add("dark");
//     else root.classList.remove("dark");
//   }, [isDark]);

  

//   // 🔐 Firebase auth listener
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
//       setUser(currentUser);
//     });

//     return () => unsubscribe();
//   }, []);

//   // 🚪 Logout
//   const handleLogout = async () => {
//     await signOut(auth);
//     navigate("/login");
//   };

//   return (
//     <header
//       className="bg-card border-b border-card-border sticky top-0 z-50"
//       style={{ boxShadow: "0 4px 6px rgba(255, 165, 0, 0.5)" }}
//     >
//       <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">

//         {/* LEFT — LOGO */}
//           <button
//             onClick={() => {
//               navigate("/");
//               window.location.href = "/";
//             }}
//             className="flex items-center gap-3 hover:opacity-80 transition-opacity"
//           >
//           <div className="bg-primary text-primary-foreground p-2 rounded-xl">
//             <Languages className="w-6 h-6" />
//           </div>
//           <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
//             MCQGyaan AI
//           </h1>
//         </button>

//         {/* CENTER — NAV */}
//         <nav className="hidden sm:flex items-center gap-8 text-sm font-medium">
//           {/* <button onClick={() => navigate("/")} className="hover:text-yellow-300">
//             Home
//           </button> */}
//           <button
//             onClick={() => {
//               navigate("/");
//               window.location.href = "/";
//             }}
//             className="hover:text-yellow-300"
//           >
//             Home
//           </button>
//           <Link to="/features" className="hover:text-yellow-300">Features</Link>
//           <Link to="/pricing" className="hover:text-yellow-300">Pricing</Link>
//           <Link to="/contact" className="hover:text-yellow-300">Contact</Link>
//         </nav>

//         {/* RIGHT — AUTH + THEME */}
//         <div className="flex items-center gap-4">

//           {/* 🔐 AUTH SECTION */}
//           {user ? (
//             <div className="flex items-center gap-3">

//               {/* 👤 Google Photo */}
//               {user.photoURL && (
//                 <img
//                   src={user.photoURL}
//                   alt="profile"
//                   className="w-9 h-9 rounded-full border"
//                 />
//               )}

//               {/* 🚪 Logout */}
//               <Button
//                 variant="destructive"
//                 size="sm"
//                 onClick={handleLogout}
//                 className="flex items-center gap-1"
//               >
//                 <LogOut className="w-4 h-4" />
//                 Logout
//               </Button>
//             </div>
//           ) : (
//             <Link to="/login">
//               <button className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/80 transition">
//                 Login
//               </button>
//             </Link>
//           )}

//           {/* 🌗 Theme toggle */}
//           <Button
//             variant="ghost"
//             onClick={() => setIsDark(!isDark)}
//             className="h-11 w-11 p-0"
//           >
//             {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
//           </Button>
//         </div>
//       </div>
//     </header>
//   );
// }


import { Languages, Sun, Moon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/pages/firebase";
import { useTranslation } from "react-i18next";

export default function Header() {
  const [isDark, setIsDark] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // 🌐 Language Toggle
  const changeLanguage = () => {
    const newLang = i18n.language === "en" ? "hi" : "en";
    i18n.changeLanguage(newLang);
  };

  // 🌙 Dark mode toggle
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [isDark]);

  // 🔐 Firebase auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // 🚪 Logout
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <header
      className="bg-card border-b border-card-border sticky top-0 z-50"
      style={{ boxShadow: "0 4px 6px rgba(255, 165, 0, 0.5)" }}
    >
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">

        {/* LEFT — LOGO */}
        <button
          onClick={() => {
            navigate("/");
            window.location.href = "/";
          }}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="bg-primary text-primary-foreground p-2 rounded-xl">
            <Languages className="w-6 h-6" />
          </div>

          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            MCQGyaan AI
          </h1>
        </button>

        {/* CENTER — NAV */}
        <nav className="hidden sm:flex items-center gap-8 text-sm font-medium">

          <button
            onClick={() => {
              navigate("/");
              window.location.href = "/";
            }}
            className="hover:text-yellow-300"
          >
            {t("home")}
          </button>

          <Link to="/features" className="hover:text-yellow-300">
            {t("features")}
          </Link>

          <Link to="/pricing" className="hover:text-yellow-300">
            {t("pricing")}
          </Link>

          <Link to="/contact" className="hover:text-yellow-300">
            {t("contact")}
          </Link>

        </nav>

        {/* RIGHT — AUTH + LANGUAGE + THEME */}
        <div className="flex items-center gap-4">

          {/* 🔐 AUTH SECTION */}
          {user ? (
            <div className="flex items-center gap-3">

              {/* 👤 Google Photo */}
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt="profile"
                  className="w-9 h-9 rounded-full border"
                />
              )}

              {/* 🚪 Logout */}
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" />
               {t("Logout")}
              </Button>

            </div>
          ) : (
            <Link to="/login">
              <button className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/80 transition">
                {t("Login")}
              </button>
            </Link>
          )}

          {/* 🌐 Language Toggle */}
          <Button
            variant="ghost"
            onClick={changeLanguage}
            className="h-11 w-11 p-0"
          >
            <Languages className="w-5 h-5" />
          </Button>

          {/* 🌗 Theme toggle */}
          <Button
            variant="ghost"
            onClick={() => setIsDark(!isDark)}
            className="h-11 w-11 p-0"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

        </div>
      </div>
    </header>
  );
}