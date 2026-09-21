import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { PasswordRecord } from "@shared/schema";
import { Copy, Edit, Trash2, Eye, EyeOff, Info, Star } from "lucide-react";
import { getCategoryIcon, getCategoryLabel, isSocialMedia } from "@/components/record-modal";
import { VibrateIfEnabled } from "@/lib/vibration";

interface PasswordRecordCardProps {
  record: PasswordRecord;
  onEdit: (record: PasswordRecord) => void;
  onDelete: (record: PasswordRecord) => void;
  onToggleStar?: (record: PasswordRecord) => void;
}

export function PasswordRecordCard({ record, onEdit, onDelete, onToggleStar }: PasswordRecordCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async (text: string, fieldName: string) => {
    // Try modern API first
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for http/non-secure contexts or older browsers
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      // ✅ Vibration feedback on successful copy
      VibrateIfEnabled.short();
      toast({ title: "Copied to clipboard", description: `${fieldName} has been copied to your clipboard` });
    } catch (error) {
      try {
        // Last-resort fallback using selection API
        const range = document.createRange();
        const node = document.createTextNode(text);
        document.body.appendChild(node);
        range.selectNode(node);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        document.execCommand("copy");
        selection?.removeAllRanges();
        document.body.removeChild(node);
        // ✅ Vibration feedback on successful copy
        VibrateIfEnabled.short();
        toast({ title: "Copied to clipboard", description: `${fieldName} has been copied to your clipboard` });
      } catch {
        // ❌ Error vibration on failure
        VibrateIfEnabled.error();
        toast({ title: "Copy failed", description: "Failed to copy to clipboard", variant: "destructive" });
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card className="record-glass-card hover:shadow-md transition-shadow" data-testid={`card-record-${record.id}`}>
      <div className="flex items-center justify-between gap-1 border-b p-2">
        <div className="flex items-center gap-2 ml-1 min-w-0">
          {record.userType && (
            <div className="flex items-center gap-1.5 min-w-0" title={getCategoryLabel(record.userType)}>
              {getCategoryIcon(record.userType)}
              <span className="truncate text-xs text-muted-foreground hidden sm:inline">
                {getCategoryLabel(record.userType)}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 h-8 w-8 border"
            onClick={() => onToggleStar && onToggleStar(record)}
            data-testid={`button-star-${record.id}`}
            title={record.starred ? "Unstar" : "Star"}
          >
            <Star className={`w-4 h-4 ${record.starred ? "text-yellow-500" : ""}`} fill={record.starred ? "currentColor" : "none"} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 h-8 w-8 border"
            onClick={() => onEdit(record)}
            data-testid={`button-edit-${record.id}`}
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 h-8 w-8 border text-destructive"
            onClick={() => onDelete(record)}
            data-testid={`button-delete-${record.id}`}
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 h-8 w-8 border"
                title="Info"
                data-testid={`button-info-${record.id}`}
              >
                <Info className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 text-xs">
              <div className="space-y-1">
                <div className="font-medium">Record info</div>
                <div className="flex justify-between gap-3">
                  <span>Created</span>
                  <span data-testid={`text-created-${record.id}`}>{formatDate(record.createdAt as any)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Updated</span>
                  <span data-testid={`text-updated-${record.id}`}>{formatDate(record.updatedAt as any)}</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2 p-2 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="flex-1 bg-muted rounded px-3 py-2 font-mono text-sm break-all min-w-0" data-testid={`text-email-${record.id}`}>
              {record.email}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(record.email, isSocialMedia(record.userType) ? "Username" : "Email")}
              className="p-2 h-8 w-8 flex-shrink-0 border"
              title={isSocialMedia(record.userType) ? "Copy username" : "Copy email"}
              data-testid={`button-copy-email-${record.id}`}
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>

          <div className="flex items-center space-x-2 min-w-0">
            <div className="flex-1 bg-muted rounded px-3 py-2 font-mono text-sm break-all min-w-0" data-testid={`text-password-${record.id}`}>
              {showPassword ? record.password : "••••••••••••"}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPassword(!showPassword)}
              className="p-2 h-8 w-8 flex-shrink-0 border"
              title="Show/hide password"
              data-testid={`button-toggle-password-${record.id}`}
            >
              {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(record.password, "Password")}
              className="p-2 h-8 w-8 flex-shrink-0 border"
              title="Copy password"
              data-testid={`button-copy-password-${record.id}`}
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {record.description && (
          <div className="flex items-start space-x-2">
            <div className="flex-1 bg-muted rounded px-3 py-2 text-sm break-words min-w-0" data-testid={`text-description-${record.id}`}>
              {record.description}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(record.description!, "Description")}
              className="p-2 h-8 w-8 flex-shrink-0 mt-0 border"
              title="Copy description"
              data-testid={`button-copy-description-${record.id}`}
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
