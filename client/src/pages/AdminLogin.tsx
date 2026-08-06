import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, ShieldCheck, LockKeyhole } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { fetchAdminSession, loginAdmin } from "@/lib/adminAuth";

const adminLoginSchema = z.object({
  email: z.string().email("adminLogin.invalidEmail"),
  password: z.string().min(1, "adminLogin.passwordRequired"),
});

type AdminLoginForm = z.infer<typeof adminLoginSchema>;

export default function AdminLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<AdminLoginForm>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const session = await fetchAdminSession();

        if (!cancelled && session) {
          navigate("/admin-dashboard", { replace: true });
        }
      } catch {
        // Stay on the login page when the session cannot be loaded.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function handleSubmit(data: AdminLoginForm) {
    try {
      await loginAdmin(data.email, data.password);

      toast({
        title: t("adminLogin.successTitle"),
        description: t("adminLogin.successDesc"),
      });

      navigate("/admin-dashboard", { replace: true });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("adminLogin.failedTitle"),
        description: error.message || t("adminLogin.invalidCredentials"),
      });
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-0px)] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_45%),linear-gradient(135deg,#f8fafc,#eef2ff_45%,#fff7ed)] px-4 py-10">
      <Card className="w-full max-w-md overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-200/70 backdrop-blur">
        <CardHeader className="pb-6 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 via-blue-700 to-cyan-600 shadow-lg shadow-blue-500/25">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-slate-900">
            {t("adminLogin.title")}
          </CardTitle>
          <CardDescription className="mx-auto max-w-sm text-slate-600">
            {t("adminLogin.description")}
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{t("adminLogin.email")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="username"
                        placeholder={t("adminLogin.emailPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage>{fieldState.error?.message && t(fieldState.error.message)}</FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{t("adminLogin.password")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder={t("adminLogin.passwordPlaceholder")}
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-900"
                          aria-label={showPassword ? t("adminLogin.hidePassword") : t("adminLogin.showPassword")}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage>{fieldState.error?.message && t(fieldState.error.message)}</FormMessage>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-gradient-to-r from-slate-900 via-blue-700 to-cyan-600 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              >
                <LockKeyhole className="mr-2 h-4 w-4" />
                {t("adminLogin.button")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
