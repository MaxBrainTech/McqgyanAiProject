import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/pages/firebase";
import { useTranslation } from "react-i18next";

import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const role = location.pathname.includes("/teacher") ? "teacher" : "student";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      if (role === "student") {
        await sendPasswordResetEmail(auth, email);
      } else {
        await apiRequest("POST", "/api/teacher/forgot-password", { email });
      }

      setMessage(t("forgotPassword.sent"));
    } catch {
      setMessage(t("forgotPassword.failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("forgotPassword.title")}</CardTitle>
          <CardDescription>{t("forgotPassword.subtitle")}</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder={t("forgotPassword.placeholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("forgotPassword.sending") : t("forgotPassword.send")}
            </Button>

            {message && <p className="text-center text-sm">{message}</p>}

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => navigate(role === "teacher" ? "/teacher-auth" : "/login")}
            >
              {t("back_to_login")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
