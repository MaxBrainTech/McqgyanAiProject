import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type SummaryItem = {
  label: string;
  value: string;
};

type DeleteAccountDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  summaryItems: SummaryItem[];
  confirmWord?: string;
  isDeleting: boolean;
  onConfirm: () => void | Promise<void>;
};

export default function DeleteAccountDialog({
  open,
  onOpenChange,
  title,
  description,
  summaryItems,
  confirmWord = "DELETE",
  isDeleting,
  onConfirm,
}: DeleteAccountDialogProps) {
  const [typedValue, setTypedValue] = useState("");

  useEffect(() => {
    if (!open) {
      setTypedValue("");
    }
  }, [open]);

  const canDelete = useMemo(
    () => typedValue.trim().toUpperCase() === confirmWord.toUpperCase(),
    [confirmWord, typedValue],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto rounded-[1.5rem] border border-rose-200 bg-white p-0 shadow-2xl">
        <div className="border-b border-rose-100 bg-rose-50 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-200">
              <Trash2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-xl font-bold text-rose-950">{title}</DialogTitle>
              <DialogDescription className="mt-1 text-sm text-rose-900/80">
                {description}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-4 text-sm text-rose-950">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              <div className="space-y-1">
                <p className="font-semibold">This action is irreversible.</p>
                <p className="text-rose-900/80">
                  The account and any linked data that can be safely removed will be deleted permanently.
                </p>
              </div>
            </div>
          </div>

          {summaryItems.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {summaryItems.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-1 break-words text-sm font-semibold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-900">
              Type <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-rose-700">{confirmWord}</span> to confirm
            </p>
            <Input
              value={typedValue}
              onChange={(event) => setTypedValue(event.target.value)}
              placeholder={`Type ${confirmWord} here`}
              className="h-11 rounded-xl border-slate-300 focus-visible:ring-rose-500"
            />
          </div>
        </div>

        <DialogFooter className="border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-slate-300 text-slate-700"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={!canDelete || isDeleting}
            className="rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {isDeleting ? "Deleting..." : "Delete Permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
