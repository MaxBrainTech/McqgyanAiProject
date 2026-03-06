



import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../pages/firebase";
import { useToast } from "@/hooks/use-toast";

export default function SignInWithGoogle() {
  const { toast } = useToast();

  const googleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();

      // ✅ FORCE email selection
      provider.addScope("profile");
      provider.addScope("email");
      provider.setCustomParameters({
        prompt: "select_account",
      });

      const result = await signInWithPopup(auth, provider);

      const user = result.user;

      console.log("EMAIL:", user.email);
      console.log("NAME:", user.displayName);

      toast({
        title: "Login Successful",
        description: user.email ?? "Signed in with Google",
      });

      window.location.href = "/";
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Google Sign-In Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mt-4 text-center">
      <p className="text-sm text-muted-foreground mb-3">
        — Or continue with —
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
