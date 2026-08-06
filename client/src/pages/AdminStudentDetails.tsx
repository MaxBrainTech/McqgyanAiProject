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
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DeleteAccountDialog from "@/components/admin/DeleteAccountDialog";
import { useToast } from "@/hooks/use-toast";
import { deleteStudentAccount, getStudentDetails, type AdminStudentDetailsResponse } from "@/lib/adminApi";

const formatDateTime = (value: string | null | undefined, fallback = "Not available") => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatNumber = (value: number | null | undefined, fallback = "Not available") => {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback;
  return new Intl.NumberFormat("en-IN").format(value);
};

const formatPercent = (value: number | null | undefined, fallback = "Not available") => {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback;
  return `${Number(value).toFixed(2)}%`;
};

const formatDuration = (minutes: number | null | undefined, fallback = "Not available") => {
  if (minutes === null || minutes === undefined || Number.isNaN(minutes)) return fallback;

  const totalMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
};

const openMailClient = (email: string, subject: string, body: string) => {
  const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
};

const subjectTone = (subject: string) => {
  const normalized = subject.toLowerCase();

  if (normalized.includes("math")) return "bg-blue-100 text-blue-800";
  if (normalized.includes("science")) return "bg-cyan-100 text-cyan-800";
  if (normalized.includes("english")) return "bg-emerald-100 text-emerald-800";
  if (normalized.includes("social")) return "bg-amber-100 text-amber-800";
  if (normalized.includes("hindi")) return "bg-rose-100 text-rose-800";
  return "bg-slate-100 text-slate-800";
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
    <Card className="overflow-hidden rounded-[1.5rem] border-slate-200/80 bg-white/95 shadow-lg shadow-slate-200/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{title}</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </div>
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${accent} text-white shadow-lg`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
  icon,
}: {
  title: string;
  description: string;
  children: ReactNode;
  icon: ReactNode;
}) {
  return (
    <Card className="rounded-[1.75rem] border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/50">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900">{title}</CardTitle>
            <CardDescription className="mt-1 text-slate-600">{description}</CardDescription>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(8,145,178,0.12),transparent_35%),linear-gradient(180deg,#f8fafc_0%,#ecfeff_55%,#ffffff_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Card className="overflow-hidden rounded-[1.75rem] border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-200/70">
          <CardHeader className="space-y-4">
            <Skeleton className="h-6 w-40 rounded-full" />
            <Skeleton className="h-10 w-96 max-w-full rounded-2xl" />
            <Skeleton className="h-5 w-[32rem] max-w-full rounded-full" />
            <div className="flex flex-wrap gap-3 pt-2">
              <Skeleton className="h-11 w-36 rounded-xl" />
              <Skeleton className="h-11 w-32 rounded-xl" />
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <Card key={index} className="rounded-[1.5rem] border-slate-200/80 bg-white/95 shadow-lg shadow-slate-200/50">
              <CardContent className="p-5">
                <Skeleton className="h-4 w-32 rounded-full" />
                <Skeleton className="mt-4 h-10 w-24 rounded-full" />
                <Skeleton className="mt-3 h-4 w-full rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="rounded-[1.75rem] border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/50">
          <CardHeader className="space-y-4">
            <Skeleton className="h-6 w-48 rounded-full" />
            <Skeleton className="h-4 w-96 max-w-full rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 12 }).map((_, index) => (
                <Skeleton key={index} className="h-24 rounded-2xl" />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/50">
          <CardHeader className="space-y-4">
            <Skeleton className="h-6 w-52 rounded-full" />
            <Skeleton className="h-4 w-96 max-w-full rounded-full" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-16 rounded-2xl" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "active" | "inactive" }) {
  return (
    <Badge
      className={
        status === "active"
          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
          : "bg-slate-100 text-slate-700 hover:bg-slate-100"
      }
    >
      {status === "active" ? "Active" : "Inactive"}
    </Badge>
  );
}

export default function AdminStudentDetails() {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

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
        title: "Student account deleted",
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

  const data = studentQuery.data;
  const profile = data?.profile;
  const statistics = data?.statistics;
  const subjectPerformance = data?.subjectPerformance ?? [];
  const recentTestHistory = data?.recentTestHistory ?? [];
  const activityTimeline = data?.activityTimeline ?? [];
  const strongSubjects = data?.strongSubjects ?? [];
  const weakSubjects = data?.weakSubjects ?? [];
  const actionSummary = {
    testsAttempted: statistics?.testsAttempted ?? 0,
    totalQuestionsAttempted: statistics?.totalQuestionsAttempted ?? 0,
    subjectPerformanceCount: subjectPerformance.length,
    recentHistoryCount: recentTestHistory.length,
    activityCount: activityTimeline.length,
  };

  const profileName = useMemo(
    () => profile?.fullName || profile?.displayName || profile?.name || "Student details",
    [profile?.displayName, profile?.fullName, profile?.name],
  );

  const handleSendEmail = () => {
    if (!profile?.email) {
      toast({
        title: "Email not available",
        description: "This student record does not have an email address yet.",
        variant: "destructive",
      });
      return;
    }

    openMailClient(
      profile.email,
      `Message for ${profile.fullName || profile.displayName || profile.name}`,
      `Hello ${profile.fullName || profile.displayName || profile.name},\n\n`,
    );
  };

  if (!studentId) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(8,145,178,0.12),transparent_35%),linear-gradient(180deg,#f8fafc_0%,#ecfeff_55%,#ffffff_100%)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-xl">
          <p className="text-lg font-semibold text-slate-900">Student not found</p>
          <p className="mt-2 text-sm text-slate-600">The student identifier is missing from the route.</p>
          <Button className="mt-6" onClick={() => navigate("/admin-dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (studentQuery.isLoading) {
    return <LoadingSkeleton />;
  }

  if (studentQuery.error || !profile) {
    const isNotFound = String(studentQuery.error || "").includes("404");

    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(8,145,178,0.12),transparent_35%),linear-gradient(180deg,#f8fafc_0%,#ecfeff_55%,#ffffff_100%)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-xl">
          <p className="text-lg font-semibold text-slate-900">
            {isNotFound ? "Student not found" : "Unable to load student details"}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {isNotFound
              ? "We could not find a student profile for this ID."
              : "Please try again in a moment."}
          </p>
          <Button className="mt-6" onClick={() => navigate("/admin-dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(8,145,178,0.12),transparent_35%),linear-gradient(180deg,#f8fafc_0%,#ecfeff_55%,#ffffff_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Card className="overflow-hidden rounded-[1.75rem] border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-200/70 backdrop-blur">
          <CardHeader className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Student Details
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 text-white shadow-lg">
                  <UserRound className="h-7 w-7" />
                </div>

                <div className="space-y-2">
                  <CardTitle className="text-3xl font-black tracking-tight text-slate-900">
                    {profileName}
                  </CardTitle>
                  <CardDescription className="max-w-2xl text-slate-600">
                    A consolidated view of profile details, test performance, and learning activity.
                  </CardDescription>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <StatusBadge status={profile.activeStatus} />
                <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                  Student ID: {profile.id}
                </Badge>
                <Badge className="bg-cyan-100 text-cyan-800 hover:bg-cyan-100">
                  Class {profile.classLevel ?? "Not set"}
                </Badge>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin-dashboard")}
              className="h-11 rounded-xl border-slate-300 px-5 font-semibold text-slate-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin Dashboard
            </Button>
          </CardHeader>
        </Card>

        <Card className="rounded-[1.75rem] border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/50">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900">Admin Actions</CardTitle>
            <CardDescription className="text-slate-600">
              Manage the student account. Deletion is permanent and cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Button
                type="button"
                onClick={() =>
                  toast({
                    title: "Activate account",
                    description: "Student accounts do not currently have a persistent status column, so this action is informational only.",
                  })
                }
                className="h-11 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Activate Account
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  toast({
                    title: "Suspend account",
                    description: "Student account suspension is not persisted in the current schema.",
                  })
                }
                className="h-11 rounded-xl border-amber-300 text-amber-800 hover:bg-amber-50"
              >
                <Clock3 className="mr-2 h-4 w-4" />
                Deactivate / Suspend
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSendEmail}
                className="h-11 rounded-xl border-slate-300 text-slate-700"
              >
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </Button>
              <Button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="h-11 rounded-xl bg-rose-600 text-white hover:bg-rose-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Permanently Delete
              </Button>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Deletion summary:</span>{" "}
              {actionSummary.testsAttempted} attempts, {actionSummary.totalQuestionsAttempted} questions attempted,{" "}
              {actionSummary.subjectPerformanceCount} subject groups, {actionSummary.recentHistoryCount} recent history rows.
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Tests Attempted"
            value={formatNumber(statistics?.testsAttempted, "0")}
            description="Total test attempts recorded for this student."
            icon={<FileText className="h-5 w-5" />}
            accent="bg-slate-900"
          />
          <StatCard
            title="Average Score"
            value={formatPercent(statistics?.averageScore, "Not available")}
            description="Mean score across available test history."
            icon={<Gauge className="h-5 w-5" />}
            accent="bg-emerald-600"
          />
          <StatCard
            title="Highest Score"
            value={formatPercent(statistics?.highestScore, "Not available")}
            description="Best score achieved in a single test."
            icon={<TrendingUp className="h-5 w-5" />}
            accent="bg-blue-600"
          />
          <StatCard
            title="Lowest Score"
            value={formatPercent(statistics?.lowestScore, "Not available")}
            description="Lowest recorded score in the current history."
            icon={<TrendingDown className="h-5 w-5" />}
            accent="bg-amber-600"
          />
          <StatCard
            title="Questions Attempted"
            value={formatNumber(statistics?.totalQuestionsAttempted, "0")}
            description="Total questions answered across all attempts."
            icon={<BookOpenCheck className="h-5 w-5" />}
            accent="bg-cyan-600"
          />
          <StatCard
            title="Time Spent Learning"
            value={formatDuration(statistics?.timeSpentLearningMinutes, "Pending")}
            description="Currently reserved for future learning-time tracking."
            icon={<TimerReset className="h-5 w-5" />}
            accent="bg-violet-600"
          />
          <StatCard
            title="Learning Streak"
            value={formatNumber(statistics?.currentLearningStreak, "0")}
            description="Consecutive active learning days from available history."
            icon={<Sparkles className="h-5 w-5" />}
            accent="bg-rose-600"
          />
          <StatCard
            title="Active Status"
            value={profile.activeStatus === "active" ? "Active" : "Inactive"}
            description={`Last login: ${formatDateTime(profile.lastLogin)}`}
            icon={<Users2 className="h-5 w-5" />}
            accent="bg-slate-700"
          />
        </div>

        <SectionCard
          title="Profile"
          description="Core student identity and registration details."
          icon={<GraduationCap className="h-5 w-5" />}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <DetailItem label="Full Name" value={profile.fullName || profile.displayName || profile.name || "Not available"} />
            <DetailItem label="Email" value={profile.email || "Not available"} />
            <DetailItem label="Class" value={profile.classLevel !== null && profile.classLevel !== undefined ? String(profile.classLevel) : "Not available"} />
            <DetailItem label="Board" value={profile.board || "Not available"} />
            <DetailItem label="Medium" value={profile.medium || "Not available"} />
            <DetailItem label="School" value={profile.school || "Not available"} />
            <DetailItem label="Country" value={profile.country || "Not available"} />
            <DetailItem label="State" value={profile.state || "Not available"} />
            <DetailItem label="City" value={profile.city || "Not available"} />
            <DetailItem label="Registration Date" value={formatDateTime(profile.createdAt)} />
            <DetailItem label="Last Login" value={formatDateTime(profile.lastLogin)} />
            <DetailItem label="Active Status" value={profile.activeStatus === "active" ? "Active" : "Inactive"} />
          </div>
        </SectionCard>

        <div className="grid gap-6 xl:grid-cols-3">
          <SectionCard
            title="Subject Performance"
            description="Aggregated performance by subject."
            icon={<LineChart className="h-5 w-5" />}
          >
            {subjectPerformance.length === 0 ? (
              <EmptyState
                title="No subject performance yet"
                description="Once the student attempts tests, subject-specific analytics will appear here."
              />
            ) : (
              <div className="overflow-hidden rounded-[1.25rem] border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Avg Score</TableHead>
                      <TableHead>High</TableHead>
                      <TableHead>Low</TableHead>
                      <TableHead>Questions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjectPerformance.map((item) => (
                      <TableRow key={item.subject}>
                        <TableCell className="font-semibold text-slate-900">{item.subject}</TableCell>
                        <TableCell className="text-slate-600">{formatNumber(item.attempts, "0")}</TableCell>
                        <TableCell className="text-slate-600">{formatPercent(item.averageScore)}</TableCell>
                        <TableCell className="text-slate-600">{formatPercent(item.highestScore)}</TableCell>
                        <TableCell className="text-slate-600">{formatPercent(item.lowestScore)}</TableCell>
                        <TableCell className="text-slate-600">{formatNumber(item.totalQuestionsAttempted, "0")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Strong Subjects"
            description="Subjects with the highest average performance."
            icon={<Target className="h-5 w-5" />}
          >
            {strongSubjects.length === 0 ? (
              <EmptyState
                title="No strong-subject insights yet"
                description="We’ll surface top-performing subjects after enough attempts are available."
              />
            ) : (
              <div className="space-y-3">
                {strongSubjects.map((item) => (
                  <div key={item.subject} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900">{item.subject}</p>
                        <p className="text-sm text-slate-600">{formatNumber(item.attempts, "0")} attempts</p>
                      </div>
                      <Badge className={subjectTone(item.subject)}>
                        {formatPercent(item.averageScore)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Weak Subjects"
            description="Subjects that may need extra practice."
            icon={<BookOpenCheck className="h-5 w-5" />}
          >
            {weakSubjects.length === 0 ? (
              <EmptyState
                title="No weak-subject insights yet"
                description="Low-performing subjects will show up here once enough test data exists."
              />
            ) : (
              <div className="space-y-3">
                {weakSubjects.map((item) => (
                  <div key={item.subject} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900">{item.subject}</p>
                        <p className="text-sm text-slate-600">{formatNumber(item.attempts, "0")} attempts</p>
                      </div>
                      <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100">
                        {formatPercent(item.averageScore)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <SectionCard
            title="Recent Test History"
            description="Latest attempts completed by this student."
            icon={<Clock3 className="h-5 w-5" />}
          >
            {recentTestHistory.length === 0 ? (
              <EmptyState
                title="No test history available"
                description="This student has not attempted any tests yet, or the history has not been synced."
              />
            ) : (
              <div className="overflow-hidden rounded-[1.25rem] border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>%</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Correct</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTestHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold text-slate-900">{item.subject}</TableCell>
                        <TableCell className="text-slate-600">{item.mode || "Not available"}</TableCell>
                        <TableCell className="text-slate-600">{item.difficulty || "Not available"}</TableCell>
                        <TableCell className="text-slate-600">
                          {formatNumber(item.score, "0")} / {formatNumber(item.maxScore, "0")}
                        </TableCell>
                        <TableCell className="text-slate-600">{formatPercent(item.percentage)}</TableCell>
                        <TableCell className="text-slate-600">{formatNumber(item.totalQuestions, "0")}</TableCell>
                        <TableCell className="text-slate-600">{formatNumber(item.correctAnswers, "0")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Activity Timeline"
            description="Profile registration and recent test attempts."
            icon={<CalendarClock className="h-5 w-5" />}
          >
            {activityTimeline.length === 0 ? (
              <EmptyState
                title="No activity to display"
                description="Timeline entries will appear here once the student registers or attempts tests."
              />
            ) : (
              <div className="space-y-3">
                {activityTimeline.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                      </div>
                      <Badge
                        className={
                          item.type === "profile"
                            ? "bg-cyan-100 text-cyan-800 hover:bg-cyan-100"
                            : "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                        }
                      >
                        {item.type === "profile" ? "Profile" : "Test Attempt"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{formatDateTime(item.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <Card className="rounded-[1.75rem] border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/50">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900">Summary</CardTitle>
            <CardDescription className="text-slate-600">
              A quick snapshot of the student’s current learning footprint.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Last Login</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{formatDateTime(profile.lastLogin)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Registration Date</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{formatDateTime(profile.createdAt)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Current Streak</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{formatNumber(statistics?.currentLearningStreak, "0")} days</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Learning Time</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{formatDuration(statistics?.timeSpentLearningMinutes, "Pending")}</p>
              </div>
            </div>
            <Separator className="my-6" />
            <p className="text-sm leading-6 text-slate-600">
              The endpoint already returns a stable analytics envelope, so future work can expand the
              time-spent and timeline calculations without changing the page structure.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
