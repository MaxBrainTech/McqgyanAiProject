// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { useToast } from "@/hooks/use-toast";
// import { apiRequest } from "@/lib/queryClient";
// import { GraduationCap } from "lucide-react";

// // async function handleRegister(data: RegisterForm) {
// //   console.log("REGISTER FORM DATA 👉", data);
// // }

// const loginSchema = z.object({
//   username: z.string().min(3, "Username must be at least 3 characters"),
//   password: z.string().min(6, "Password must be at least 6 characters"),
// });

// const registerSchema = z.object({
//   username: z.string().min(3, "Username must be at least 3 characters"),
//   password: z.string().min(6, "Password must be at least 6 characters"),
//   fullName: z.string().min(2, "Full name is required"),
//   email: z.string().email("Invalid email address"),
//   school: z.string().optional(),
// });

// type LoginForm = z.infer<typeof loginSchema>;
// type RegisterForm = z.infer<typeof registerSchema>;

// export default function TeacherAuth() {
//   const navigate = useNavigate();
//   const [isLogin, setIsLogin] = useState(true);
//   const { toast } = useToast();

//   const loginForm = useForm<LoginForm>({
//     resolver: zodResolver(loginSchema),
//     defaultValues: {
//       username: "",
//       password: "",
//     },
//   });

//   const registerForm = useForm<RegisterForm>({
//     resolver: zodResolver(registerSchema),
//     defaultValues: {
//       username: "",
//       password: "",
//       fullName: "",
//       email: "",
//       school: "",
//     },
//   });

//   async function handleLogin(data: LoginForm) {
//     try {
//       const res = await apiRequest("POST", "/api/teacher/login", data);
//       const response = await res.json();

//       toast({
//         title: "Success!",
//         description: "Welcome back, teacher!",
//       });

//       navigate('/teacher-dashboard', { state: { teacherData: response } });
//     } catch (error: any) {
//       toast({
//         variant: "destructive",
//         title: "Login failed",
//         description: error.message || "Invalid credentials",
//       });
//     }
//   }

//   async function handleRegister(data: RegisterForm) {
//     try {
//       const res = await apiRequest("POST", "/api/teacher/register", data);
//       const response = await res.json();

//       toast({
//         title: "Success!",
//         description: "Account created successfully!",
//       });

