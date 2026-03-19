import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../pages/firebase";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function SignInWithGoogle() {
  const { toast } = useToast();
  const { t } = useTranslation();

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

      toast({
        title: t("google.successTitle"),
        description: user.email ?? t("google.successDesc"),
      });

      window.location.href = "/";
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
      <p className="text-sm text-muted-foreground mb-3">
        {t("google.or")}
      </p>

      <div
        className="flex justify-center cursor-pointer"
        onClick={googleLogin}
      >
        <img
          src="/google.png"
          alt="Google Sign In"
          className="w-44 hover:scale-105 transition"
        />
      </div>
    </div>
  );
}