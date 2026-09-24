import { useMemo, useRef, useState } from "react";
import { ArchiveRestore, Download, Eye, EyeOff, Loader2, Upload } from "lucide-react";
import { PasswordRecord } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { history } from "@/lib/history";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { encryptPassword, decryptRecord } from "@/lib/vault";
import {
  applyAllConflicts,
  applyConflictResolution,
  backupFilename,
  buildCsvBackup,
  buildLumoraBackup,
  decryptLumoraBackup,
  downloadLumoraBackup,
  downloadTextFile,
  encryptLumoraBackup,
  inspectBackupFile,
  maskSecret,
  planLumoraImport,
  summarizePlan,
  toApiDate,
  type ConflictResolution,
  type EncryptedLumoraBackup,
  type ExportFormat,
  type ImportPlan,
  type PlannedImportRow,
} from "@/lib/vault-backup";

type Props = {
  username?: string;
  records: PasswordRecord[];
  verifyPassword: (password: string) => Promise<boolean>;
  isVerifyingPassword: boolean;
};

const IMPORT_BATCH = 8;

function rowResolution(row: PlannedImportRow): ConflictResolution {
  if (row.action === "replace") return "replace";
  if (row.action === "create") return "add";
  return "skip";
}

function CompareField({ label, vault, incoming }: { label: string; vault: string; incoming: string }) {
  const differs = vault !== incoming;
  return (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div>
        <div className="text-muted-foreground">{label} in vault</div>
        <div className={`mt-0.5 break-all font-medium ${differs ? "text-amber-700 dark:text-amber-400" : ""}`}>{vault || "—"}</div>
      </div>
      <div>
        <div className="text-muted-foreground">{label} in file</div>
        <div className={`mt-0.5 break-all font-medium ${differs ? "text-amber-700 dark:text-amber-400" : ""}`}>{incoming || "—"}</div>
      </div>
    </div>
  );
}

