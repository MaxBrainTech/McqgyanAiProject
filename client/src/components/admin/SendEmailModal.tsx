import { useEffect, useState } from "react";
import { Loader2, Mail, Send } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { sendAdminEmail } from "@/lib/adminApi";

type SendEmailModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientType: "teacher" | "student";
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
};

export default function SendEmailModal({
  open,
  onOpenChange,
  recipientType,
  recipientId,
  recipientName,
  recipientEmail,
}: SendEmailModalProps) {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!open) {
      setSubject("");
      setMessage("");
      setErrorMsg("");
      setIsSending(false);
    }
  }, [open]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!subject.trim()) {
      setErrorMsg("Subject is required.");
      return;
    }

    if (!message.trim()) {
      setErrorMsg("Message is required.");
      return;
    }

    if (!recipientEmail || !recipientEmail.includes("@")) {
      setErrorMsg("Recipient does not have a valid email address.");
      return;
    }

    setIsSending(true);

    try {
      const result = await sendAdminEmail({
        recipientType,
        recipientId,
        subject: subject.trim(),
        message: message.trim(),
      });

      toast({
        title: "Email Sent Successfully",
        description: result.message || `Your email was delivered to ${recipientEmail}.`,
      });

      setSubject("");
      setMessage("");
      setErrorMsg("");
      onOpenChange(false);
    } catch (err: any) {
      const errorText =
        err?.message || "Failed to send email. Please check server SMTP configuration.";
      setErrorMsg(errorText);
      toast({
        title: "Email Failed to Send",
        description: errorText,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto rounded-[1.5rem] border border-blue-200 bg-white p-0 shadow-2xl">
        <div className="border-b border-blue-100 bg-blue-50/80 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <Mail className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-xl font-bold text-slate-950">
                Send Direct Email
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-slate-600">
                Compose and send a personal email to this {recipientType} via MCQGyaan AI email service.
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSend} className="space-y-5 px-6 py-6">
          {errorMsg ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
              {errorMsg}
            </div>
          ) : null}

          {/* Recipient info (read-only) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Recipient
            </Label>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm">
              <span className="font-semibold text-slate-900">{recipientName}</span>
              <span className="font-mono text-xs font-medium text-blue-600">
                {recipientEmail || "No Email Address"}
              </span>
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label htmlFor="email-subject" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Subject <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="email-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Important update regarding your account"
              disabled={isSending}
              className="h-11 rounded-xl border-slate-300 focus-visible:ring-blue-500"
              required
            />
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <Label htmlFor="email-message" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Message <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="email-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your email message here..."
              disabled={isSending}
              rows={6}
              className="min-h-[140px] rounded-xl border-slate-300 focus-visible:ring-blue-500"
              required
            />
            <p className="text-xs text-slate-400">
              Line breaks and paragraphs will be preserved in the recipient's email.
            </p>
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSending}
              className="rounded-xl border-slate-300 text-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSending}
              className="rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Email...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
