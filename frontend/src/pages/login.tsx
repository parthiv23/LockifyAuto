import { useState, useEffect } from "react";
import { ArrowRight, Eye, EyeOff, Fingerprint } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import BiometricAuth from "@/components/biometric-auth";
import { RecoveryKeyDialog } from "@/components/recovery-key-dialog";
import { getBiometricToken } from "@/lib/biometric";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { AuthStatus, LumoraAuthLayout } from "@/components/lumora-auth-layout";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const { toast } = useToast();
  const { login, generateTokenAfterLogin } = useAuth();
  const { biometricEnabled } = useUserPreferences();

  useEffect(() => {
    if (formData.username.trim()) {
      const timer = setTimeout(() => setShowBiometric(true), 300);
      return () => clearTimeout(timer);
    }
    setShowBiometric(false);
  }, [formData.username]);

  const finishLogin = async (session: Awaited<ReturnType<typeof login>>) => {
    toast({ title: "Login successful", description: "Welcome back to Lumora!" });
    await generateTokenAfterLogin(session.user);
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

  const handleBiometricSuccess = async () => {
    try {
      const session = await login({ username: formData.username.trim(), password: formData.password });
      await finishLogin(session);
    } catch {
      setMessage("Biometric authentication succeeded but login failed");
      toast({
        title: "Login failed",
        description: "Biometric authentication succeeded but login failed",
        variant: "destructive",
      });
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

        {showBiometric && formData.username.trim() && biometricEnabled ? (
          <div className="mt-4 space-y-3">
            <BiometricAuth
              userId={formData.username.trim()}
              username={formData.username.trim()}
              onSuccess={handleBiometricSuccess}
              disabled={isLoading}
              showRegisterOption={true}
            />
            {getBiometricToken() && (
              <p className="text-center text-[0.68rem] text-muted-foreground">
                Quick login token available for this device
              </p>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() =>
              setMessage("Enter your username first, then use fingerprint on a supported device.")
            }
            className="lumora-focus-ring mt-4 flex h-auto min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-current/15 px-3 py-2.5 text-center text-xs font-semibold leading-snug transition hover:bg-current/5"
            data-testid="button-fingerprint-login"
          >
            <Fingerprint size={17} className="text-[#4b8b69]" />
            Try fingerprint / device biometrics
          </button>
        )}

        {message && <AuthStatus>{message}</AuthStatus>}
      </LumoraAuthLayout>
      {recoveryKey && (
        <RecoveryKeyDialog recoveryKey={recoveryKey} onDone={() => window.location.replace("/")} />
      )}
    </>
  );
}
