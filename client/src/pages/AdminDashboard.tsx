import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  CheckCircle2,
  Clock3,
  GraduationCap,
  LayoutDashboard,
  Search,
  Shield,
  Sparkles,
  Users,
  Users2,
  BookOpenCheck,
  XCircle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { fetchAdminSession, logoutAdmin, type AdminSession } from "@/lib/adminAuth";
import {
  approveTeacher,
  getAdminDashboard,
  getAllStudents,
  getAllTeachers,
  rejectTeacher,
  type AdminDashboardStats,
  type AdminStudent,
  type AdminTeacher,
} from "@/lib/adminApi";
import AdminAnalytics from "@/pages/AdminAnalytics";

const DASHBOARD_QUERY_KEY = ["admin", "dashboard"];
const TEACHERS_QUERY_KEY = ["admin", "teachers", "all"];
const STUDENTS_QUERY_KEY = ["admin", "students", "all"];

const formatDate = (value: string | null, fallback = "") => {
  if (!value) return fallback;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const matchesSearch = (value: string | number | null | undefined, search: string) => {
  if (!search.trim()) return true;
  return String(value ?? "").toLowerCase().includes(search.trim().toLowerCase());
};

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
    <Card className="group relative overflow-hidden rounded-[1.75rem] border-slate-200/80 bg-white/90 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_45%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-slate-500">
              {title}
            </p>
            <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              {value}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </div>

          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent} text-white shadow-lg ring-1 ring-white/60`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({
  value,
  variant,
}: {
  value: string;
  variant: "green" | "amber" | "slate" | "rose" | "blue";
}) {
  const className =
    variant === "green"
      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
      : variant === "amber"
        ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
        : variant === "rose"
          ? "bg-rose-100 text-rose-800 hover:bg-rose-100"
          : variant === "blue"
            ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
            : "bg-slate-100 text-slate-700 hover:bg-slate-100";

  return <Badge className={className}>{value}</Badge>;
}

function TeacherTable({
  teachers,
  search,
  onSearchChange,
  onApprove,
  onReject,
  onViewDetails,
  isMutating,
}: {
  teachers: AdminTeacher[];
  search: string;
  onSearchChange: (value: string) => void;
  onApprove: (teacherId: string) => void;
  onReject: (teacherId: string) => void;
  onViewDetails: (teacherId: string) => void;
  isMutating: boolean;
}) {
  const filteredTeachers = useMemo(
    () =>
      teachers.filter((teacher) =>
        [
          teacher.fullName,
          teacher.username,
          teacher.email,
          teacher.school,
          teacher.approved ? "approved" : "pending",
          teacher.verified ? "verified" : "unverified",
        ].some((value) => matchesSearch(value, search)),
      ),
    [search, teachers],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-slate-500">
            Teachers
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Search across the full teacher directory.
          </p>
        </div>

        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search teachers..."
            className="h-11 rounded-2xl border-slate-200 bg-white pl-9 shadow-sm"
          />
        </div>
      </div>

      {filteredTeachers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/90 px-6 py-10 text-center text-sm text-slate-600 shadow-sm">
          No teachers match your search.
        </div>
      ) : (
        <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/95 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Approval Status</TableHead>
                <TableHead>Verification Status</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead className="text-right">View Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.map((teacher) => (
                <TableRow key={teacher.id} className="transition-colors hover:bg-slate-50/70">
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-950">{teacher.fullName || teacher.username}</p>
                      <p className="text-xs text-slate-500">@{teacher.username}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">{teacher.email}</TableCell>
                  <TableCell className="text-slate-600">{teacher.school || "Not provided"}</TableCell>
                  <TableCell>
                    <StatusBadge
                      value={teacher.approved ? "Approved" : "Pending"}
                      variant={teacher.approved ? "green" : "amber"}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      value={teacher.verified ? "Verified" : "Unverified"}
                      variant={teacher.verified ? "blue" : "slate"}
                    />
                  </TableCell>
                  <TableCell className="text-slate-600">{formatDate(teacher.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col items-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onViewDetails(teacher.id)}
                        className="rounded-xl border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                      >
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => onApprove(teacher.id)}
                          disabled={isMutating || teacher.approved}
                          className="rounded-xl bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onReject(teacher.id)}
                          disabled={isMutating}
                          className="rounded-xl border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function StudentTable({
  students,
  search,
  onSearchChange,
  onViewDetails,
}: {
  students: AdminStudent[];
  search: string;
  onSearchChange: (value: string) => void;
  onViewDetails: (studentId: string) => void;
}) {
  const filteredStudents = useMemo(
    () =>
      students.filter((student) =>
        [
          student.name,
          student.email,
          student.classLevel ?? "",
          student.board,
        ].some((value) => matchesSearch(value, search)),
      ),
    [search, students],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-slate-500">
            Students
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Search across registered student profiles.
          </p>
        </div>

        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search students..."
            className="h-11 rounded-2xl border-slate-200 bg-white pl-9 shadow-sm"
          />
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/90 px-6 py-10 text-center text-sm text-slate-600 shadow-sm">
          No students match your search.
        </div>
      ) : (
        <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/95 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Board</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead className="text-right">View Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id} className="transition-colors hover:bg-slate-50/70">
                  <TableCell className="font-semibold text-slate-950">
                    {student.name}
                  </TableCell>
                  <TableCell className="text-slate-600">{student.email}</TableCell>
                  <TableCell className="text-slate-600">
                    {student.classLevel ?? "Not set"}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {student.board || "Not provided"}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {formatDate(student.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onViewDetails(student.id)}
                        className="rounded-xl border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                      >
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const currentSession = await fetchAdminSession();

        if (cancelled) return;

        if (!currentSession) {
          navigate("/admin-login", { replace: true });
          return;
        }

        setSession(currentSession);
      } catch {
        if (!cancelled) {
          navigate("/admin-login", { replace: true });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const dashboardQuery = useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: getAdminDashboard,
  });

  const teachersQuery = useQuery({
    queryKey: TEACHERS_QUERY_KEY,
    queryFn: getAllTeachers,
  });

  const studentsQuery = useQuery({
    queryKey: STUDENTS_QUERY_KEY,
    queryFn: getAllStudents,
  });

  useEffect(() => {
    const errors = [dashboardQuery.error, teachersQuery.error, studentsQuery.error].filter(Boolean);
    const hasUnauthorized = errors.some((error) => String(error).startsWith("401:") || String(error).includes("401:"));

    if (hasUnauthorized) {
      navigate("/admin-login", { replace: true });
    }
  }, [dashboardQuery.error, navigate, studentsQuery.error, teachersQuery.error]);

  const refreshData = async () => {
    await queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    await queryClient.invalidateQueries({ queryKey: TEACHERS_QUERY_KEY });
    await queryClient.invalidateQueries({ queryKey: STUDENTS_QUERY_KEY });
  };

  const approveMutation = useMutation({
    mutationFn: approveTeacher,
    onSuccess: async () => {
      toast({
        title: "Teacher approved",
        description: "The teacher can now access the dashboard.",
      });
      await refreshData();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Approval failed",
        description: error.message || "Could not approve teacher.",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectTeacher,
    onSuccess: async () => {
      toast({
        title: "Teacher rejected",
        description: "The approval flag has been cleared.",
      });
      await refreshData();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Rejection failed",
        description: error.message || "Could not reject teacher.",
      });
    },
  });

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logoutAdmin();
      toast({
        title: t("admin_dashboard_logged_out"),
        description: t("admin_dashboard_cleared"),
      });
      navigate("/admin-login", { replace: true });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("admin_dashboard_logout_failed"),
        description: error.message || t("admin_dashboard_logout_error"),
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const dashboard = dashboardQuery.data;
  const teachers = teachersQuery.data?.teachers ?? [];
  const students = studentsQuery.data?.students ?? [];
  const stats: AdminDashboardStats | undefined = dashboard;

  const isLoading = dashboardQuery.isLoading || teachersQuery.isLoading || studentsQuery.isLoading;
  const isMutating = approveMutation.isPending || rejectMutation.isPending || isLoggingOut;

  const handleViewTeacher = (teacherId: string) => navigate(`/admin/teachers/${teacherId}`);
  const handleViewStudent = (studentId: string) => navigate(`/admin/students/${studentId}`);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_44%,#ffffff_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[linear-gradient(180deg,rgba(15,23,42,0.08),transparent)] opacity-40" />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
          <Card className="relative overflow-hidden rounded-[2rem] border-slate-200/80 bg-slate-950 text-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.35),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.18),transparent_28%)]" />
            <CardHeader className="relative gap-6 p-7 sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.34em] text-white/85">
                  <Shield className="h-3.5 w-3.5" />
                  Admin Control Center
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Live data
                </div>
              </div>

              <div className="space-y-4">
                <CardTitle className="max-w-3xl text-3xl font-black tracking-tight text-white sm:text-4xl">
                  {t("admin_dashboard_summary")}
                </CardTitle>
                <CardDescription className="max-w-2xl text-base leading-7 text-slate-300">
                  {t("admin_dashboard_desc")}
                </CardDescription>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-400">
                    Signed in
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {session?.email || "Loading..."}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-400">
                    Approval flow
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    Teachers, students, analytics
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-400">
                    Status
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    Secure admin session
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <Button
                  type="button"
                  onClick={refreshData}
                  className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-black/10 hover:bg-slate-100"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh data
                </Button>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                  <Sparkles className="h-4 w-4 text-emerald-300" />
                  Premium admin workspace
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="overflow-hidden rounded-[2rem] border-slate-200/80 bg-white/85 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Session
                  </p>
                  <CardTitle className="mt-2 text-xl font-bold text-slate-950">
                    Admin presence
                  </CardTitle>
                </div>
                <div className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-slate-950/20">
                  Protected
                </div>
              </div>
              <CardDescription className="text-slate-600">
                A premium overview of access, approvals, and platform health.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/90 p-4">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Session owner
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {session?.email || "loading..."}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 to-slate-800 p-4 text-white">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-white/60">
                  Management scope
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Approvals, analytics, and account operations now sit in a single polished workspace.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="h-11 w-full rounded-2xl border-slate-300 bg-white font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
              >
                <XCircle className="mr-2 h-4 w-4" />
                {isLoggingOut ? t("logging_out") : t("admin_dashboard_logout")}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="Total Teachers"
            value={stats?.totalTeachers ?? (isLoading ? "..." : 0)}
            description="All teachers in the system."
            icon={<GraduationCap className="h-5 w-5" />}
            accent="bg-slate-900"
          />
          <StatCard
            title="Approved Teachers"
            value={stats?.approvedTeachers ?? (isLoading ? "..." : 0)}
            description="Teachers who can access the dashboard."
            icon={<CheckCircle2 className="h-5 w-5" />}
            accent="bg-emerald-600"
          />
          <StatCard
            title="Pending Teachers"
            value={stats?.pendingTeachers ?? (isLoading ? "..." : 0)}
            description="Verified teachers waiting for approval."
            icon={<Clock3 className="h-5 w-5" />}
            accent="bg-amber-600"
          />
          <StatCard
            title="Total Students"
            value={stats?.totalStudents ?? (isLoading ? "..." : 0)}
            description="Registered student profiles."
            icon={<Users className="h-5 w-5" />}
            accent="bg-blue-600"
          />
          <StatCard
            title="Active Students"
            value={stats?.activeStudents ?? (isLoading ? "..." : 0)}
            description="Distinct students active in the last 30 days."
            icon={<Users2 className="h-5 w-5" />}
            accent="bg-cyan-600"
          />
          <StatCard
            title="Total Tests Generated"
            value={stats?.totalTestsGenerated ?? (isLoading ? "..." : 0)}
            description="Custom tests created by teachers."
            icon={<BookOpenCheck className="h-5 w-5" />}
            accent="bg-violet-600"
          />
        </div>

        <Card className="rounded-[2rem] border-slate-200/80 bg-white/88 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-slate-500">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Workspace
                </div>
                <CardTitle className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                  Admin controls
                </CardTitle>
                <CardDescription className="mt-2 max-w-2xl text-slate-600">
                  Session owner: {session?.email || "loading..."}
                </CardDescription>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 shadow-sm">
                Teacher approval actions remain available from the Teachers tab.
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="sticky top-4 z-10 grid h-auto w-full grid-cols-4 rounded-[1.25rem] border border-slate-200/70 bg-white/90 p-1 shadow-lg shadow-slate-200/60 backdrop-blur">
                <TabsTrigger value="overview" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-slate-950 data-[state=active]:text-white">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="teachers" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-slate-950 data-[state=active]:text-white">
                  Teachers
                </TabsTrigger>
                <TabsTrigger value="students" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-slate-950 data-[state=active]:text-white">
                  Students
                </TabsTrigger>
                <TabsTrigger value="analytics" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-slate-950 data-[state=active]:text-white">
                  Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-6">
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card className="rounded-[1.75rem] border-slate-200/80 bg-gradient-to-br from-white to-slate-50 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
                    <CardHeader>
                      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-slate-500">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                        Overview
                      </div>
                      <CardTitle className="text-lg font-bold text-slate-950">
                        Overview summary
                      </CardTitle>
                      <CardDescription className="text-slate-600">
                        Live counts from the existing teacher and student tables.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Teachers</p>
                        <p className="mt-2 text-2xl font-black text-slate-900">{stats?.totalTeachers ?? 0}</p>
                        <p className="text-sm text-slate-600">Total</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Approved</p>
                        <p className="mt-2 text-2xl font-black text-slate-900">{stats?.approvedTeachers ?? 0}</p>
                        <p className="text-sm text-slate-600">Teachers</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Pending</p>
                        <p className="mt-2 text-2xl font-black text-slate-900">{stats?.pendingTeachers ?? 0}</p>
                        <p className="text-sm text-slate-600">Teachers</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Students</p>
                        <p className="mt-2 text-2xl font-black text-slate-900">{stats?.totalStudents ?? 0}</p>
                        <p className="text-sm text-slate-600">Registered</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Active</p>
                        <p className="mt-2 text-2xl font-black text-slate-900">{stats?.activeStudents ?? 0}</p>
                        <p className="text-sm text-slate-600">Students</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Tests</p>
                        <p className="mt-2 text-2xl font-black text-slate-900">{stats?.totalTestsGenerated ?? 0}</p>
                        <p className="text-sm text-slate-600">Generated</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[1.75rem] border-slate-200/80 bg-gradient-to-br from-slate-950 to-slate-800 text-white shadow-[0_18px_60px_rgba(15,23,42,0.12)]">
                    <CardHeader>
                      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-slate-300">
                        <Shield className="h-3.5 w-3.5 text-cyan-300" />
                        Session
                      </div>
                      <CardTitle className="text-lg font-bold text-white">
                        Session status
                      </CardTitle>
                      <CardDescription className="text-slate-300">
                        Protected by the admin session cookie.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                          Signed in as
                        </p>
                        <p className="mt-2 text-lg font-bold text-white">
                          {session?.email || "Loading..."}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                          Teacher approvals
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-200">
                          Approval and rejection actions still use the existing workflow, now surfaced from the management table.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="teachers" className="mt-6">
                <TeacherTable
                  teachers={teachers}
                  search={teacherSearch}
                  onSearchChange={setTeacherSearch}
                  onApprove={(teacherId) => approveMutation.mutate(teacherId)}
                  onReject={(teacherId) => rejectMutation.mutate(teacherId)}
                  onViewDetails={handleViewTeacher}
                  isMutating={isMutating}
                />
              </TabsContent>

              <TabsContent value="students" className="mt-6">
                <StudentTable
                  students={students}
                  search={studentSearch}
                  onSearchChange={setStudentSearch}
                  onViewDetails={handleViewStudent}
                />
              </TabsContent>

              <TabsContent value="analytics" className="mt-6">
                <AdminAnalytics />
              </TabsContent>
            </Tabs>

            <Separator className="my-6" />

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-sm text-slate-600 shadow-sm">
              Teacher approvals stay available in the Teachers tab, and the new detail routes are placeholders for the next phase.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
