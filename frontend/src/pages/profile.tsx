import { useMemo, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { PasswordRecord } from "@shared/schema";
import {
  Loader2,
  CircleCheck,
  CircleX,
  ArrowLeft,
  LogOut,
  Trash2,
  Pencil,
  UserX,
  Play,
  Key,
  Info,
  Vibrate,
  Fingerprint,
  History,
  Shield,
  User,
  Archive,
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AvatarPickerDialog from "@/components/avatar-picker-dialog";
import { OnboardingGuide } from "@/components/onboarding-guide";
import { FloatingAppNav } from "@/components/floating-app-nav";
import { VibrationPreference, Vibration } from "@/lib/vibration";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { useBiometric } from "@/hooks/use-biometric";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolveAvatarUrl } from "@/lib/avatars";
import { validatePassword } from "@/lib/password-validation";
import { generateRecoveryKey, wrapCurrentDek } from "@/lib/vault";
import { RecoveryKeyDialog } from "@/components/recovery-key-dialog";
import { VaultBackupActions } from "@/components/vault-backup-dialogs";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user, logout, updateProfileImage, updateOnboardingStatus, changePassword, rotateRecoveryKey } = useAuth();
  const { data: records = [] } = useQuery<PasswordRecord[]>({ queryKey: ["/api/records"] });
  const { toast } = useToast();
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [vibrationEnabled, setVibrationEnabled] = useState(() => VibrationPreference.isEnabled());
  const [deleteAllPassword, setDeleteAllPassword] = useState("");
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [recoveryCurrentPassword, setRecoveryCurrentPassword] = useState("");
  const [newRecoveryKey, setNewRecoveryKey] = useState<string | null>(null);
  const [isRotatingRecovery, setIsRotatingRecovery] = useState(false);

  const { biometricEnabled, setBiometricEnabled } = useUserPreferences();
  const {
    isSupported: biometricSupported,
    hasCredential,
    remove: removeBiometricCredential,
    authenticate,
    register,
    isAuthenticating,
    isRegistering
  } = useBiometric();
  const { hasBiometricToken, removeBiometricAuth } = useAuth();

  const stats = useMemo(() => ({
    total: (records as any[]).filter((r) => !r.isDeleted).length,
  }), [records]);

  const handleSetupBiometric = async () => {
    if (!user) return;

    try {
      const result = await register(user.id, user.username);
      if (result.success) {
        toast({
          title: "Biometric authentication set up",
          description: "You can now use your fingerprint to log in"
        });
      } else {
        toast({
          title: "Setup failed",
          description: result.error || "Failed to set up biometric authentication",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Setup failed",
        description: "An error occurred while setting up biometric authentication",
        variant: "destructive"
      });
    }
  };

  const handleTestBiometric = async () => {
    if (!user) return;

    try {
      const result = await authenticate(user.id, user.username);
      if (result.success) {
        toast({
          title: "Biometric test successful",
          description: "Your fingerprint authentication is working correctly"
        });
      } else {
        toast({
          title: "Test failed",
          description: result.error || "Biometric authentication failed",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Test failed",
        description: "An error occurred during biometric authentication",
        variant: "destructive"
      });
    }
  };

  const handleRemoveBiometric = () => {
    removeBiometricCredential();
    removeBiometricAuth();
    toast({
      title: "Biometric authentication removed",
      description: "All biometric data has been cleared from this device"
    });
  };

  const verifyPassword = async (password: string): Promise<boolean> => {
    if (!password) {
      toast({
        title: "Password required",
        description: "Please enter your account password to continue.",
        variant: "destructive",
      });
      return false;
    }
    try {
      setIsVerifyingPassword(true);
      const res = await apiRequest("POST", "/api/auth/verify-password", { password });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast({
          title: "Incorrect password",
          description: body?.message || "The password you entered is not correct.",
          variant: "destructive",
        });
        return false;
      }
      return true;
    } catch (e: any) {
      toast({
        title: "Failed to verify password",
        description: e?.message || "",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const avatarUrl = useMemo(
    () => resolveAvatarUrl(user?.profileimage, user?.id || user?.username || "1"),
    [user?.id, user?.username, user?.profileimage],
  );

  const [loading, setLoading] = useState(true);

  if (!user) {
    setLocation("/login");
    return null;
  }

  const biometricReady = hasCredential(user.id);

  return (
    <div className="min-h-screen bg-background">
      <FloatingAppNav />

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-4 sm:px-6 sm:pb-32 sm:pt-8 md:px-8 md:pb-12 md:pt-24">
        <div className="mb-5 flex items-center gap-3 sm:mb-6">
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-foreground"
            onClick={() => setLocation("/")}
            aria-label="Back to vault"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="font-serif text-3xl leading-none text-foreground sm:text-4xl">Profile</h1>
            <p className="mt-1 text-sm text-muted-foreground">Account, security, and preferences</p>
          </div>
        </div>

        <div className="mx-auto grid max-w-5xl items-start gap-4 md:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)] md:gap-6">
          <section className="overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col items-center border-b border-border/60 px-4 pb-5 pt-6 text-center sm:px-5">
              <div className="relative h-[180px] w-[180px] shrink-0 md:h-24 md:w-24">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-muted">
                  {loading && <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />}
                </div>
                <img
                  key={avatarUrl}
                  className={`absolute inset-0 h-full w-full rounded-full border-4 border-card object-cover shadow-md ${loading ? "opacity-0" : "opacity-100"}`}
                  src={avatarUrl}
                  alt="User Avatar"
                  ref={(img) => {
                    if (img?.complete) setLoading(false);
                  }}
                  onLoad={() => setLoading(false)}
                  onError={() => setLoading(false)}
                />
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-0.5 -right-0.5 h-8 w-8 rounded-full"
                  onClick={() => setIsAvatarOpen(true)}
                  data-testid="button-edit-avatar"
                  aria-label="Change avatar"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <h2 className="mt-4 max-w-full truncate text-xl font-semibold">{user.username}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{stats.total} saved records</p>
            </div>

            <div className="space-y-4 px-4 py-5 sm:px-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Profile details</p>
              <dl className="space-y-3">
                <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/50">
                  <dt className="text-xs text-muted-foreground">Username</dt>
                  <dd className="truncate text-sm font-medium">{user.username}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/50">
                  <dt className="shrink-0 text-xs text-muted-foreground">Onboarding</dt>
                  <dd>
                    {user.hasCompletedOnboarding ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 dark:text-green-400">
                        <CircleCheck className="h-4 w-4 shrink-0" />
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 dark:text-red-400">
                        <CircleX className="h-4 w-4 shrink-0" />
                        Not completed
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
              <div className="grid grid-cols-3 gap-2.5 pt-1 sm:gap-3">
                <Link href="/history">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-auto w-full flex-col gap-1.5 px-2 py-3 text-xs sm:text-sm"
                    data-testid="button-profile-go-history"
                    title="View your activity history"
                  >
                    <History className="h-4 w-4" />
                    <span>History</span>
                  </Button>
                </Link>
                <Link href="/trash">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-auto w-full flex-col gap-1.5 px-2 py-3 text-xs sm:text-sm"
                    data-testid="button-profile-go-trash"
                    title="Open Trash"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Trash</span>
                  </Button>
                </Link>
                <Link href="/about">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-auto w-full flex-col gap-1.5 px-2 py-3 text-xs sm:text-sm"
                    data-testid="button-profile-go-about"
                    title="About Lumora"
                  >
                    <Info className="h-4 w-4" />
                    <span>About</span>
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          <Accordion type="multiple" className="space-y-3">
            <SettingsAccordionItem
              value="password"
              icon={<Key className="h-4 w-4" />}
              title="Change password"
              description="Update the password you use to sign in."
            >
                <form
                  className="space-y-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const nextCheck = validatePassword(pwForm.next);
                    if (!nextCheck.isValid) {
                      toast({ title: "New password is too weak", variant: "destructive" });
                      return;
                    }
                    if (pwForm.next !== pwForm.confirm) {
                      toast({ title: "New passwords do not match", variant: "destructive" });
                      return;
                    }
                    setIsChangingPassword(true);
                    try {
                      await changePassword({ currentPassword: pwForm.current, newPassword: pwForm.next });
                      setPwForm({ current: "", next: "", confirm: "" });
                      toast({ title: "Password updated", description: "Your vault still uses the same encryption key." });
                    } catch (err: any) {
                      toast({
                        title: "Could not change password",
                        description: err?.message || "Check your current password and try again.",
                        variant: "destructive",
                      });
                    } finally {
                      setIsChangingPassword(false);
                    }
                  }}
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="current-password" className="text-xs">Current password</Label>
                    <Input id="current-password" type="password" autoComplete="current-password" value={pwForm.current} onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))} required />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="new-password" className="text-xs">New password</Label>
                      <Input id="new-password" type="password" autoComplete="new-password" value={pwForm.next} onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirm-password" className="text-xs">Confirm new password</Label>
                      <Input id="confirm-password" type="password" autoComplete="new-password" value={pwForm.confirm} onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))} required />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isChangingPassword}>
                    {isChangingPassword ? "Updating..." : "Update password"}
                  </Button>
                </form>
            </SettingsAccordionItem>

            <SettingsAccordionItem
              value="recovery"
              icon={<Shield className="h-4 w-4" />}
              title="New recovery key"
              description="Creates a replacement key for forgot-password. The previous key will stop working."
            >
                <form
                  className="flex flex-col gap-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setIsRotatingRecovery(true);
                    try {
                      const recoveryKey = generateRecoveryKey();
                      const wrap = await wrapCurrentDek(recoveryKey);
                      await rotateRecoveryKey({
                        currentPassword: recoveryCurrentPassword,
                        recoveryKey,
                        recoveryWrappedDek: wrap.wrappedDek,
                        recoveryWrapSalt: wrap.wrapSalt,
                      });
                      setRecoveryCurrentPassword("");
                      setNewRecoveryKey(recoveryKey);
                    } catch (err: any) {
                      toast({
                        title: "Could not create a new recovery key",
                        description: err?.message || "Check your password and try again.",
                        variant: "destructive",
                      });
                    } finally {
                      setIsRotatingRecovery(false);
                    }
                  }}
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="recovery-current" className="text-xs">Account password</Label>
                    <Input id="recovery-current" type="password" autoComplete="current-password" value={recoveryCurrentPassword} onChange={(e) => setRecoveryCurrentPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" variant="outline" className="w-full" disabled={isRotatingRecovery || !recoveryCurrentPassword}>
                    {isRotatingRecovery ? "Creating..." : "Generate recovery key"}
                  </Button>
                </form>
            </SettingsAccordionItem>

            <SettingsAccordionItem
              value="preferences"
              icon={<Vibrate className="h-4 w-4" />}
              title="Preferences"
              description="How Lumora feels on this device."
            >
              <PreferenceRow
                icon={<Vibrate className="h-4 w-4 text-muted-foreground" />}
                title="Haptic feedback"
                description="Vibrate on actions"
              >
                <Switch
                  checked={vibrationEnabled}
                  onCheckedChange={(checked) => {
                    setVibrationEnabled(checked);
                    VibrationPreference.setEnabled(checked);
                    if (checked) {
                      Vibration.short();
                    }
                    toast({
                      title: checked ? "Vibration enabled" : "Vibration disabled",
                      description: checked ? "You'll feel haptic feedback on actions" : "Haptic feedback is now disabled",
                    });
                  }}
                  data-testid="switch-vibration"
                />
              </PreferenceRow>

              {biometricSupported && (
                <div className="space-y-3">
                  <PreferenceRow
                    icon={<Fingerprint className="h-4 w-4 text-muted-foreground" />}
                    title="Fingerprint login"
                    description={biometricReady ? "Use fingerprint to sign in" : "Set up fingerprint authentication"}
                  >
                    <Switch
                      checked={biometricEnabled}
                      onCheckedChange={(checked) => {
                        setBiometricEnabled(checked);
                        if (!checked && hasCredential(user.id)) {
                          handleRemoveBiometric();
                        } else {
                          toast({
                            title: checked ? "Biometric authentication enabled" : "Biometric authentication disabled",
                            description: checked
                              ? "You can now use fingerprint login on supported devices"
                              : "Fingerprint login is now disabled",
                          });
                        }
                      }}
                      data-testid="switch-biometric"
                    />
                  </PreferenceRow>

                  {biometricEnabled && (
                    <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3 sm:p-4">
                      {!biometricReady ? (
                        <Button
                          size="lg"
                          onClick={handleSetupBiometric}
                          disabled={isRegistering}
                          className="h-auto w-full whitespace-normal border-0 bg-gradient-to-r from-blue-600 to-purple-600 py-2.5 text-white shadow-md hover:from-blue-700 hover:to-purple-700 hover:shadow-lg"
                        >
                          {isRegistering ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Setting up...
                            </>
                          ) : (
                            <>
                              <Fingerprint className="h-4 w-4" />
                              Set up fingerprint authentication
                            </>
                          )}
                        </Button>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleTestBiometric}
                            disabled={isAuthenticating}
                            className="border-primary/30 hover:border-primary/50 hover:bg-primary/5"
                          >
                            {isAuthenticating ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Testing...
                              </>
                            ) : (
                              <>
                                <Key className="h-4 w-4" />
                                Test
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleRemoveBiometric}
                            className="border-destructive/30 text-destructive hover:border-destructive/50 hover:bg-destructive/5 hover:text-destructive"
                          >
                            <UserX className="h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                      )}

                      <div className="space-y-1 text-xs text-muted-foreground">
                        {biometricReady ? (
                          <div className="flex items-center gap-1.5">
                            <CircleCheck className="h-3.5 w-3.5 text-green-500" />
                            <span>Biometric authentication is set up</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <CircleX className="h-3.5 w-3.5 text-orange-500" />
                            <span>Set up biometric authentication to enable quick login</span>
                          </div>
                        )}
                        {hasBiometricToken() && (
                          <div className="flex items-center gap-1.5">
                            <CircleCheck className="h-3.5 w-3.5 text-blue-500" />
                            <span>Quick login token available</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  className="w-full md:hidden sm:flex-1"
                  data-testid="button-start-tour-profile"
                  onClick={() => {
                    sessionStorage.setItem("lockify-start-tour", "1");
                    setLocation("/");
                  }}
                >
                  <Play className="h-4 w-4" />
                  Start tour
                </Button>
                {!user.hasCompletedOnboarding && (
                  <Button
                    onClick={() => setIsOnboardingOpen(true)}
                    className="w-full sm:flex-1"
                    data-testid="button-complete-onboarding"
                  >
                    <Play className="h-4 w-4" />
                    Complete onboarding
                  </Button>
                )}
              </div>
            </SettingsAccordionItem>

            <SettingsAccordionItem
              value="backup"
              icon={<Archive className="h-4 w-4" />}
              title="Backup & restore"
              description="Export a JSON backup or import records from a previous Lumora file."
            >
              <VaultBackupActions
                username={user.username}
                records={records}
                verifyPassword={verifyPassword}
                isVerifyingPassword={isVerifyingPassword}
              />
            </SettingsAccordionItem>

            <SettingsAccordionItem
              value="account"
              icon={<User className="h-4 w-4" />}
              title="Account"
              description="These actions are permanent. You'll be asked for your password first."
            >
              <div className="grid gap-2 sm:grid-cols-2">
                <AlertDialog open={isDeleteAllOpen} onOpenChange={setIsDeleteAllOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full" data-testid="button-delete-all">
                      <Trash2 className="h-4 w-4" />
                      Delete all records
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete all records?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all your password records.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2 py-2">
                      <div className="text-sm text-muted-foreground">
                        For your security, please enter your account password to confirm.
                      </div>
                      <Input
                        type="password"
                        placeholder="Account password"
                        value={deleteAllPassword}
                        onChange={(e) => setDeleteAllPassword(e.target.value)}
                        data-testid="input-delete-all-password"
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        disabled={isDeletingAll || isVerifyingPassword}
                        onClick={async () => {
                          if (isDeletingAll || isVerifyingPassword) return;
                          const ok = await verifyPassword(deleteAllPassword);
                          if (!ok) return;
                          setIsDeletingAll(true);
                          try {
                            const res = await apiRequest("GET", "/api/records");
                            const list = (await res.json()) as Array<{ id: string }>;
                            let success = 0;
                            let failed = 0;
                            for (const r of list) {
                              try {
                                await apiRequest("DELETE", `/api/records/${r.id}`);
                                success += 1;
                              } catch {
                                failed += 1;
                              }
                            }
                            await queryClient.invalidateQueries({ queryKey: ["/api/records"] });
                            if (failed === 0) {
                              toast({ title: "All records deleted" });
                            } else if (success > 0) {
                              toast({ title: `Deleted ${success} records`, description: `${failed} failed`, variant: "destructive" });
                            } else {
                              toast({ title: "Failed to delete records", description: "No records were deleted", variant: "destructive" });
                            }
                            setIsDeleteAllOpen(false);
                            setDeleteAllPassword("");
                          } catch (e: any) {
                            toast({ title: "Failed to delete records", description: e?.message || "", variant: "destructive" });
                          } finally {
                            setIsDeletingAll(false);
                          }
                        }}
                      >
                        {isDeletingAll || isVerifyingPassword ? "Please wait..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog open={isDeleteAccountOpen} onOpenChange={setIsDeleteAccountOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full" data-testid="button-delete-account">
                      <UserX className="h-4 w-4" />
                      Delete account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete your account and all associated data. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2 py-2">
                      <div className="text-sm text-muted-foreground">
                        For your security, please enter your account password to confirm.
                      </div>
                      <Input
                        type="password"
                        placeholder="Account password"
                        value={deleteAccountPassword}
                        onChange={(e) => setDeleteAccountPassword(e.target.value)}
                        data-testid="input-delete-account-password"
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        disabled={isVerifyingPassword}
                        onClick={async () => {
                          try {
                            if (!user?.id) throw new Error("Missing user id");
                            const ok = await verifyPassword(deleteAccountPassword);
                            if (!ok) return;
                            await apiRequest("DELETE", `/api/users/${user.id}`);
                            toast({ title: "Account deleted" });
                            setDeleteAccountPassword("");
                            logout();
                          } catch (e: any) {
                            toast({ title: "Failed to delete account", description: e?.message || "", variant: "destructive" });
                          }
                        }}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button variant="outline" className="w-full sm:col-span-2" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </SettingsAccordionItem>
          </Accordion>
        </div>
      </main>

      <AvatarPickerDialog
        open={isAvatarOpen}
        onOpenChange={setIsAvatarOpen}
        onSelect={async (url) => {
          try {
            setLoading(true);
            const img = new Image();
            img.onload = () => setLoading(false);
            img.onerror = () => setLoading(false);
            img.src = url;

            await updateProfileImage(url);
            toast({ title: "Avatar updated" });
          } catch (e: any) {
            toast({ title: "Failed to update avatar", description: e?.message || "", variant: "destructive" });
          }
        }}
      />

      <OnboardingGuide
        isOpen={isOnboardingOpen}
        onComplete={async () => {
          setIsOnboardingOpen(false);
          try {
            await updateOnboardingStatus(true);
            toast({ title: "Onboarding completed!" });
          } catch (e: any) {
            toast({
              title: "Failed to complete onboarding",
              description: e?.message || "",
              variant: "destructive",
            });
          }
        }}
      />
      {newRecoveryKey && (
        <RecoveryKeyDialog
          recoveryKey={newRecoveryKey}
          onDone={() => setNewRecoveryKey(null)}
        />
      )}
    </div>
  );
}

function SettingsAccordionItem({
  value,
  icon,
  title,
  description,
  children,
}: {
  value: string;
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <AccordionItem value={value} className="overflow-hidden rounded-2xl border bg-card px-4 shadow-sm sm:px-5">
      <AccordionTrigger className="gap-3 py-4 text-left hover:no-underline [&>svg]:text-muted-foreground">
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">{icon}</span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">{title}</span>
            <span className="mt-0.5 block text-xs font-normal leading-snug text-muted-foreground">{description}</span>
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="space-y-3">{children}</AccordionContent>
    </AccordionItem>
  );
}

function PreferenceRow({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-3 py-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background">{icon}</span>
        <div className="min-w-0">
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
      {children}
    </div>
  );
}
