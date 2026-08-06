import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

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

  const googleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();

      provider.addScope("profile");
      provider.addScope("email");
      provider.setCustomParameters({
        prompt: "select_account",
      });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // ==========================
      // Teacher Login
      // ==========================
      if (role === "teacher") {
        console.log("Calling Google Login API...");

        const teacherRes = await apiRequest(
          "POST",
          "/api/teacher/google-login",
          {
            email: user.email,
            fullName: user.displayName,
            photoURL: user.photoURL,
          }
        );

        console.log("Response Status:", teacherRes.status);

        const teacher = await teacherRes.json();

        console.log("Teacher Response:", teacher);

        // 🚫 Email not verified
        if (!teacher.verified) {
          navigate("/teacher-verification-pending", {
            state: {
              teacher,
            },
            replace: true,
          });
          return;
        }

        if (!teacher.approved) {
          if (teacher.id) {
            setTeacherSession(teacher.id);
          }

          navigate("/teacher-approval-pending", {
            state: {
              teacher,
            },
            replace: true,
          });
          return;
        }

        // ✅ Verified teacher
        if (teacher.id) {
          setTeacherSession(teacher.id);
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

      window.location.href = "/profile";
    } catch (error: any) {
      console.error(error);

      toast({
        title: t("google.errorTitle"),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mt-4 text-center">
      <p className="mb-3 text-sm text-muted-foreground">
        {t("google.or")}
      </p>

      <div
        className="flex cursor-pointer justify-center"
        onClick={googleLogin}
      >
        <img
          src="/google.png"
          alt="Google Sign In"
          className="w-44 transition hover:scale-105"
        />
      </div>
    </div>
  );
}
