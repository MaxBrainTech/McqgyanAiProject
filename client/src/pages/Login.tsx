import { useState, ChangeEvent, FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SignInWithGoogle from "../pages/signInWithGoogle";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/pages/firebase";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";


interface LoginForm {
  id: string;       // email
  password: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [form, setForm] = useState<LoginForm>({
    id: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 👈 NEW

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        form.id,
        form.password
      );

      console.log("Login success:", userCredential.user);
      navigate("/");
    } catch (err: any) {
      console.error("Login failed:", err);
      alert(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader>
          <CardTitle className="text-center text-xl font-semibold">
            {t("login.title")}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label>{t("login.email")}</label>
              <Input
                name="id"
                type="email"
                placeholder={t("login.emailPlaceholder")}
                value={form.id}
                onChange={handleChange}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label>{t("login.password")}</label>

              <div className="relative">
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("login.passwordPlaceholder")}
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="pr-10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("login.loading") : t("login.button")}
            </Button>

            <p className="text-sm text-center">
              {t("login.noAccount")}{" "}
              <span
                className="text-blue-500 cursor-pointer hover:underline"
                onClick={() => navigate("/signup")}
              >
                {t("login.signup")}
              </span>
            </p>

            <SignInWithGoogle />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
