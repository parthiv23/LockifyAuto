import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Copy, Shield } from "lucide-react";
import { useState } from "react";

interface RecoveryKeyDialogProps {
  recoveryKey: string;
  onDone: () => void;
}

export function RecoveryKeyDialog({ recoveryKey, onDone }: RecoveryKeyDialogProps) {
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(recoveryKey);
      toast({ title: "Recovery key copied" });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="space-y-3 text-center">
          <div className="bg-primary rounded-lg p-3 w-fit mx-auto">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <DialogTitle>Save your recovery key</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This is the only way to reset your account password and still open your vault.
          Store it offline. We cannot show it again.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm break-all bg-muted rounded px-3 py-2 font-mono">
            {recoveryKey}
          </code>
          <Button type="button" variant="outline" size="icon" onClick={copy} aria-label="Copy recovery key">
            <Copy className="w-4 h-4" />
          </Button>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <Checkbox checked={saved} onCheckedChange={(v) => setSaved(Boolean(v))} />
          <span>I have saved this recovery key somewhere safe</span>
        </label>
        <Button className="w-full" disabled={!saved} onClick={onDone}>
          Continue
        </Button>
      </DialogContent>
    </Dialog>
  );
}
