import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Fingerprint, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { RecoveryKeyDialog } from "@/components/recovery-key-dialog";
import { checkBiometricSupport, findBiometricCredential, getBiometricToken, registerBiometric } from "@/lib/biometric";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { AuthStatus, LumoraAuthLayout } from "@/components/lumora-auth-layout";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const { toast } = useToast();
  const { login, generateTokenAfterLogin, biometricLogin } = useAuth();
  const { biometricEnabled } = useUserPreferences();

  const finishLogin = async (session: Awaited<ReturnType<typeof login>>) => {
    toast({ title: "Login successful", description: "Welcome back to Lumora!" });
    await generateTokenAfterLogin(session.user, session.token);
    if (session.recoveryKey) {
      setRecoveryKey(session.recoveryKey);
      return;
    }
    window.location.replace("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      const session = await login({ username: formData.username.trim(), password: formData.password });
      await finishLogin(session);
    } catch {
      setMessage("Invalid username or password");
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFingerprint = async () => {
    if (!biometricEnabled) {
      setMessage("Fingerprint sign-in is turned off. Enable it in Profile after you sign in.");
      return;
    }

    const storedToken = getBiometricToken();
    const username = formData.username.trim() || storedToken?.username || "";
    if (!username) {
      setMessage("Enter your username, then try fingerprint again.");
      document.getElementById("username")?.focus();
      return;
    }

    setMessage("");
    setIsBiometricLoading(true);
    try {
      const support = await checkBiometricSupport();
      if (!support.isSupported || !support.hasPlatformAuthenticator) {
        setMessage("Fingerprint sign-in isn’t available in this browser. Use your password, or open Lumora on a device with fingerprint or face unlock.");
        return;
      }

      const credential = findBiometricCredential(username);
      if (!credential) {
        if (!formData.password) {
          setMessage("Enter your password once on this device to turn on fingerprint.");
          document.getElementById("password")?.focus();
          return;
        }
        const session = await login({ username, password: formData.password });
        const registered = await registerBiometric(session.user.id, session.user.username);
        if (!registered.success) {
          toast({
            title: "Fingerprint wasn’t set up",
            description: registered.error || "You can turn it on later from Profile.",
            variant: "destructive",
          });
        }
        await finishLogin(session);
        return;
      }

      const result = await biometricLogin(credential.userId, credential.username);
      if (!result.success) {
        setMessage(result.error || "Fingerprint sign-in failed. Sign in with your password once, then try again.");
        return;
      }
      window.location.replace("/");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Fingerprint sign-in failed.");
    } finally {
      setIsBiometricLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <>
      <LumoraAuthLayout mode="unlock" title="Unlock your vault">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-xs font-semibold">
            Username
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="Your username"
              value={formData.username}
              onChange={handleChange}
              required
              className="lumora-focus-ring mt-2 h-12 w-full rounded-xl border border-current/15 bg-transparent px-4 text-sm outline-none"
              data-testid="input-username"
            />
          </label>
          <label className="block text-xs font-semibold">
            Password
            <div className="relative mt-2">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Your account password"
                value={formData.password}
                onChange={handleChange}
                required
                className="lumora-focus-ring h-12 w-full rounded-xl border border-current/15 bg-transparent px-4 pr-11 text-sm outline-none"
                data-testid="input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="lumora-focus-ring absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
                data-testid="button-toggle-password"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>
          <button
            disabled={isLoading}
            type="submit"
            className="lumora-magnetic-cta flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#084734] px-3 text-sm font-semibold text-[#cef17b] disabled:opacity-50"
            data-testid="button-login"
          >
            {isLoading ? "Unlocking…" : "Unlock Lumora"}
            <ArrowRight size={15} />
          </button>
        </form>

        <button
          type="button"
          onClick={() => void handleFingerprint()}
          disabled={isLoading || isBiometricLoading}
          className="lumora-focus-ring mt-4 flex h-auto min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-current/15 px-3 py-2.5 text-center text-xs font-semibold leading-snug transition hover:bg-current/5 disabled:opacity-50"
          data-testid="button-fingerprint-login"
        >
          {isBiometricLoading ? <Loader2 size={17} className="animate-spin text-[#4b8b69]" /> : <Fingerprint size={17} className="text-[#4b8b69]" />}
          {isBiometricLoading ? "Waiting for fingerprint…" : "Try fingerprint / device biometrics"}
        </button>

        {message && <AuthStatus>{message}</AuthStatus>}
      </LumoraAuthLayout>
      {recoveryKey && (
        <RecoveryKeyDialog recoveryKey={recoveryKey} onDone={() => window.location.replace("/")} />
      )}
    </>
  );
}
