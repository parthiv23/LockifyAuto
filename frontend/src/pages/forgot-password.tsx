import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Check, Eye, EyeOff, Moon, Sun, X } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { validatePassword } from "@/lib/password-validation";
import { apiRequest } from "@/lib/queryClient";
import { clearVault, unlockVaultWithRecovery, wrapCurrentDek } from "@/lib/vault";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    recoveryKey: "",
    newPassword: "",
    confirmPassword: "",
  });

  const passwordValidation = validatePassword(formData.newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValidation.isValid) {
      toast({
        title: "Invalid password",
        description: "Please ensure your new password meets all requirements",
        variant: "destructive",
      });
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Passwords do not match",
        variant: "destructive",
      });
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="sm"
          className="p-2"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </Button>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="141" height="166" viewBox="0 0 141 166" className="w-10 h-10 text-foreground" fill="currentColor">
              <path d="M70 46L70.5 83L101 101.5V148L69.5 166L0 125V41L31.5 23L70 46ZM8 120L69.5 156.263V120L38.5 102V64L8 46.5V120Z"/>
              <path d="M140.5 125L108.5 143.5V60.5L39 18.5L70 0L140.5 42V125Z"/>
            </svg>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Reset password</CardTitle>
            <CardDescription>
              Use the recovery key shown when you created your account. Email reset is not available.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                value={formData.username}
                onChange={(e) => setFormData((p) => ({ ...p, username: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recoveryKey">Recovery key</Label>
              <Input
                id="recoveryKey"
                className="font-mono"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                value={formData.recoveryKey}
                onChange={(e) => setFormData((p) => ({ ...p, recoveryKey: e.target.value }))}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData((p) => ({ ...p, newPassword: e.target.value }))}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {formData.newPassword && (
                <div className="text-xs space-y-1 mt-2">
                  <p className="font-medium text-muted-foreground">Password must contain:</p>
                  <div className="grid grid-cols-2 gap-1">
                    <div className="flex items-center space-x-1">
                      {passwordValidation.checks.length ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <X className="h-3 w-3 text-red-600" />
                      )}
                      <span className={passwordValidation.checks.length ? "text-green-600" : "text-red-600"}>
                        8+ characters
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {passwordValidation.checks.uppercase ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <X className="h-3 w-3 text-red-600" />
                      )}
                      <span className={passwordValidation.checks.uppercase ? "text-green-600" : "text-red-600"}>
                        Uppercase letter
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {passwordValidation.checks.lowercase ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <X className="h-3 w-3 text-red-600" />
                      )}
                      <span className={passwordValidation.checks.lowercase ? "text-green-600" : "text-red-600"}>
                        Lowercase letter
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {passwordValidation.checks.number && passwordValidation.checks.special ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <X className="h-3 w-3 text-red-600" />
                      )}
                      <span className={(passwordValidation.checks.number && passwordValidation.checks.special) ? "text-green-600" : "text-red-600"}>
                        Number & symbol
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData((p) => ({ ...p, confirmPassword: e.target.value }))}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !passwordValidation.isValid}>
              {isLoading ? "Resetting..." : "Reset password"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