//       navigate('/teacher-dashboard', { state: { teacherData: response } });
//     } catch (error: any) {
//       toast({
//         variant: "destructive",
//         title: "Registration failed",
//         description: error.message || "Could not create account",
//       });
//     }
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
//       <Card className="w-full max-w-md">
//         <CardHeader className="text-center">
//           <div className="flex justify-center mb-4">
//             <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
//               <GraduationCap className="h-8 w-8 text-white" />
//             </div>
//           </div>
//           <CardTitle className="text-2xl">Teacher Portal</CardTitle>
//           <CardDescription>
//             {isLogin ? "Login to create custom MCQ tests" : "Register as a teacher"}
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           {isLogin ? (
//             <Form {...loginForm}>
//               <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
//                 <FormField
//                   control={loginForm.control}
//                   name="username"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Username</FormLabel>
//                       <FormControl>
//                         <Input 
//                           placeholder="Enter username" 
//                           {...field}
//                           data-testid="input-username"
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={loginForm.control}
//                   name="password"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Password</FormLabel>
//                       <FormControl>
//                         <Input 
//                           type="password" 
//                           placeholder="Enter password" 
//                           {...field}
//                           data-testid="input-password"
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <Button 
//                   type="submit" 
//                   className="w-full"
//                   disabled={loginForm.formState.isSubmitting}
//                   data-testid="button-login"
//                 >
//                   {loginForm.formState.isSubmitting ? "Logging in..." : "Login"}
//                 </Button>
//               </form>
//             </Form>
//           ) : (
//             <Form {...registerForm}>
//               <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
//                 <FormField
//                   control={registerForm.control}
//                   name="fullName"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Full Name</FormLabel>
//                       <FormControl>
//                         {/* <Input 
//                           placeholder="Enter username" 
//                           {...field}
//                           data-testid="input-username"
//                         /> */}
//                         <Input 
//                           placeholder="John Doe" 
//                           value={field.value}
//                           onChange={field.onChange}
//                           onBlur={field.onBlur}
//                           name={field.name}
//                           data-testid="input-fullname"
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={registerForm.control}
//                   name="email"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Email</FormLabel>
//                       <FormControl>
//                         {/* <Input 
//                            type="password" 
//                            placeholder="Enter password" 
//                            {...field}
//                            data-testid="input-password"
//                         /> */}
//                         <Input 
//                           type="email" 
//                           placeholder="teacher@school.com" 
//                           value={field.value}
//                           onChange={field.onChange}
//                           onBlur={field.onBlur}
//                           name={field.name}
//                           data-testid="input-email"
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={registerForm.control}
//                   name="username"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Username</FormLabel>
//                       <FormControl>
//                         <Input 
//                           placeholder="Choose username" 
//                           value={field.value}
//                           onChange={field.onChange}
//                           onBlur={field.onBlur}
//                           name={field.name}
//                           data-testid="input-username-register"
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={registerForm.control}
//                   name="password"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Password</FormLabel>
//                       <FormControl>
//                         <Input 
//                           type="password" 
//                           placeholder="Minimum 6 characters" 
//                           value={field.value}
//                           onChange={field.onChange}
//                           onBlur={field.onBlur}
//                           name={field.name}
//                           data-testid="input-password-register"
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={registerForm.control}
//                   name="school"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>School (Optional)</FormLabel>
//                       <FormControl>
//                         <Input 
//                           placeholder="Your school name" 
//                           value={field.value || ""}
//                           onChange={field.onChange}
//                           onBlur={field.onBlur}
//                           name={field.name}
//                           data-testid="input-school"
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <Button 
//                   type="submit" 
//                   className="w-full"
//                   disabled={registerForm.formState.isSubmitting}
//                   data-testid="button-register"
//                 >
//                   {registerForm.formState.isSubmitting ? "Creating account..." : "Register"}
//                 </Button>
//               </form>
//             </Form>
//           )}

//           <div className="mt-4 text-center">
//             <Button
//               variant="ghost"
//               onClick={() => setIsLogin(!isLogin)}
//               data-testid="button-toggle-mode"
//             >
//               {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }


// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { Eye, EyeOff, GraduationCap } from "lucide-react";

// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { useToast } from "@/hooks/use-toast";
// import { apiRequest } from "@/lib/queryClient";


// // ================== SCHEMAS ==================

// const loginSchema = z.object({
//   username: z.string().min(3, "Username must be at least 3 characters"),
//   password: z.string().min(6, "Password must be at least 6 characters"),
// });

// const registerSchema = z.object({
//   username: z.string().min(3, "Username must be at least 3 characters"),
//   password: z.string().min(6, "Password must be at least 6 characters"),
//   fullName: z.string().min(2, "Full name is required"),
//   email: z.string().email("Invalid email address"),
//   school: z.string().optional(),
// });

// type LoginForm = z.infer<typeof loginSchema>;
// type RegisterForm = z.infer<typeof registerSchema>;


// // ================== COMPONENT ==================

// export default function TeacherAuth() {
//   const navigate = useNavigate();
//   const [isLogin, setIsLogin] = useState(true);
//   const { toast } = useToast();

//   const [showRegisterPassword, setShowRegisterPassword] = useState(false);
//   const [showLoginPassword, setShowLoginPassword] = useState(false);

//   const loginForm = useForm<LoginForm>({
//     resolver: zodResolver(loginSchema),
//     defaultValues: {
//       username: "",
//       password: "",
//     },
//   });

//   const registerForm = useForm<RegisterForm>({
//     resolver: zodResolver(registerSchema),
//     defaultValues: {
//       username: "",
//       password: "",
//       fullName: "",
//       email: "",
//       school: "",
//     },
//   });

//   // ================== HANDLERS ==================

//   async function handleLogin(data: LoginForm) {
//     try {
//       const res = await apiRequest("POST", "/api/teacher/login", data);
//       const response = await res.json();

//       toast({
//         title: "Success!",
//         description: "Welcome back, teacher!",
//       });

//       navigate("/teacher-dashboard", { state: { teacherData: response } });
//     } catch (error: any) {
//       toast({
//         variant: "destructive",
//         title: "Login failed",
//         description: error.message || "Invalid credentials",
//       });
//     }
//   }

//   async function handleRegister(data: RegisterForm) {
//     try {
//       const res = await apiRequest("POST", "/api/teacher/register", data);
//       const response = await res.json();

//       toast({
//         title: "Success!",
//         description: "Account created successfully!",
//       });

//       navigate("/teacher-dashboard", { state: { teacherData: response } });
//     } catch (error: any) {
//       toast({
//         variant: "destructive",
//         title: "Registration failed",
//         description: error.message || "Could not create account",
//       });
//     }
//   }

//   // ================== UI ==================

//   return (
//     <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
//       <Card className="w-full max-w-md">
//         <CardHeader className="text-center">
//           <div className="flex justify-center mb-4">
//             <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
//               <GraduationCap className="h-8 w-8 text-white" />
//             </div>
//           </div>
//           <CardTitle className="text-2xl">Teacher Portal</CardTitle>
//           <CardDescription>
//             {isLogin ? "Login to create custom MCQ tests" : "Register as a teacher"}
//           </CardDescription>
//         </CardHeader>

//         <CardContent>
//           {/* LOGIN FORM */}
//           <div className={isLogin ? "block" : "hidden"}>
//             <Form {...loginForm}>
//               <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">

//                 <FormField
//                   control={loginForm.control}
//                   name="username"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Username</FormLabel>
//                       <FormControl>
//                         <Input placeholder="Enter username" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={loginForm.control}
//                   name="password"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Password</FormLabel>
//                       <FormControl>
//                         <div className="relative">
//                           <Input
//                             type={showLoginPassword ? "text" : "password"}
//                             placeholder="Enter password"
//                             {...field}
//                           />

//                           <button
//                             type="button"
//                             onClick={() => setShowLoginPassword(!showLoginPassword)}
//                             className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
//                           >
//                             {showLoginPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
//                           </button>
//                         </div>
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <Button type="submit" className="w-full">
//                   Login
//                 </Button>

//               </form>
//             </Form>
//           </div>

//           {/* REGISTER FORM */}
//           <div className={!isLogin ? "block" : "hidden"}>
//             <Form {...registerForm}>
//               <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">

//                 <FormField
//                   control={registerForm.control}
//                   name="fullName"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Full Name</FormLabel>
//                       <FormControl>
//                         <Input placeholder="John Doe" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={registerForm.control}
//                   name="email"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Email</FormLabel>
//                       <FormControl>
//                         <Input type="email" placeholder="teacher@school.com" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={registerForm.control}
//                   name="username"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Username</FormLabel>
//                       <FormControl>
//                         <Input placeholder="Choose username" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={registerForm.control}
//                   name="password"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Password</FormLabel>
//                       <FormControl>
//                         <div className="relative">
//                           <Input
//                             type={showRegisterPassword ? "text" : "password"}
//                             placeholder="Minimum 6 characters"
//                             {...field}
//                           />

//                           <button
//                             type="button"
//                             onClick={() => setShowRegisterPassword(!showRegisterPassword)}
//                             className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
//                           >
//                             {showLoginPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
//                           </button>
//                         </div>
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={registerForm.control}
//                   name="school"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>School (Optional)</FormLabel>
//                       <FormControl>
//                         <Input placeholder="Your school name" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <Button type="submit" className="w-full">
//                   Register
//                 </Button>

//               </form>
//             </Form>
//           </div>

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, GraduationCap } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
  username: z.string().min(3, { message: "teacherAuth.usernameMin" }),
  password: z.string().min(6, { message: "teacherAuth.passwordMin" }),
});

