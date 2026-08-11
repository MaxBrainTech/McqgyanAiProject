import { useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Mail,
  Shield,
  Trash2,
  Users,
  Users2,
  UserCheck,
  UserX,
  FileText,
  School,
  Calendar,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DeleteAccountDialog from "@/components/admin/DeleteAccountDialog";
import SendEmailModal from "@/components/admin/SendEmailModal";
import { useToast } from "@/hooks/use-toast";
import { approveTeacher, deleteTeacherAccount, getTeacherDetails, rejectTeacher } from "@/lib/adminApi";

const formatValue = (
  value: string | number | null | undefined,
  fallback = "Not provided",
) => {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
};

const formatDate = (value: string | null | undefined, fallback = "N/A") => {
  if (!value) return fallback;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const getInitials = (name: string) => {
  if (!name) return "T";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

function DetailItem({ label, value }: { label: string; value: string | number | null | undefined }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{formatValue(value, t("not_available"))}</p>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
  accent,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: ReactNode;
  accent: string;
}) {
  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <p className="mt-1.5 text-2xl font-black tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">{description}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent} text-white shadow-sm`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

export default function AdminTeacherDetails() {
  const navigate = useNavigate();
  const { teacherId } = useParams();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const notAvailable = t("not_available");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const teacherQuery = useQuery({
    queryKey: ["admin", "teachers", teacherId],
    queryFn: () => getTeacherDetails(String(teacherId || "")),
    enabled: Boolean(teacherId),
  });

  const activateMutation = useMutation({
    mutationFn: () => approveTeacher(String(teacherId || "")),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast({
        title: "Teacher Activated",
        description: result.message,
      });
    },
    onError: (error) => {
      toast({
        title: "Unable to activate account",
        description: String(error),
        variant: "destructive",
      });
    },
  });

  const suspendMutation = useMutation({
    mutationFn: () => rejectTeacher(String(teacherId || "")),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast({
        title: "Teacher Suspended",
        description: result.message,
      });
    },
    onError: (error) => {
      toast({
        title: "Unable to suspend account",
        description: String(error),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTeacherAccount(String(teacherId || "")),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast({
        title: "Teacher Account Deleted",
        description: result.message,
      });
      setDeleteOpen(false);
      navigate("/admin-dashboard");
    },
    onError: (error) => {
      toast({
        title: "Unable to delete teacher account",
        description: String(error),
        variant: "destructive",
      });
    },
  });

  const teacher = teacherQuery.data?.profile;
  const statistics = teacherQuery.data?.statistics;
  const recentTests = teacherQuery.data?.recentTests ?? [];
  const recentStudentActivity = teacherQuery.data?.recentStudentActivity ?? [];
  const activityTimeline = teacherQuery.data?.activityTimeline ?? [];
  const actionSummary = {
    totalTestsGenerated: statistics?.totalTestsGenerated ?? 0,
    totalQuestionsGenerated: statistics?.totalQuestionsGenerated ?? 0,
    totalStudents: statistics?.totalStudents ?? 0,
    activeStudents: statistics?.activeStudents ?? 0,
    recentTests: recentTests.length,
    recentStudentActivity: recentStudentActivity.length,
  };

  const joinedDate = useMemo(
    () => formatDate(teacher?.createdAt, notAvailable),
    [notAvailable, teacher?.createdAt],
  );

  const handleSendEmail = () => {
    if (!teacher?.email) {
      toast({
        title: "Email not available",
        description: "This teacher record does not have an email address yet.",
        variant: "destructive",
      });
      return;
    }

    setEmailModalOpen(true);
  };

  if (!teacherId || teacherQuery.isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/60 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600" />
          <p className="mt-3 text-sm font-semibold text-slate-600">Loading teacher profile...</p>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen bg-slate-50/60 p-6 sm:p-10">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <GraduationCap className="mx-auto h-12 w-12 text-slate-400" />
          <h2 className="mt-4 text-xl font-bold text-slate-900">Teacher Not Found</h2>
          <p className="mt-1 text-sm text-slate-600">The requested teacher account could not be found.</p>
          <Button className="mt-6 rounded-xl bg-slate-900" onClick={() => navigate("/admin-dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const displayName = teacher.fullName || teacher.username;

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Top Bar */}
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
              ID: {teacher.id}
            </Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 space-y-6">
        {/* Profile Hero Header Card */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-xl sm:p-8">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-600 font-black text-white text-2xl shadow-lg shadow-blue-500/20">
                {getInitials(displayName)}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{displayName}</h1>
                  <Badge className={teacher.approved ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30"}>
                    {teacher.approved ? "Approved" : "Pending Approval"}
                  </Badge>
                  <Badge className={teacher.verified ? "bg-blue-500/20 text-blue-300 border-blue-500/30" : "bg-slate-500/20 text-slate-300 border-slate-500/30"}>
                    {teacher.verified ? "Email Verified" : "Unverified"}
                  </Badge>
                </div>
                <p className="text-sm font-mono text-slate-300">{teacher.email}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <School className="h-3.5 w-3.5 text-slate-400" />
                    {teacher.school || "School Not set"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    Joined {joinedDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 sm:self-start">
              <Button
                type="button"
                onClick={handleSendEmail}
                className="h-10 rounded-xl bg-blue-600 font-semibold text-white hover:bg-blue-700 text-xs shadow-sm"
              >
                <Mail className="mr-1.5 h-4 w-4" />
                Send Email
              </Button>
              {!teacher.approved ? (
                <Button
                  type="button"
                  onClick={() => activateMutation.mutate()}
                  disabled={activateMutation.isPending}
                  className="h-10 rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-700 text-xs shadow-sm"
                >
                  <UserCheck className="mr-1.5 h-4 w-4" />
                  Approve Teacher
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => suspendMutation.mutate()}
                  disabled={suspendMutation.isPending}
                  className="h-10 rounded-xl border-amber-500/30 bg-amber-500/10 font-semibold text-amber-200 hover:bg-amber-500/20 text-xs"
                >
                  <UserX className="mr-1.5 h-4 w-4" />
                  Suspend Access
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteOpen(true)}
                className="h-10 rounded-xl border-rose-500/30 bg-rose-500/10 font-semibold text-rose-200 hover:bg-rose-500/20 text-xs"
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Tests Generated"
            value={actionSummary.totalTestsGenerated}
            description="Custom MCQ test sets created"
            icon={<BookOpenCheck className="h-5 w-5" />}
            accent="bg-violet-600"
          />
          <StatCard
            title="Questions Created"
            value={actionSummary.totalQuestionsGenerated}
            description="Total question items authored"
            icon={<Shield className="h-5 w-5" />}
            accent="bg-indigo-600"
          />
          <StatCard
            title="Total Students"
            value={actionSummary.totalStudents}
            description="Students enrolled under teacher"
            icon={<Users className="h-5 w-5" />}
            accent="bg-blue-600"
          />
          <StatCard
            title="Active Students"
            value={actionSummary.activeStudents}
            description="Engaged in recent tests"
            icon={<Users2 className="h-5 w-5" />}
            accent="bg-emerald-600"
          />
        </div>

        {/* Profile Details & Metadata */}
        <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-5">
            <CardTitle className="text-base font-bold text-slate-900">
              Teacher Profile Details
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Verified teacher metadata and system credentials.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem label="Full Name" value={teacher.fullName} />
            <DetailItem label="Username" value={teacher.username} />
            <DetailItem label="Email Address" value={teacher.email} />
            <DetailItem label="School / Institution" value={teacher.school} />
            <DetailItem label="Qualification" value={teacher.qualification} />
            <DetailItem label="Subjects Taught" value={teacher.subjects} />
            <DetailItem label="Teaching Experience" value={teacher.experience} />
            <DetailItem label="Board / Curriculum" value={teacher.board} />
            <DetailItem label="Country" value={teacher.country} />
          </CardContent>
        </Card>

        {/* Tests & Activity Grid */}
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Recent Tests Created */}
          <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-5">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-violet-600" />
                Recent Tests Generated
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Latest test papers generated by this teacher.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              {recentTests.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center text-xs text-slate-500">
                  No custom tests created by this teacher yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTests.map((test) => (
                    <div key={test.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{test.title}</p>
                        <p className="text-xs text-slate-500 truncate">{test.subject} • Class {test.classLevel} • {test.totalQuestions} Qs</p>
                      </div>
                      <Badge variant="outline" className="shrink-0 rounded-lg border-slate-200 bg-white font-mono text-[10px] text-slate-600">
                        {test.createdAt}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-5">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-blue-600" />
                Activity Timeline
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Combined history of test creation and student engagement.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              {activityTimeline.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center text-xs text-slate-500">
                  No recorded activity entries for this teacher.
                </div>
              ) : (
                <div className="space-y-3">
                  {activityTimeline.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm">{item.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                        <p className="text-[10px] font-mono text-slate-400 mt-1">{item.createdAt}</p>
                      </div>
                      <Badge className={item.type === "test" ? "bg-violet-50 text-violet-700 border-violet-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}>
                        {item.type === "test" ? "Test" : "Student"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <DeleteAccountDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Teacher Account Permanently?"
        description="This removes the teacher profile and all safely linked test data from PostgreSQL."
        summaryItems={[
          { label: "Teacher", value: displayName },
          { label: "Email", value: teacher.email },
          { label: "Tests to remove", value: String(actionSummary.totalTestsGenerated) },
          { label: "Questions to remove", value: String(actionSummary.totalQuestionsGenerated) },
        ]}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />

      <SendEmailModal
        open={emailModalOpen}
        onOpenChange={setEmailModalOpen}
        recipientType="teacher"
        recipientId={String(teacherId)}
        recipientName={displayName}
        recipientEmail={teacher.email || ""}
      />
    </div>
  );
}
