import { useState } from "react";
import {
  validatePassword,
  getPasswordValidation,
} from "@/lib/passwordValidation";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import AuthBackground from "@/components/auth/AuthBackground";

import { auth } from "@/pages/firebase";
import { setStudentSession } from "@/lib/authSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Signup() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;
    const passwordValidation = getPasswordValidation(password);

  const handleSignup = async () => {
    setError("");

    if (!name || !email || !password || !confirmPassword) {
      setError(t("signup.allFieldsRequired"));
      return;
    }

    if (passwordsMismatch) {
      setError(t("signup.passwordMismatch"));
      return;
    }

    const validation = validatePassword(password);

    if (!validation.valid) {
      setError(t("signup.passwordRequirements"));
      return;
    }
    

    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(userCredential.user, {
        displayName: name,
      });

      setStudentSession();
      navigate("/");
    } catch (err: any) {
      console.error("Signup failed:", err);
      setError(t("signup.signupFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthBackground>
      <div className="w-full max-w-lg">
        <div
          className="
            relative
            overflow-hidden
            rounded-[1.75rem]
            border border-blue-200/70
            bg-white/90
            backdrop-blur-xl
            shadow-[0_20px_60px_rgba(59,130,246,0.18)]
            dark:border-blue-900/30
            dark:bg-slate-950/80
            p-8
            space-y-5
          "
        >
          <h2 className="text-3xl font-black text-center text-slate-900 dark:text-slate-100">
            {t("signup.title")}
          </h2>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          {/* Name */}
          <div className="space-y-1">
            <Label>{t("signup.name")}</Label>
            <Input
              placeholder={t("signup.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Label>{t("signup.email")}</Label>
            <Input
              type="email"
              placeholder={t("signup.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <Label>{t("signup.password")}</Label>

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={t("signup.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />

              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="mt-2 space-y-1 text-xs">
              <div
                className={`flex items-center gap-2 ${
                  passwordValidation.minLength
                    ? "text-green-600"
                    : "text-muted-foreground"
                }`}
              >
                <span>{passwordValidation.minLength ? "✓" : "○"}</span>
                <span>{t("signup.passwordMinLength")}</span>
              </div>

              <div
                className={`flex items-center gap-2 ${
                  passwordValidation.specialCharacter
                    ? "text-green-600"
                    : "text-muted-foreground"
                }`}
              >
                <span>{passwordValidation.specialCharacter ? "✓" : "○"}</span>
                <span>{t("signup.passwordSpecial")}</span>
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <Label>{t("signup.confirmPassword")}</Label>

            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder={t("signup.confirmPasswordPlaceholder")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`pr-10 ${
                  passwordsMismatch ? "border-red-500" : ""
                }`}
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {passwordsMismatch && (
              <p className="text-xs text-red-500">
                {t("signup.passwordMismatch")}
              </p>
            )}
          </div>

          <Button
            className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600"
            onClick={handleSignup}
            disabled={loading}
          >
            {loading ? t("signup.loading") : t("signup.button")}
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            {t("signup.haveAccount")}{" "}
            <span
              className="cursor-pointer font-semibold text-primary hover:underline"
              onClick={() => navigate("/student-login")}
            >
              {t("signup.login")}
            </span>
          </p>
        </div>
      </div>
    </AuthBackground>
  );
}