const registerSchema = z.object({
  username: z.string().min(3, { message: "teacherAuth.usernameMin" }),
  password: z.string().min(6, { message: "teacherAuth.passwordMin" }),
  fullName: z.string().min(2, { message: "teacherAuth.fullNameMin" }),
  email: z.string().email({ message: "teacherAuth.invalidEmail" }),
  school: z.string().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function TeacherAuth() {

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLogin, setIsLogin] = useState(true);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

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

  async function handleLogin(data: LoginForm) {
    try {

      const res = await apiRequest("POST", "/api/teacher/login", data);
      const response = await res.json();

      toast({
        title: t("teacherAuth.success"),
        description: t("teacherAuth.loginSuccess"),
      });

      navigate("/teacher-dashboard", { state: { teacherData: response } });

    } catch (error: any) {

      toast({
        variant: "destructive",
        title: t("teacherAuth.loginFailed"),
        description: error.message || t("teacherAuth.invalidCredentials"),
      });

    }
  }

  async function handleRegister(data: RegisterForm) {
    try {

      const res = await apiRequest("POST", "/api/teacher/register", data);
      const response = await res.json();

      toast({
        title: t("teacherAuth.success"),
        description: t("teacherAuth.registerSuccess"),
      });

      navigate("/teacher-dashboard", { state: { teacherData: response } });

    } catch (error: any) {

      toast({
        variant: "destructive",
        title: t("teacherAuth.registerFailed"),
        description: error.message || t("teacherAuth.couldNotCreate"),
      });

    }
  }

  return (

    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">

      <Card className="w-full max-w-md">

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

                <Button type="submit" className="w-full">
                  {t("teacherAuth.login")}
                </Button>

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

  );
}

          {/* {isLogin ? (
            // ================= LOGIN =================
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">

                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginForm.formState.isSubmitting}
                >
                  {loginForm.formState.isSubmitting ? "Logging in..." : "Login"}
                </Button>

              </form>
            </Form>
          ) : (
            // ================= REGISTER =================
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">

                <FormField
                  control={registerForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        {/* <input
                          className="border p-2 w-full"
                          placeholder="Test typing"
                        /> */}
                        {/* <Input
                        placeholder="John Doe"
                        {...field}
                        onChange={(e) => {
                          console.log("Typing:", e.target.value);
                          field.onChange(e);
                        }}
                      />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="teacher@school.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}

                {/* <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Choose username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}

                {/* <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Minimum 6 characters" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="school"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Your school name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}

                {/* <Button
                  type="submit"
                  className="w-full"
                  disabled={registerForm.formState.isSubmitting}
                >
                  {registerForm.formState.isSubmitting ? "Creating account..." : "Register"}
                </Button>

              </form>
            </Form>
          // )} */} 

//           <div className="mt-4 text-center">
//             <Button
//               variant="ghost"
//               onClick={() => {
//                 console.log("Toggle clicked");
//                 setIsLogin(!isLogin);
//               }}
//             >
//               {isLogin
//                 ? "Don't have an account? Register"
//                 : "Already have an account? Login"}
//             </Button>
//           </div>

//         </CardContent>
//       </Card>
//     </div>
//   );
// }
