import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  CalendarClock,
  Clock3,
  FileText,
  Gauge,
  GraduationCap,
  LineChart,
  Mail,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
  TrendingDown,
  TrendingUp,
  UserRound,
  Users2,
  Trash2,
  Award,
  Calendar,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DeleteAccountDialog from "@/components/admin/DeleteAccountDialog";
import SendEmailModal from "@/components/admin/SendEmailModal";
import { useToast } from "@/hooks/use-toast";
import { deleteStudentAccount, getStudentDetails, type AdminStudentDetailsResponse } from "@/lib/adminApi";

const formatDateTime = (value: string | null | undefined, fallback = "N/A") => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatNumber = (value: number | null | undefined, fallback = "0") => {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback;
  return new Intl.NumberFormat("en-IN").format(value);
};

const formatPercent = (value: number | null | undefined, fallback = "N/A") => {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback;
  return `${Number(value).toFixed(1)}%`;
};

const formatDuration = (minutes: number | null | undefined, fallback = "0m") => {
  if (minutes === null || minutes === undefined || Number.isNaN(minutes)) return fallback;

  const totalMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
};

const getInitials = (name: string) => {
  if (!name) return "S";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

function StatCard({
  title,
  value,
  description,
  icon,
  accent,
}: {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
  accent: string;
}) {
  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-1.5 text-2xl font-black tracking-tight text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">{description}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent} text-white shadow-sm`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

function DetailItem({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value ?? "Not set"}</p>
    </div>
  );
}

export default function AdminStudentDetails() {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const studentQuery = useQuery<AdminStudentDetailsResponse>({
    queryKey: ["admin", "students", studentId],
    queryFn: () => getStudentDetails(String(studentId || "")),
    enabled: Boolean(studentId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteStudentAccount(String(studentId || "")),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast({
        title: "Student Account Deleted",
        description: result.message,
      });
      setDeleteOpen(false);
      navigate("/admin-dashboard");
    },
    onError: (error) => {
      toast({
        title: "Unable to delete student account",
        description: String(error),
        variant: "destructive",
      });
    },
  });

  const details = studentQuery.data;
  const profile = details?.profile;
  const statistics = details?.statistics;
  const recentTestHistory = details?.recentTestHistory ?? [];
  const subjectPerformance = details?.subjectPerformance ?? [];
  const activityTimeline = details?.activityTimeline ?? [];

  const registeredDate = useMemo(
    () => formatDateTime(profile?.createdAt, "N/A"),
    [profile?.createdAt],
  );

  const lastActiveDate = useMemo(
    () => formatDateTime(profile?.lastLogin, "Never"),
    [profile?.lastLogin],
  );

  const handleSendEmail = () => {
    if (!profile?.email) {
      toast({
        title: "Email not available",
        description: "This student record does not have an email address configured.",
        variant: "destructive",
      });
      return;
    }

    setEmailModalOpen(true);
  };

  if (!studentId || studentQuery.isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/60 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-cyan-600" />
          <p className="mt-3 text-sm font-semibold text-slate-600">Loading student profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50/60 p-6 sm:p-10">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <UserRound className="mx-auto h-12 w-12 text-slate-400" />
          <h2 className="mt-4 text-xl font-bold text-slate-900">Student Not Found</h2>
          <p className="mt-1 text-sm text-slate-600">The requested student profile could not be found.</p>
          <Button className="mt-6 rounded-xl bg-slate-900" onClick={() => navigate("/admin-dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const displayName = profile.fullName || profile.displayName || profile.name || "Student";

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin-dashboard")}
            className="rounded-xl text-slate-700 hover:bg-slate-100 font-semibold text-xs"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="flex items-center gap-2">
            <Badge className="bg-slate-100 text-slate-800 border-slate-200 text-xs font-mono">
              ID: {profile.id}
            </Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 space-y-6">
        {/* Profile Hero Header Card */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-xl sm:p-8">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-600/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-cyan-600 font-black text-white text-2xl shadow-lg shadow-cyan-500/20">
                {getInitials(displayName)}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{displayName}</h1>
                  <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                    Class {profile.classLevel ?? "N/A"}
                  </Badge>
                  {profile.board ? (
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                      {profile.board} Board
                    </Badge>
                  ) : null}
                </div>
                <p className="text-sm font-mono text-slate-300">{profile.email}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    Joined {registeredDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                    Last Active: {lastActiveDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 sm:self-start">
              <Button
                type="button"
                onClick={handleSendEmail}
                className="h-10 rounded-xl bg-cyan-600 font-semibold text-white hover:bg-cyan-700 text-xs shadow-sm"
              >
                <Mail className="mr-1.5 h-4 w-4" />
                Send Email
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteOpen(true)}
                className="h-10 rounded-xl border-rose-500/30 bg-rose-500/10 font-semibold text-rose-200 hover:bg-rose-500/20 text-xs"
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Performance Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Tests Attempted"
            value={formatNumber(statistics?.testsAttempted)}
            description="Total tests submitted"
            icon={<BookOpenCheck className="h-5 w-5" />}
            accent="bg-cyan-600"
          />
          <StatCard
            title="Questions Answered"
            value={formatNumber(statistics?.totalQuestionsAttempted)}
            description="Total questions attempted"
            icon={<Target className="h-5 w-5" />}
            accent="bg-blue-600"
          />
          <StatCard
            title="Average Percentage"
            value={formatPercent(statistics?.averageScore)}
            description="Overall accuracy score"
            icon={<Award className="h-5 w-5" />}
            accent="bg-emerald-600"
          />
          <StatCard
            title="Time Practiced"
            value={formatDuration(statistics?.timeSpentLearningMinutes)}
            description="Total time spent taking tests"
            icon={<TimerReset className="h-5 w-5" />}
            accent="bg-violet-600"
          />
        </div>

        {/* Profile Info Details */}
        <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-5">
            <CardTitle className="text-base font-bold text-slate-900">
              Student Profile Information
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Student metadata and enrollment details.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem label="Full Name" value={profile.fullName} />
            <DetailItem label="Email Address" value={profile.email} />
            <DetailItem label="Class / Grade" value={profile.classLevel ? `Class ${profile.classLevel}` : null} />
            <DetailItem label="Educational Board" value={profile.board} />
            <DetailItem label="School Name" value={profile.school} />
            <DetailItem label="State / Location" value={profile.state} />
          </CardContent>
        </Card>

        {/* Subject Breakdown & Test History */}
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Subject Breakdown */}
          <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-5">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Gauge className="h-4 w-4 text-cyan-600" />
                Performance by Subject
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Subject-wise test submission volume and average percentage.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              {subjectPerformance.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center text-xs text-slate-500">
                  No subject attempt records yet for this student.
                </div>
              ) : (
                <div className="space-y-3">
                  {subjectPerformance.map((subj) => (
                    <div key={subj.subject} className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{subj.subject}</p>
                          <p className="text-xs text-slate-500">{subj.attempts} Tests • {subj.totalQuestionsAttempted} Questions</p>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 font-bold">
                          {formatPercent(subj.averageScore)}
                        </Badge>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(0, subj.averageScore || 0))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Submission History */}
          <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-5">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Test Submission History
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Recent test attempts and submitted scores.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              {recentTestHistory.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center text-xs text-slate-500">
                  No submitted tests in history for this student.
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200/90">
                  <Table>
                    <TableHeader className="bg-slate-50/80">
                      <TableRow className="border-slate-200/80 hover:bg-transparent">
                        <TableHead className="font-semibold text-slate-700">Subject</TableHead>
                        <TableHead className="font-semibold text-slate-700">Difficulty</TableHead>
                        <TableHead className="font-semibold text-slate-700">Score</TableHead>
                        <TableHead className="font-semibold text-slate-700">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentTestHistory.map((test) => (
                        <TableRow key={test.id} className="border-slate-100 hover:bg-slate-50/60">
                          <TableCell className="font-semibold text-slate-900 text-xs truncate max-w-[140px]">
                            {test.subject}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 capitalize">{test.difficulty || "N/A"}</TableCell>
                          <TableCell className="text-xs font-mono font-medium text-slate-900">
                            {test.score}/{test.maxScore}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                              {formatPercent(test.percentage)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <DeleteAccountDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Student Profile Permanently?"
        description="This removes the student profile and all associated score attempt records from PostgreSQL."
        summaryItems={[
          { label: "Student", value: displayName },
          { label: "Email", value: profile.email },
          { label: "Tests attempted", value: String(statistics?.testsAttempted ?? 0) },
          { label: "Score history records", value: String(recentTestHistory.length) },
        ]}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />

      <SendEmailModal
        open={emailModalOpen}
        onOpenChange={setEmailModalOpen}
        recipientType="student"
        recipientId={String(studentId)}
        recipientName={displayName}
        recipientEmail={profile.email || ""}
      />
    </div>
  );
}