export function VaultBackupActions({ username, records, verifyPassword, isVerifyingPassword }: Props) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [includeTrash, setIncludeTrash] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("encrypted");
  const [exportPassword, setExportPassword] = useState("");
  const [backupPassphrase, setBackupPassphrase] = useState("");
  const [backupPassphraseConfirm, setBackupPassphraseConfirm] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [importPassword, setImportPassword] = useState("");
  const [filePassphrase, setFilePassphrase] = useState("");
  const [pendingEncrypted, setPendingEncrypted] = useState<EncryptedLumoraBackup | null>(null);
  const [importPlan, setImportPlan] = useState<ImportPlan | null>(null);
  const [importFileName, setImportFileName] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  const conflicts = useMemo(() => importPlan?.rows.map((row, index) => ({ row, index })).filter((item) => item.row.conflict) ?? [], [importPlan]);

  const resetExport = () => {
    setExportPassword("");
    setBackupPassphrase("");
    setBackupPassphraseConfirm("");
    setIncludeTrash(false);
    setExportFormat("encrypted");
    setAcknowledged(false);
    setIsExporting(false);
  };

  const resetImport = () => {
    setImportPassword("");
    setFilePassphrase("");
    setPendingEncrypted(null);
    setImportPlan(null);
    setImportFileName("");
    setIsImporting(false);
    setIsUnlocking(false);
    setImportProgress({ done: 0, total: 0 });
    setRevealed({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleExport = async () => {
    if (!acknowledged) {
      toast({ title: "Please confirm you understand this file contains passwords", variant: "destructive" });
      return;
    }
    if (exportFormat === "encrypted") {
      if (backupPassphrase.length < 8) {
        toast({ title: "Backup password must be at least 8 characters", variant: "destructive" });
        return;
      }
      if (backupPassphrase !== backupPassphraseConfirm) {
        toast({ title: "Backup passwords do not match", variant: "destructive" });
        return;
      }
    }
    setIsExporting(true);
    try {
      const ok = await verifyPassword(exportPassword);
      if (!ok) return;
      const backup = buildLumoraBackup(records, { username, includeTrash });
      if (exportFormat === "csv") {
        downloadTextFile(buildCsvBackup(records, includeTrash), backupFilename(username, "csv"), "text/csv");
      } else if (exportFormat === "encrypted") {
        const encrypted = await encryptLumoraBackup(backup, backupPassphrase);
        downloadLumoraBackup(encrypted, backupFilename(username, "encrypted"));
      } else {
        downloadLumoraBackup(backup, backupFilename(username, "json"));
      }
      setExportOpen(false);
      resetExport();
      toast({
        title: "Vault exported",
        description: `${backup.records.length} record${backup.records.length === 1 ? "" : "s"} saved.`,
      });
      void history.add({
        type: "vault: export",
        summary: `Exported ${backup.records.length} records`,
        details: { count: backup.records.length, includeTrash, format: exportFormat },
      }).catch(() => {});
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChosen = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      const inspected = inspectBackupFile(text, file.name);
      setImportFileName(file.name);
      if (inspected.kind === "encrypted" && inspected.encrypted) {
        setPendingEncrypted(inspected.encrypted);
        setImportOpen(true);
        return;
      }
      if (inspected.backup) {
        setPendingEncrypted(null);
        setImportPlan(planLumoraImport(inspected.backup, records));
        setImportOpen(true);
      }
    } catch (error: any) {
      toast({
        title: "Could not read backup",
        description: error?.message || "Choose a Lumora JSON or CSV file.",
        variant: "destructive",
      });
      resetImport();
    }
  };

  const unlockEncrypted = async () => {
    if (!pendingEncrypted) return;
    setIsUnlocking(true);
    try {
      const backup = await decryptLumoraBackup(pendingEncrypted, filePassphrase);
      setPendingEncrypted(null);
      setFilePassphrase("");
      setImportPlan(planLumoraImport(backup, records));
    } catch (error: any) {
      toast({
        title: "Could not unlock backup",
        description: error?.message || "Check the backup password.",
        variant: "destructive",
      });
    } finally {
      setIsUnlocking(false);
    }
  };

  const setConflict = (index: number, resolution: ConflictResolution) => {
    if (!importPlan) return;
    const rows = importPlan.rows.map((row, rowIndex) => (rowIndex === index ? applyConflictResolution(row, resolution) : row));
    setImportPlan(summarizePlan(rows));
  };

  const setAllConflicts = (resolution: ConflictResolution) => {
    if (!importPlan) return;
    setImportPlan(summarizePlan(applyAllConflicts(importPlan.rows, resolution)));
  };

  const persistRow = async (row: PlannedImportRow): Promise<PasswordRecord> => {
    const password = await encryptPassword(row.password);
    const payload = {
      email: row.email,
      password,
      description: row.description,
      userType: row.userType,
      starred: row.starred,
      isDeleted: row.isDeleted || undefined,
      deletedAt: row.isDeleted ? toApiDate(row.deletedAt) || new Date().toISOString() : undefined,
    };
    if (row.action === "replace" && row.existingId) {
      const res = await apiRequest("PUT", `/api/records/${row.existingId}`, payload);
      return decryptRecord((await res.json()) as PasswordRecord);
    }
    const res = await apiRequest("POST", "/api/records", payload);
    return decryptRecord((await res.json()) as PasswordRecord);
  };

  const handleImport = async () => {
    if (!importPlan) return;
    const actionable = importPlan.rows.filter((row) => row.action === "create" || row.action === "replace");
    if (actionable.length === 0) {
      toast({ title: "Nothing to import", description: "Every row was skipped." });
      return;
    }
    setIsImporting(true);
    setImportProgress({ done: 0, total: actionable.length });
    try {
      const ok = await verifyPassword(importPassword);
      if (!ok) return;

      let created = 0;
      let replaced = 0;
      let failed = 0;
      const cache = [...records];

      for (let i = 0; i < actionable.length; i += IMPORT_BATCH) {
        const batch = actionable.slice(i, i + IMPORT_BATCH);
        const results = await Promise.allSettled(batch.map((row) => persistRow(row)));
        results.forEach((result, index) => {
          const row = batch[index];
          if (result.status === "fulfilled") {
            if (row.action === "replace") {
              const next = cache.findIndex((record) => record.id === result.value.id);
              if (next >= 0) cache[next] = result.value;
              else cache.unshift(result.value);
              replaced += 1;
            } else {
              cache.unshift(result.value);
              created += 1;
            }
          } else {
            failed += 1;
          }
        });
        setImportProgress({ done: Math.min(i + batch.length, actionable.length), total: actionable.length });
      }

      queryClient.setQueryData(["/api/records"], cache);
      await queryClient.invalidateQueries({ queryKey: ["/api/records"] });
      setImportOpen(false);
      resetImport();
      toast({
        title: failed === 0 ? "Vault imported" : "Import finished with errors",
        description: `${created} added, ${replaced} replaced, ${importPlan.skipped} skipped${failed ? `, ${failed} failed` : ""}.`,
        variant: failed ? "destructive" : "default",
      });
      void history.add({
        type: "vault: import",
        summary: `Imported ${created + replaced} records`,
        details: { created, replaced, skipped: importPlan.skipped, failed },
      }).catch(() => {});
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button variant="outline" className="w-full" onClick={() => setExportOpen(true)} data-testid="button-export-vault">
          <Download className="h-4 w-4" />
          Export vault
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
          data-testid="button-import-vault"
        >
          <Upload className="h-4 w-4" />
          Import vault
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json,text/csv,.csv"
          className="hidden"
          onChange={(event) => {
            void handleFileChosen(event.target.files?.[0]);
          }}
        />
      </div>

      <Dialog
        open={exportOpen}
        onOpenChange={(open) => {
          if (isExporting) return;
          setExportOpen(open);
          if (!open) resetExport();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Export vault</DialogTitle>
            <DialogDescription>
              Encrypted JSON is the safest default. CSV and plain JSON are readable by anyone who has the file.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <RadioGroup value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)} className="space-y-2">
              <label className="flex items-start gap-3 rounded-xl border border-border px-3 py-2.5 text-sm">
                <RadioGroupItem value="encrypted" id="export-encrypted" className="mt-0.5" />
                <span>
                  <span className="font-medium">Encrypted JSON</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">Locked with a backup password you choose.</span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-border px-3 py-2.5 text-sm">
                <RadioGroupItem value="json" id="export-json" className="mt-0.5" />
                <span>
                  <span className="font-medium">Plain JSON</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">Readable Lumora backup.</span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-border px-3 py-2.5 text-sm">
                <RadioGroupItem value="csv" id="export-csv" className="mt-0.5" />
                <span>
                  <span className="font-medium">CSV</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">For spreadsheets and other password apps.</span>
                </span>
              </label>
            </RadioGroup>

            <label className="flex items-start gap-3 text-sm">
              <Checkbox checked={includeTrash} onCheckedChange={(checked) => setIncludeTrash(checked === true)} className="mt-0.5" />
              <span>
                <span className="font-medium">Include trash</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">Off by default. Only active records are exported.</span>
              </span>
            </label>

            {exportFormat === "encrypted" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="backup-passphrase">Backup password</Label>
                  <Input
                    id="backup-passphrase"
                    type="password"
                    value={backupPassphrase}
                    onChange={(event) => setBackupPassphrase(event.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="backup-passphrase-confirm">Confirm backup password</Label>
                  <Input
                    id="backup-passphrase-confirm"
                    type="password"
                    value={backupPassphraseConfirm}
                    onChange={(event) => setBackupPassphraseConfirm(event.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="space-y-1.5">
                <Label htmlFor="export-account-password">Account password</Label>
                <Input
                  id="export-account-password"
                  type="password"
                  autoComplete="current-password"
                  value={exportPassword}
                  onChange={(event) => setExportPassword(event.target.value)}
                  data-testid="input-export-password"
                />
              </div>
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={acknowledged}
                  onCheckedChange={(checked) => setAcknowledged(checked === true)}
                  className="mt-0.5"
                  data-testid="checkbox-export-acknowledge"
                />
                <span>I understand anyone with this file can read my passwords.</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)} disabled={isExporting}>
              Cancel
            </Button>
            <Button onClick={() => void handleExport()} disabled={isExporting || isVerifyingPassword || !exportPassword || !acknowledged}>
              {isExporting || isVerifyingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={importOpen}
        onOpenChange={(open) => {
          if (isImporting) return;
          setImportOpen(open);
          if (!open) resetImport();
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import vault</DialogTitle>
            <DialogDescription>
              {pendingEncrypted
                ? "This file is encrypted. Enter the backup password to open it."
                : importFileName
                  ? `Review ${importFileName}. Matching records use the same email and category.`
                  : "Choose a Lumora JSON or CSV file."}
            </DialogDescription>
          </DialogHeader>

          {pendingEncrypted && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="file-passphrase">Backup password</Label>
                <Input
                  id="file-passphrase"
                  type="password"
                  value={filePassphrase}
                  onChange={(event) => setFilePassphrase(event.target.value)}
                  autoComplete="off"
                />
              </div>
              <Button className="w-full" onClick={() => void unlockEncrypted()} disabled={isUnlocking || !filePassphrase}>
                {isUnlocking ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Unlock file
              </Button>
            </div>
          )}

          {importPlan && !pendingEncrypted && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded-xl bg-muted/50 px-2 py-3">
                  <div className="text-lg font-semibold">{importPlan.toCreate}</div>
                  <div className="text-xs text-muted-foreground">Add</div>
                </div>
                <div className="rounded-xl bg-muted/50 px-2 py-3">
                  <div className="text-lg font-semibold">{importPlan.toReplace}</div>
                  <div className="text-xs text-muted-foreground">Replace</div>
                </div>
                <div className="rounded-xl bg-muted/50 px-2 py-3">
                  <div className="text-lg font-semibold">{importPlan.skipped}</div>
                  <div className="text-xs text-muted-foreground">Skip</div>
                </div>
              </div>

              {conflicts.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium">{conflicts.length} already in your vault</p>
                    <div className="flex flex-wrap gap-1.5">
                      <Button type="button" size="sm" variant="outline" onClick={() => setAllConflicts("skip")}>Keep existing</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => setAllConflicts("replace")}>Use file</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => setAllConflicts("add")}>Keep both</Button>
                    </div>
                  </div>
                  <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                    {conflicts.map(({ row, index }) => {
                      const show = Boolean(revealed[index]);
                      return (
                        <div key={`${row.email}-${row.userType}-${index}`} className="space-y-3 rounded-xl border border-border p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium">{row.email}</div>
                              <div className="text-xs text-muted-foreground">
                                {row.userType}
                                {row.isDeleted ? " · in file as trash" : ""}
                                {row.existing?.isDeleted ? " · vault copy is trash" : ""}
                              </div>
                            </div>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 shrink-0"
                              onClick={() => setRevealed((current) => ({ ...current, [index]: !current[index] }))}
                              aria-label={show ? "Hide passwords" : "Show passwords"}
                            >
                              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <CompareField
                              label="Password"
                              vault={show ? row.existing?.password || "—" : maskSecret(row.existing?.password)}
                              incoming={show ? row.password : maskSecret(row.password)}
                            />
                            <CompareField
                              label="Description"
                              vault={row.existing?.description || "—"}
                              incoming={row.description || "—"}
                            />
                            <CompareField
                              label="Status"
                              vault={row.existing?.isDeleted ? "Trash" : "Active"}
                              incoming={row.isDeleted ? "Trash" : "Active"}
                            />
                          </div>
                          <RadioGroup
                            value={rowResolution(row)}
                            onValueChange={(value) => setConflict(index, value as ConflictResolution)}
                            className="grid gap-2 sm:grid-cols-3"
                          >
                            <label className="flex items-center gap-2 rounded-lg border border-border px-2 py-2 text-xs">
                              <RadioGroupItem value="skip" />
                              Keep existing
                            </label>
                            <label className="flex items-center gap-2 rounded-lg border border-border px-2 py-2 text-xs">
                              <RadioGroupItem value="replace" />
                              Use file
                            </label>
                            <label className="flex items-center gap-2 rounded-lg border border-border px-2 py-2 text-xs">
                              <RadioGroupItem value="add" />
                              Keep both
                            </label>
                          </RadioGroup>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {isImporting && (
                <div className="space-y-2">
                  <Progress value={importProgress.total ? (importProgress.done / importProgress.total) * 100 : 0} />
                  <p className="text-xs text-muted-foreground">
                    Importing {importProgress.done} / {importProgress.total}
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="import-account-password">Account password</Label>
                <Input
                  id="import-account-password"
                  type="password"
                  autoComplete="current-password"
                  value={importPassword}
                  onChange={(event) => setImportPassword(event.target.value)}
                  disabled={isImporting}
                  data-testid="input-import-password"
                />
              </div>
            </div>
          )}

          {!pendingEncrypted && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setImportOpen(false)} disabled={isImporting}>
                Cancel
              </Button>
              <Button
                onClick={() => void handleImport()}
                disabled={!importPlan || isImporting || isVerifyingPassword || !importPassword}
              >
                {isImporting || isVerifyingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <ArchiveRestore className="h-4 w-4" />
                    Import records
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
