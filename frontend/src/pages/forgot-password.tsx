import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { validatePassword } from "@/lib/password-validation";
import { apiRequest } from "@/lib/queryClient";
import { clearVault, unlockVaultWithRecovery, wrapCurrentDek } from "@/lib/vault";
import { AuthStatus, LumoraAuthLayout, PasswordRules } from "@/components/lumora-auth-layout";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    recoveryKey: "",
    newPassword: "",
    confirmPassword: "",
  });

  const passwordValidation = validatePassword(formData.newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!passwordValidation.isValid) {
      setMessage("Please ensure your new password meets all requirements");
      toast({
        title: "Invalid password",
        description: "Please ensure your new password meets all requirements",
        variant: "destructive",
      });
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage("Passwords do not match.");
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const username = formData.username.trim();
    const recoveryKey = formData.recoveryKey.trim();
    try {
      clearVault();
      const bundleRes = await apiRequest("POST", "/api/auth/recovery-bundle", {
        username,
        recoveryKey,
      });
      const bundle = (await bundleRes.json()) as {
        userId: string;
        recoveryWrappedDek: string;
        recoveryWrapSalt: string;
      };
      await unlockVaultWithRecovery(bundle.userId, recoveryKey, {
        wrappedDek: bundle.recoveryWrappedDek,
        wrapSalt: bundle.recoveryWrapSalt,
      });
      const wrap = await wrapCurrentDek(formData.newPassword);
      await apiRequest("POST", "/api/auth/reset-password", {
        username,
        recoveryKey,
        newPassword: formData.newPassword,
        wrappedDek: wrap.wrappedDek,
        wrapSalt: wrap.wrapSalt,
      });
      clearVault();
      toast({ title: "Password reset", description: "Sign in with your new password." });
      setLocation("/login");
    } catch {
      clearVault();
      setMessage("Invalid username or recovery key, or the new password was rejected.");
      toast({
        title: "Reset failed",
        description: "Invalid username or recovery key, or the new password was rejected.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LumoraAuthLayout mode="recover" title="Recover your vault">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-xs font-semibold">
          Username
          <input
            id="username"
            autoComplete="username"
            value={formData.username}
            onChange={(e) => setFormData((p) => ({ ...p, username: e.target.value }))}
            required
            className="lumora-focus-ring mt-2 h-12 w-full rounded-xl border border-current/15 bg-transparent px-4 text-sm outline-none"
          />
        </label>
        <label className="block text-xs font-semibold">
          Recovery key
          <input
            id="recoveryKey"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            value={formData.recoveryKey}
            onChange={(e) => setFormData((p) => ({ ...p, recoveryKey: e.target.value }))}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            required
            className="lumora-focus-ring mt-2 h-12 w-full rounded-xl border border-current/15 bg-transparent px-4 font-mono text-sm outline-none"
            data-testid="input-recovery-key"
          />
        </label>
        <label className="block text-xs font-semibold">
          New password
          <div className="relative mt-2">
            <input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={formData.newPassword}
              onChange={(e) => setFormData((p) => ({ ...p, newPassword: e.target.value }))}
              required
              className="lumora-focus-ring h-12 w-full rounded-xl border border-current/15 bg-transparent px-4 pr-11 text-sm outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="lumora-focus-ring absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {formData.newPassword && <PasswordRules validation={passwordValidation} />}
        </label>
        <label className="block text-xs font-semibold">
          Confirm new password
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData((p) => ({ ...p, confirmPassword: e.target.value }))}
            required
            className="lumora-focus-ring mt-2 h-12 w-full rounded-xl border border-current/15 bg-transparent px-4 text-sm outline-none"
            data-testid="input-confirm-passphrase"
          />
        </label>
        <button
          disabled={isLoading || !passwordValidation.isValid}
          type="submit"
          className="lumora-magnetic-cta flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#084734] text-sm font-semibold text-[#cef17b] disabled:opacity-50"
        >
          {isLoading ? "Working locally…" : "Reset with recovery key"}
          <ArrowRight size={15} />
        </button>
      </form>
      {message && <AuthStatus>{message}</AuthStatus>}
    </LumoraAuthLayout>
  );
}
