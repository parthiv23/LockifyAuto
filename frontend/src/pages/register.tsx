import { useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { validatePassword } from "@/lib/password-validation";
import { RecoveryKeyDialog } from "@/components/recovery-key-dialog";
import { AuthStatus, LumoraAuthLayout, PasswordRules } from "@/components/lumora-auth-layout";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const { register, isRegisterLoading } = useAuth();
  const { toast } = useToast();
  const passwordValidation = validatePassword(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!passwordValidation.isValid) {
      setMessage("Please ensure your password meets all requirements");
      toast({
        title: "Invalid password",
        description: "Please ensure your password meets all requirements",
        variant: "destructive",
      });
      return;
    }
    try {
      const session = await register({ username: formData.username.trim(), password: formData.password });
      toast({ title: "Account created", description: "Save your recovery key before continuing." });
      if (session.recoveryKey) {
        setRecoveryKey(session.recoveryKey);
        return;
      }
      window.location.replace("/");
    } catch (error: any) {
      setMessage(error.message || "Username already exists or invalid data");
      toast({
        title: "Registration failed",
        description: error.message || "Username already exists or invalid data",
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
      <LumoraAuthLayout mode="create" title="Create a local vault">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-xs font-semibold">
            Username
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="Choose a username"
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
                autoComplete="new-password"
                placeholder="Make it memorable, not common"
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
            {formData.password && <PasswordRules validation={passwordValidation} />}
          </label>
          <button
            disabled={isRegisterLoading || !passwordValidation.isValid}
            type="submit"
            className="lumora-magnetic-cta flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#084734] text-sm font-semibold text-[#cef17b] disabled:opacity-50"
            data-testid="button-register"
          >
            {isRegisterLoading ? "Working locally…" : "Create encrypted vault"}
            <ArrowRight size={15} />
          </button>
        </form>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          A recovery key will be generated after setup. Save it somewhere offline; it is the only reset path.
        </p>
        {message && <AuthStatus>{message}</AuthStatus>}
      </LumoraAuthLayout>
      {recoveryKey && (
        <RecoveryKeyDialog recoveryKey={recoveryKey} onDone={() => window.location.replace("/")} />
      )}
    </>
  );
}
