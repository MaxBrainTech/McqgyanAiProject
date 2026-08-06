import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
  Languages,
  LogOut,
  Menu,
  Moon,
  Sun,
  User as UserIcon,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { auth } from "@/pages/firebase";
import LanguageToggle from "@/components/LanguageToggle";
import { useTranslation } from "react-i18next";
import {
  clearAuthSession,
  getStoredAuthRole,
  getStoredTeacherId,
  type AuthRole,
} from "@/lib/authSession";

type TeacherProfile = {
  id?: string;
  username?: string;
  email?: string;
  fullName?: string;
  school?: string;
};

const normalizeTeacherProfile = (teacher: any = {}): TeacherProfile => ({
  id: teacher.id,
  username: teacher.username,
  email: teacher.email,
  fullName: teacher.fullName || teacher.full_name || teacher.name || "",
  school: teacher.school || "",
});

const getUserLabel = (user: User | null, fallback = "User") => {
  if (!user) return fallback;
  return user.displayName || user.email || fallback;
};

export default function Header() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("theme") === "dark";
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authRole, setAuthRole] = useState<AuthRole | null>(() =>
    getStoredAuthRole() ?? (getStoredTeacherId() ? "teacher" : null),
  );
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [teacherLoading, setTeacherLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { label: t("home"), to: "/" },
    { label: t("features"), to: "/features" },
    { label: t("pricing"), to: "/pricing" },
    { label: t("contact"), to: "/contact" },
  ];

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const storedRole = getStoredAuthRole();
    const storedTeacherId = getStoredTeacherId();

    if (storedRole) {
      setAuthRole(storedRole);
      return;
    }

    if (storedTeacherId) {
      setAuthRole("teacher");
      return;
    }

    if (firebaseUser) {
      setAuthRole("student");
      return;
    }

    setAuthRole(null);
  }, [firebaseUser, location.pathname]);

  useEffect(() => {
    const teacherId = getStoredTeacherId();

    if (authRole !== "teacher" || !teacherId) {
      setTeacherProfile(null);
      return;
    }

    let cancelled = false;
    setTeacherLoading(true);

    (async () => {
      try {
        const res = await fetch(`/api/teacher/${teacherId}`, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(t("teacher_profile_load_failed"));
        }

        const data = normalizeTeacherProfile(await res.json());
        if (!cancelled) {
          setTeacherProfile(data);
        }
      } catch {
        if (!cancelled) {
          setTeacherProfile({ id: teacherId });
        }
      } finally {
        if (!cancelled) {
          setTeacherLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authRole, location.pathname]);

  const isTeacherSession = authRole === "teacher";
  const isStudentSession = authRole === "student" || (!isTeacherSession && !!firebaseUser);

  const profileRoute = isTeacherSession ? "/teacher-dashboard" : "/profile";
  const profileLabel = isTeacherSession ? t("teacher_dashboard") : t("my_profile");

  const displayName = useMemo(() => {
    if (isTeacherSession) {
      return teacherProfile?.fullName || firebaseUser?.displayName || t("teacher_account");
    }

    return getUserLabel(firebaseUser, t("student_account"));
  }, [firebaseUser, isTeacherSession, teacherProfile?.fullName, t]);

  const displayEmail = useMemo(() => {
    if (isTeacherSession) {
      return teacherProfile?.email || firebaseUser?.email || t("teacher_account");
    }

    return firebaseUser?.email || t("student_account");
  }, [firebaseUser, isTeacherSession, teacherProfile?.email, t]);

  const displayPhoto = useMemo(() => {
    if (isTeacherSession) {
      return firebaseUser?.photoURL || null;
    }

    return firebaseUser?.photoURL || null;
  }, [firebaseUser, isTeacherSession]);

  const handleLogout = async () => {
    clearAuthSession();
    setIsMenuOpen(false);
    setTeacherProfile(null);
    setAuthRole(null);
    setFirebaseUser(null);

    try {
      await signOut(auth);
    } catch {
      // Ignore sign-out failures so local session cleanup still completes.
    }

    navigate("/login");
  };

  const handleLogoClick = () => {
    setIsMenuOpen(false);
    navigate("/");
  };

  const renderAvatar = (sizeClass = "h-10 w-10") => (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-full border bg-card text-slate-900 transition hover:border-primary ${sizeClass}`}
    >
      {displayPhoto ? (
        <img
          src={displayPhoto}
          alt={displayName}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <UserIcon className="h-5 w-5" />
      )}
    </div>
  );

  return (
    <header
      className="sticky top-0 z-50 border-b border-card-border bg-card/95 backdrop-blur"
      style={{ boxShadow: "0 4px 6px rgba(255, 165, 0, 0.35)" }}
    >
      <div className="container mx-auto flex items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6 lg:px-4 xl:px-6">
        <button
          type="button"
          onClick={handleLogoClick}
          className="flex flex-none items-center gap-2 transition-opacity hover:opacity-80 sm:gap-3"
        >
          <div className="shrink-0 rounded-xl bg-primary p-2 text-primary-foreground">
            <Languages className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <h1 className="max-w-[10rem] overflow-hidden whitespace-nowrap bg-gradient-to-r from-primary to-accent bg-clip-text text-sm font-bold leading-tight text-transparent sm:max-w-[11.5rem] sm:text-base md:max-w-[13rem] md:text-lg lg:text-xl xl:text-2xl">
            MCQGyaan AI
          </h1>
        </button>

        <nav className="hidden items-center gap-8 text-sm font-medium lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          {isTeacherSession || isStudentSession ? (
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border bg-card text-slate-900 transition hover:border-primary"
                    aria-label={displayName}
                  >
                    {renderAvatar()}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64">
                  <DropdownMenuLabel className="space-y-1">
                    <div className="flex items-center gap-3">
                      {renderAvatar("h-10 w-10")}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {displayName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {displayEmail}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate(profileRoute)}
                    className="cursor-pointer"
                  >
                    {profileLabel}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={handleLogout}
                    className="cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("nav_logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Link to="/login">
              <Button size="sm">{t("nav_login")}</Button>
            </Link>
          )}

          <LanguageToggle />

          <Button
            variant="ghost"
            onClick={() => setIsDark((value) => !value)}
            className="h-11 w-11 p-0"
            aria-label={t("toggle_theme")}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1 lg:hidden">
          <div className="flex items-center gap-1">
            <LanguageToggle className="flex" />
            <Button
              variant="ghost"
              onClick={() => setIsDark((value) => !value)}
              className="h-10 w-10 shrink-0 p-0"
              aria-label={t("toggle_theme")}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
          <Button
            variant="ghost"
            onClick={() => setIsMenuOpen((value) => !value)}
            className="h-10 w-10 shrink-0 p-0"
            aria-label={t("toggle_menu")}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-t border-border bg-card px-4 py-4 shadow-lg lg:hidden">
          <nav className="grid gap-2">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-4 border-t border-border pt-4">
            {isTeacherSession || isStudentSession ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-3 py-3">
                  {renderAvatar("h-12 w-12")}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {displayName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {displayEmail}
                    </p>
                  </div>
                </div>

                <Link to={profileRoute} onClick={() => setIsMenuOpen(false)}>
                  <Button size="sm" className="w-full justify-center">
                    {profileLabel}
                  </Button>
                </Link>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full justify-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  {t("nav_logout")}
                </Button>
              </div>
            ) : (
              <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                <Button size="sm" className="w-full">
                  {t("nav_login")}
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
