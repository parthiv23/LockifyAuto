import { useState, type Dispatch, type SetStateAction } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { FEMALE_AVATARS, MALE_AVATARS } from "@/lib/avatars";

type AvatarPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
};

function AvatarGrid({
  avatars,
  onPick,
  loaded,
  setLoaded,
}: {
  avatars: readonly string[];
  onPick: (url: string) => void;
  loaded: Record<string, boolean>;
  setLoaded: Dispatch<SetStateAction<Record<string, boolean>>>;
}) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 overflow-y-auto overflow-x-hidden max-h-80 p-1">
      {avatars.map((url) => {
        const isLoading = !loaded[url];
        return (
          <button
            key={url}
            type="button"
            className="relative w-auto aspect-square rounded-full overflow-hidden border border-border hover:ring-2 hover:ring-primary transition"
            onClick={() => onPick(url)}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/40">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}
            <img
              src={url}
              alt="Avatar option"
              className={`w-full h-full object-cover ${isLoading ? "opacity-0" : "opacity-100"}`}
              onLoad={() => setLoaded((s) => ({ ...s, [url]: true }))}
              onError={() => setLoaded((s) => ({ ...s, [url]: true }))}
            />
          </button>
        );
      })}
    </div>
  );
}

export default function AvatarPickerDialog({ open, onOpenChange, onSelect }: AvatarPickerDialogProps) {
  const [loadedMap, setLoadedMap] = useState<Record<string, boolean>>({});
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl px-2 py-4 sm:p-4">
        <DialogHeader>
          <DialogTitle>Select your avatar</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="male" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="male">Male</TabsTrigger>
            <TabsTrigger value="female">Female</TabsTrigger>
          </TabsList>
          <TabsContent value="male" forceMount className="space-y-4">
            <AvatarGrid
              avatars={MALE_AVATARS}
              loaded={loadedMap}
              setLoaded={setLoadedMap}
              onPick={(url) => {
                onSelect(url);
                onOpenChange(false);
              }}
            />
          </TabsContent>
          <TabsContent value="female" forceMount className="space-y-4">
            <AvatarGrid
              avatars={FEMALE_AVATARS}
              loaded={loadedMap}
              setLoaded={setLoadedMap}
              onPick={(url) => {
                onSelect(url);
                onOpenChange(false);
              }}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
