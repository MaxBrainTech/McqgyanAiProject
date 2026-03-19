import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

import { auth } from "@/pages/firebase";
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

  const handleSignup = async () => {
    setError("");

    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (passwordsMismatch) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
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

      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card p-6 rounded-xl shadow-md space-y-5">
        <h2 className="text-2xl font-bold text-center">
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
          className="w-full"
          onClick={handleSignup}
          disabled={loading}
        >
          {loading ? t("signup.loading") : t("signup.button")}
        </Button>

        <p className="text-sm text-center text-muted-foreground">
          {t("signup.haveAccount")}{" "}
          <span
            className="text-primary cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            {t("signup.login")}
          </span>
        </p>
      </div>
    </div>
  );
}
