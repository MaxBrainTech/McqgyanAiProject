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
  UserRound,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DeleteAccountDialog from "@/components/admin/DeleteAccountDialog";
import { useToast } from "@/hooks/use-toast";
import { approveTeacher, deleteTeacherAccount, getTeacherDetails, rejectTeacher } from "@/lib/adminApi";

const formatValue = (
  value: string | number | null | undefined,
  fallback = "",
) => {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
};

const formatDate = (value: string | null | undefined, fallback = "") => {
  if (!value) return fallback;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const openMailClient = (email: string, subject: string, body: string) => {
  const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
};

function DetailItem({ label, value }: { label: string; value: string | number | null | undefined }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-900">{formatValue(value, t("not_available"))}</p>
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
    <Card className="overflow-hidden rounded-[1.5rem] border-slate-200/80 bg-white/95 shadow-lg shadow-slate-200/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              {title}
            </p>
            <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
              {value}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent} text-white shadow-lg`}>
            {icon}
          </div>
        </div>
      </CardContent>
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
        title: "Teacher activated",
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
        title: "Teacher suspended",
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
        title: "Teacher account deleted",
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

    openMailClient(
      teacher.email,
      `Message for ${teacher.fullName || teacher.username}`,
      `Hello ${teacher.fullName || teacher.username},\n\n`,
    );
  };

  if (!teacherId) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_55%,#ffffff_100%)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-xl">
          <p className="text-lg font-semibold text-slate-900">{t("teacher_not_found")}</p>
          <p className="mt-2 text-sm text-slate-600">{t("teacher_not_available")}</p>
          <Button className="mt-6" onClick={() => navigate("/admin-dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("back_to_admin_dashboard")}
          </Button>
        </div>
      </div>
    );
  }

  if (teacherQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-medium text-slate-600 shadow-lg shadow-slate-200/60">
          {t("loading_teacher_details")}
        </div>
      </div>
    );
  }

  if (teacherQuery.error || !teacher) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_55%,#ffffff_100%)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-xl">
          <p className="text-lg font-semibold text-slate-900">{t("teacher_not_available")}</p>
          <p className="mt-2 text-sm text-slate-600">
            {String(teacherQuery.error || "").includes("404")
              ? t("teacher_not_found")
              : t("teacher_not_available")}
          </p>
          <Button className="mt-6" onClick={() => navigate("/admin-dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("back_to_admin_dashboard")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_55%,#ffffff_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Card className="overflow-hidden rounded-[1.75rem] border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-200/70">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">
                <Shield className="h-3.5 w-3.5" />
                {t("teacher_details")}
              </div>
              <CardTitle className="text-3xl font-black tracking-tight text-slate-900">
                {teacher.fullName || teacher.username}
              </CardTitle>
              <CardDescription className="max-w-2xl text-slate-600">
                {t("detailed_teacher_profile")}
              </CardDescription>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin-dashboard")}
              className="h-11 rounded-xl border-slate-300 px-5 font-semibold text-slate-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("back_to_admin_dashboard")}
            </Button>
          </CardHeader>
        </Card>

        <Card className="rounded-[1.75rem] border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/50">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900">Admin Actions</CardTitle>
            <CardDescription className="text-slate-600">
              Manage the teacher account and safely remove related records when needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Button
                type="button"
                onClick={() => activateMutation.mutate()}
                disabled={activateMutation.isPending}
                className="h-11 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Activate Account
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => suspendMutation.mutate()}
                disabled={suspendMutation.isPending}
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
              {actionSummary.totalTestsGenerated} tests, {actionSummary.totalQuestionsGenerated} questions,{" "}
              {actionSummary.totalStudents} students, {actionSummary.recentStudentActivity} recent activity rows.
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="Total Tests Generated"
            value={statistics?.totalTestsGenerated ?? 0}
            description="All tests created by this teacher."
            icon={<BookOpenCheck className="h-5 w-5" />}
            accent="bg-slate-900"
          />
          <StatCard
            title="Published Tests"
            value={statistics?.publishedTests ?? 0}
            description="Tests already published."
            icon={<CheckCircle2 className="h-5 w-5" />}
            accent="bg-emerald-600"
          />
          <StatCard
            title="Draft Tests"
            value={statistics?.draftTests ?? 0}
            description="Tests still in draft state."
            icon={<Clock3 className="h-5 w-5" />}
            accent="bg-amber-600"
          />
          <StatCard
            title="Total Questions"
            value={statistics?.totalQuestionsGenerated ?? 0}
            description="Questions generated across all tests."
            icon={<GraduationCap className="h-5 w-5" />}
            accent="bg-blue-600"
          />
          <StatCard
            title="Total Students"
            value={statistics?.totalStudents ?? 0}
            description="Distinct students who attempted tests."
            icon={<Users className="h-5 w-5" />}
            accent="bg-cyan-600"
          />
          <StatCard
            title="Active Students"
            value={statistics?.activeStudents ?? 0}
            description="Students active in the last 30 days."
            icon={<Users2 className="h-5 w-5" />}
            accent="bg-violet-600"
          />
          <StatCard
            title="Average Score"
            value={statistics?.averageStudentScore !== null && statistics?.averageStudentScore !== undefined ? `${statistics.averageStudentScore}%` : notAvailable}
            description="Average score across student attempts."
            icon={<CheckCircle2 className="h-5 w-5" />}
            accent="bg-rose-600"
          />
        </div>

        <Card className="rounded-[1.75rem] border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/50">
          <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900">
              Profile Information
              </CardTitle>
              <CardDescription className="text-slate-600">
              Requested profile fields are shown where available and marked as not available otherwise.
              </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <DetailItem label="Full Name" value={teacher.fullName} />
              <DetailItem label="Email" value={teacher.email} />
              <DetailItem label="School" value={teacher.school} />
              <DetailItem label="Qualification" value={teacher.qualification} />
              <DetailItem label="Subjects" value={teacher.subjects} />
              <DetailItem label="Experience" value={teacher.experience} />
              <DetailItem label="Board" value={teacher.board} />
              <DetailItem label="Country" value={teacher.country} />
              <DetailItem label="State" value={teacher.state} />
              <DetailItem label="City" value={teacher.city} />
              <DetailItem label="Joined Date" value={joinedDate} />
              <DetailItem label="Last Login" value={teacher.lastLogin} />
            </div>

            <Separator className="my-6" />

            <div className="flex flex-wrap gap-3">
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                Verification Status: {teacher.verified ? "Verified" : "Unverified"}
              </Badge>
              <Badge className={teacher.approved ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : "bg-amber-100 text-amber-800 hover:bg-amber-100"}>
                Approval Status: {teacher.approved ? "Approved" : "Pending"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="rounded-[1.75rem] border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/50 xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900">
                Recent Tests
              </CardTitle>
              <CardDescription className="text-slate-600">
                Latest tests created by this teacher.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentTests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-600">
                  No recent tests available.
                </div>
              ) : (
                <div className="overflow-hidden rounded-[1.25rem] border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Questions</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentTests.map((test) => (
                        <TableRow key={test.id}>
                          <TableCell className="font-medium text-slate-900">{test.title}</TableCell>
                          <TableCell className="text-slate-600">{test.subject}</TableCell>
                          <TableCell className="text-slate-600">{test.classLevel ?? "Not set"}</TableCell>
                          <TableCell className="text-slate-600">{test.status}</TableCell>
                          <TableCell className="text-slate-600">{test.totalQuestions}</TableCell>
                          <TableCell className="text-slate-600">{formatDate(test.createdAt, notAvailable)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/50">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900">
                Recent Student Activity
              </CardTitle>
              <CardDescription className="text-slate-600">
                Latest submissions tied to this teacher's tests.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentStudentActivity.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-600">
                  No recent student activity.
                </div>
              ) : (
                recentStudentActivity.map((activity) => (
                  <div key={activity.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{activity.studentName}</p>
                        <p className="text-sm text-slate-600">{activity.testTitle}</p>
                      </div>
                      <Badge className="bg-slate-900 text-white hover:bg-slate-900">
                        {activity.score}/{activity.totalQuestions}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {formatDate(activity.createdAt, notAvailable)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-[1.75rem] border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/50">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900">
              Teacher Activity Timeline
            </CardTitle>
            <CardDescription className="text-slate-600">
              A combined timeline of test creation and student activity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activityTimeline.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-600">
                No activity to display yet.
              </div>
            ) : (
              <div className="space-y-3">
                {activityTimeline.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        <p className="text-sm text-slate-600">{item.description}</p>
                      </div>
                      <Badge className={item.type === "test" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" : "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"}>
                        {item.type === "test" ? "Test" : "Student Activity"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{formatDate(item.createdAt, notAvailable)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DeleteAccountDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete teacher account permanently?"
        description="This removes the teacher profile and all safely linked test data."
        summaryItems={[
          { label: "Teacher", value: teacher.fullName || teacher.username },
          { label: "Email", value: teacher.email },
          { label: "Tests to remove", value: String(actionSummary.totalTestsGenerated) },
          { label: "Questions to remove", value: String(actionSummary.totalQuestionsGenerated) },
          { label: "Submissions to remove", value: String(actionSummary.recentStudentActivity) },
        ]}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
