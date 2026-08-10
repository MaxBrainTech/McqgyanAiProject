import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthBackground from "@/components/auth/AuthBackground";
import {
  validatePassword,
  getPasswordValidation,
} from "@/lib/passwordValidation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, GraduationCap } from "lucide-react";
import { useTranslation } from "react-i18next";

import SignInWithGoogle from "@/components/SignInWithGoogle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { clearAuthSession, getStoredAuthRole, getStoredTeacherId, setTeacherSession } from "@/lib/authSession";

const loginSchema = z.object({
  username: z.string().min(3, { message: "teacherAuth.usernameMin" }),
  password: z
  .string()
  .min(8, { message: "teacherAuth.passwordMinLength" })
  .refine(
    (value) => /[!@#$%^&*(),.?":{}|<>]/.test(value),
    {
      message: "teacherAuth.passwordSpecial",
    }
  ),
});

const registerSchema = z.object({
  username: z.string().min(3, { message: "teacherAuth.usernameMin" }),
  password: z
  .string()
  .min(8, { message: "teacherAuth.passwordMinLength" })
  .refine(
    (value) => /[!@#$%^&*(),.?":{}|<>]/.test(value),
    {
      message: "teacherAuth.passwordSpecial",
    }
  ),
  fullName: z.string().min(2, { message: "teacherAuth.fullNameMin" }),
  email: z.string().email({ message: "teacherAuth.invalidEmail" }),
  school: z.string().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

const normalizeTeacherProfile = (teacher: any = {}) => ({
  ...teacher,
  fullName:
    teacher.fullName ||
    teacher.full_name ||
    teacher.name ||
    "",
  approved:
    teacher.approved ??
    teacher.isApproved ??
    teacher.is_approved ??
    false,
});

export default function TeacherAuth() {

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLogin, setIsLogin] = useState(true);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
 
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  useEffect(() => {
    const storedTeacherId = getStoredTeacherId();
    const storedRole = getStoredAuthRole();

    if (storedRole !== "teacher" && !storedTeacherId) {
      return;
    }

    if (!storedTeacherId) {
      clearAuthSession();
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/teacher/${storedTeacherId}`, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(t("teacher_profile_load_failed"));
        }

        const response = normalizeTeacherProfile(await res.json());

        if (cancelled) return;

        if (!response.verified) {
          navigate("/teacher-verification-pending", {
            state: { teacher: response },
            replace: true,
          });
          return;
        }

        if (!response.approved) {
          navigate("/teacher-approval-pending", {
            state: { teacher: response },
            replace: true,
          });
          return;
        }

        navigate("/teacher-dashboard", {
          state: { teacherData: response },
          replace: true,
        });
      } catch {
        if (!cancelled) {
          clearAuthSession();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      school: "",
    },
  });
   const registerPassword = registerForm.watch("password");
const passwordValidation = getPasswordValidation(registerPassword || "");

 async function handleLogin(data: LoginForm) {
  try {
    const res = await apiRequest("POST", "/api/teacher/login", data);
    const response = normalizeTeacherProfile(await res.json());

    if (response.verified) {
      setTeacherSession(response.id);

      if (!response.approved) {
        navigate("/teacher-approval-pending", {
          state: {
            teacher: response,
          },
        });
        return;
      }

      navigate("/teacher-dashboard", {
        state: {
          teacherData: response,
        },
      });
    } else {
      navigate("/teacher-verification-pending", {
        state: {
          teacher: response,
        },
      });
    }
  } catch (error: any) {
    toast({
      variant: "destructive",
      title: t("teacherAuth.loginFailed"),
      description: error.message || t("teacherAuth.invalidCredentials"),
    });
  }
}

  async function handleRegister(data: RegisterForm) {
    const validation = validatePassword(data.password);

    if (!validation.valid) {
      toast({
        variant: "destructive",
        title: t("teacherAuth.invalidPassword"),
        description: t("teacherAuth.passwordRequirements"),
      });

      return;
    }
        try {

      const res = await apiRequest("POST", "/api/teacher/register", data);
      const response = normalizeTeacherProfile(await res.json());

      toast({
        title: t("teacher_register_success_title"),
        description: t("teacher_register_success_desc"),
      });

      navigate("/teacher-verification-pending", {
        state: {
          teacher: response,
        },
      });

    } catch (error: any) {

      toast({
        variant: "destructive",
        title: t("teacherAuth.registerFailed"),
        description: error.message || t("teacherAuth.couldNotCreate"),
      });

    }
  }

  return (
    <AuthBackground>

    <div
  className={`w-full transition-all duration-300 ${
    isLogin ? "max-w-md" : "max-w-lg"
  }`}
>

    <Card
      className="
        rounded-[1.75rem]
        border border-blue-200/70
        bg-white/90
        backdrop-blur-xl
        shadow-[0_20px_60px_rgba(59,130,246,0.18)]
        dark:border-blue-900/30
        dark:bg-slate-950/80
      "
    >

        <CardHeader className="text-center">

          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
          </div>

          <CardTitle className="text-2xl">
            {t("teacherAuth.portal")}
          </CardTitle>

          <CardDescription>
            {isLogin
              ? t("teacherAuth.loginDescription")
              : t("teacherAuth.registerDescription")}
          </CardDescription>

        </CardHeader>

        <CardContent>

          {/* LOGIN FORM */}

          {isLogin && (

            <Form {...loginForm}>

              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">

                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field, fieldState }) => (
                    <FormItem>

                      <FormLabel>{t("teacherAuth.username")}</FormLabel>

                      <FormControl>
                        <Input
                          placeholder={t("teacherAuth.enterUsername")}
                          {...field}
                        />
                      </FormControl>

                      <FormMessage>
                        {fieldState.error?.message && t(fieldState.error.message)}
                      </FormMessage>

                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field, fieldState }) => (

                    <FormItem>

                      <FormLabel>{t("teacherAuth.password")}</FormLabel>

                      <FormControl>

                        <div className="relative">

                          <Input
                            type={showLoginPassword ? "text" : "password"}
                            placeholder={t("teacherAuth.enterPassword")}
                            {...field}
                          />

                          <button
                            type="button"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                          >
                            {showLoginPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                          </button>

                        </div>

                      </FormControl>

                      <FormMessage>
                        {fieldState.error?.message && t(fieldState.error.message)}
                      </FormMessage>

                    </FormItem>

                  )}
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate("/teacher/forgot-password")}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {t("teacher_forgot_password")}
                  </button>
                </div>

                <Button type="submit" className="w-full">
                  {t("teacherAuth.login")}
                </Button>
                <SignInWithGoogle role="teacher" />

              </form>

            </Form>

          )}

          {/* REGISTER FORM */}

          {!isLogin && (

            <Form {...registerForm}>

              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">

                <FormField
                  control={registerForm.control}
                  name="fullName"
                  render={({ field, fieldState }) => (

                    <FormItem>

                      <FormLabel>{t("teacherAuth.fullName")}</FormLabel>

                      <FormControl>
                        <Input placeholder={t("teacherAuth.fullNamePlaceholder")} {...field} />
                      </FormControl>

                      <FormMessage>
                        {fieldState.error?.message && t(fieldState.error.message)}
                      </FormMessage>

                    </FormItem>

                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field, fieldState }) => (

                    <FormItem>

                      <FormLabel>{t("teacherAuth.email")}</FormLabel>

                      <FormControl>
                        <Input type="email" placeholder={t("teacherAuth.emailPlaceholder")} {...field} />
                      </FormControl>

                      <FormMessage>
                        {fieldState.error?.message && t(fieldState.error.message)}
                      </FormMessage>

                    </FormItem>

                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field, fieldState }) => (

                    <FormItem>

                      <FormLabel>{t("teacherAuth.username")}</FormLabel>

                      <FormControl>
                        <Input placeholder={t("teacherAuth.chooseUsername")} {...field} />
                      </FormControl>

                      <FormMessage>
                        {fieldState.error?.message && t(fieldState.error.message)}
                      </FormMessage>

                    </FormItem>

                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field, fieldState }) => (

                    <FormItem>

                      <FormLabel>{t("teacherAuth.password")}</FormLabel>

                      <FormControl>

                        <div className="relative">

                          <Input
                            type={showRegisterPassword ? "text" : "password"}
                            placeholder={t("teacherAuth.passwordPlaceholder")}
                            {...field}
                          />

                          <button
                            type="button"
                            onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                          >
                            {showRegisterPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                          </button>

                        </div>

                      </FormControl>

                      <FormMessage>
                        {fieldState.error?.message && t(fieldState.error.message)}
                      </FormMessage>
                      <div className="mt-2 space-y-1 text-xs">
                        <div
                          className={`flex items-center gap-2 ${
                            passwordValidation.minLength
                              ? "text-green-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          <span>{passwordValidation.minLength ? "✓" : "○"}</span>
                          <span>{t("teacherAuth.passwordMinLength")}</span>
                        </div>

                        <div
                          className={`flex items-center gap-2 ${
                            passwordValidation.specialCharacter
                              ? "text-green-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          <span>{passwordValidation.specialCharacter ? "✓" : "○"}</span>
                          <span>{t("teacherAuth.passwordSpecial")}</span>
                        </div>
                      </div>

                    </FormItem>

                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="school"
                  render={({ field }) => (

                    <FormItem>

                      <FormLabel>{t("teacherAuth.school")}</FormLabel>

                      <FormControl>
                        <Input placeholder={t("teacherAuth.schoolPlaceholder")} {...field} />
                      </FormControl>

                    </FormItem>

                  )}
                />

                <Button type="submit" className="w-full">
                  {t("teacherAuth.register")}
                </Button>

              </form>

            </Form>

          )}

          <div className="mt-4 text-center">

            <Button
              variant="ghost"
              onClick={() => setIsLogin(!isLogin)}
            >

              {isLogin
                ? t("teacherAuth.noAccount")
                : t("teacherAuth.haveAccount")}

            </Button>

          </div>

        </CardContent>

      </Card>

    </div>
  </AuthBackground>

  );
}

       
