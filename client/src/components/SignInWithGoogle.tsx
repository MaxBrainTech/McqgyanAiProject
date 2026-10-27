import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  type User,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

import { auth } from "@/pages/firebase";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { setStudentSession, setTeacherSession } from "@/lib/authSession";

interface SignInWithGoogleProps {
  role: "student" | "teacher";
}

export default function SignInWithGoogle({
  role,
}: SignInWithGoogleProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleAuthError = (error: any) => {
    console.error("Google Auth error:", error);
    if (!error) return;

    if (error.code === "auth/popup-closed-by-user") {
      // User closed the popup intentionally
      return;
    }

    let description = error.message || "Failed to sign in with Google";

    if (error.code === "auth/unauthorized-domain") {
      const hostname = window.location.hostname;
      description = `Domain "${hostname}" is not authorized in Firebase Console. Please add "${hostname}" to Firebase Console -> Authentication -> Settings -> Authorized Domains.`;
    } else if (error.code === "auth/operation-not-allowed") {
      description = "Google sign-in is not enabled in Firebase Console. Please enable Google in Firebase Console -> Authentication -> Sign-in method.";
    } else if (error.code === "auth/network-request-failed") {
      description = "Network connection failed. Please verify your internet connection and try again.";
    }

    toast({
      title: t("google.errorTitle") || "Google Sign-In Failed",
      description,
      variant: "destructive",
    });
  };

  const processUser = async (user: User) => {
    // ==========================
    // Teacher Login
    // ==========================
    if (role === "teacher") {
      console.log("Calling Teacher Google Login API...", { email: user.email });

      const teacherRes = await apiRequest(
        "POST",
        "/api/teacher/google-login",
        {
          email: user.email,
          fullName: user.displayName,
          photoURL: user.photoURL,
        }
      );

      const teacher = await teacherRes.json();
      console.log("Teacher Response:", teacher);

      if (teacher.id) {
        setTeacherSession(teacher.id);
      }

      // If email not verified (regular registrations)
      if (!teacher.verified) {
        navigate("/teacher-verification-pending", {
          state: {
            teacher,
          },
          replace: true,
        });
        return;
      }

      // If not approved
      if (!teacher.approved) {
        navigate("/teacher-approval-pending", {
          state: {
            teacher,
          },
          replace: true,
        });
        return;
      }

      toast({
        title: t("google.successTitle"),
        description:
          teacher.email ??
          user.email ??
          t("google.successDesc"),
      });

      navigate("/teacher-dashboard", {
        state: {
          teacherData: teacher,
        },
        replace: true,
      });

      return;
    }

    // ==========================
    // Student Login
    // ==========================
    setStudentSession();

    toast({
      title: t("google.successTitle"),
      description:
        user.email ?? t("google.successDesc"),
    });

    navigate("/profile", { replace: true });
  };

  // Check for redirect result on mount (for mobile / redirect logins)
  useEffect(() => {
    let isMounted = true;

    getRedirectResult(auth)
      .then(async (result) => {
        if (!isMounted || !result?.user) return;
        setLoading(true);
        try {
          await processUser(result.user);
        } catch (err: any) {
          if (isMounted) handleAuthError(err);
        } finally {
          if (isMounted) setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) handleAuthError(err);
      });

    return () => {
      isMounted = false;
    };
  }, [role]);

  const googleLogin = async () => {
    if (loading) return;

    try {
      setLoading(true);

      const provider = new GoogleAuthProvider();
      provider.addScope("profile");
      provider.addScope("email");
      provider.setCustomParameters({
        prompt: "select_account",
      });

      let user: User | null = null;

      try {
        const result = await signInWithPopup(auth, provider);
        user = result.user;
      } catch (popupErr: any) {
        if (
          popupErr?.code === "auth/popup-blocked" ||
          popupErr?.code === "auth/cancelled-popup-request"
        ) {
          console.warn("Popup blocked or cancelled, falling back to signInWithRedirect...");
          await signInWithRedirect(auth, provider);
          return;
        }
        throw popupErr;
      }

      if (user) {
        await processUser(user);
      }
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 text-center">
      <p className="mb-3 text-sm text-muted-foreground">
        {t("google.or")}
      </p>

      <div
        className={`flex justify-center ${
          loading ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        }`}
        onClick={loading ? undefined : googleLogin}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!loading) googleLogin();
          }
        }}
        aria-label="Sign In with Google"
        aria-disabled={loading}
      >
        {loading ? (
          <div className="flex h-11 w-44 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-xs">Signing in...</span>
          </div>
        ) : (
          <img
            src="/google.png"
            alt="Google Sign In"
            className="w-44 transition hover:scale-105"
          />
        )}
      </div>
    </div>
  );
}
