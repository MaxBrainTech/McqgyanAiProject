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
  X,
  UserCheck,
  UserX,
  Eye,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
const ITEMS_PER_PAGE = 10;

const formatDate = (value: string | null, fallback = "N/A") => {
  if (!value) return fallback;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const getInitials = (name: string) => {
  if (!name) return "A";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
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
    <Card className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/90 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
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

          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${accent} text-white shadow-lg ring-1 ring-white/60`}>
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
  const styles = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    amber: "bg-amber-50 text-amber-700 border-amber-200/80",
    rose: "bg-rose-50 text-rose-700 border-rose-200/80",
    blue: "bg-blue-50 text-blue-700 border-blue-200/80",
    slate: "bg-slate-50 text-slate-700 border-slate-200/80",
  }[variant];

  const dotStyles = {
    green: "bg-emerald-500",
    amber: "bg-amber-500 animate-pulse",
    rose: "bg-rose-500",
    blue: "bg-blue-500",
    slate: "bg-slate-400",
  }[variant];

  return (
    <Badge className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${styles} hover:${styles}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles}`} />
      {value}
    </Badge>
  );
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
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved">("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      const matchesFilter =
        filterStatus === "all"
          ? true
          : filterStatus === "pending"
            ? !teacher.approved
            : teacher.approved;

      const matchesText = [
        teacher.fullName,
        teacher.username,
        teacher.email,
        teacher.school,
        teacher.approved ? "approved" : "pending",
        teacher.verified ? "verified" : "unverified",
      ].some((value) => matchesSearch(value, search));

      return matchesFilter && matchesText;
    });
  }, [filterStatus, search, teachers]);

  const totalPages = Math.ceil(filteredTeachers.length / ITEMS_PER_PAGE) || 1;
  const paginatedTeachers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTeachers.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, filteredTeachers]);

  const pendingCount = useMemo(() => teachers.filter((t) => !t.approved).length, [teachers]);
  const approvedCount = useMemo(() => teachers.filter((t) => t.approved).length, [teachers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus]);

  return (
    <div className="space-y-4">
      {/* Control bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filterStatus === "all"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All ({teachers.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("pending")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filterStatus === "pending"
                ? "bg-amber-500 text-white shadow-xs"
                : "text-amber-700 hover:bg-amber-100/60"
            }`}
          >
            <Clock3 className="h-3.5 w-3.5" />
            Pending ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("approved")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filterStatus === "approved"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-emerald-700 hover:bg-emerald-100/60"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approved ({approvedCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search name, email, school..."
            className="h-10 rounded-xl border-slate-200 bg-slate-50/50 pl-9 pr-8 text-sm focus-visible:bg-white focus-visible:ring-blue-500"
          />
          {search ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Table Card */}
      {filteredTeachers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-200/80 text-slate-500">
            <UserX className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-900">No teachers match criteria</h3>
          <p className="mt-1 text-xs text-slate-500">
            {search ? `No teacher records match "${search}".` : "No teacher accounts in this view."}
          </p>
          {search ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSearchChange("")}
              className="mt-4 rounded-xl border-slate-300 text-xs"
            >
              Clear Search
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-slate-200/80 hover:bg-transparent">
                <TableHead className="font-semibold text-slate-700">Teacher</TableHead>
                <TableHead className="font-semibold text-slate-700">School</TableHead>
                <TableHead className="font-semibold text-slate-700">Approval</TableHead>
                <TableHead className="font-semibold text-slate-700">Email Verification</TableHead>
                <TableHead className="font-semibold text-slate-700">Joined</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTeachers.map((teacher) => {
                const displayName = teacher.fullName || teacher.username;
                return (
                  <TableRow key={teacher.id} className="border-slate-100 transition-colors hover:bg-slate-50/70">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700 text-xs">
                          {getInitials(displayName)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate">{displayName}</p>
                          <p className="text-xs font-mono text-slate-500 truncate">{teacher.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-700 text-xs">
                      {teacher.school || <span className="italic text-slate-400">Not provided</span>}
                    </TableCell>
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
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(teacher.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onViewDetails(teacher.id)}
                          className="h-8 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          View
                        </Button>
                        {!teacher.approved ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => onApprove(teacher.id)}
                            disabled={isMutating}
                            className="h-8 rounded-xl bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
                          >
                            <UserCheck className="mr-1 h-3.5 w-3.5" />
                            Approve
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => onReject(teacher.id)}
                            disabled={isMutating}
                            className="h-8 rounded-xl border-amber-300 text-xs font-semibold text-amber-800 hover:bg-amber-50"
                          >
                            Suspend
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-xs text-slate-500">
              <p>
                Showing <span className="font-semibold text-slate-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
                <span className="font-semibold text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredTeachers.length)}</span> of{" "}
                <span className="font-semibold text-slate-900">{filteredTeachers.length}</span> teachers
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-7 w-7 p-0 rounded-lg border-slate-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-2 font-mono font-semibold text-slate-700">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-7 w-7 p-0 rounded-lg border-slate-200"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
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
  const [currentPage, setCurrentPage] = useState(1);

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

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, filteredStudents]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Student Directory ({students.length} Total)
          </p>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search name, email, class, board..."
            className="h-10 rounded-xl border-slate-200 bg-slate-50/50 pl-9 pr-8 text-sm focus-visible:bg-white focus-visible:ring-blue-500"
          />
          {search ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Table Card */}
      {filteredStudents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-200/80 text-slate-500">
            <UserX className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-900">No students found</h3>
          <p className="mt-1 text-xs text-slate-500">
            {search ? `No student records match "${search}".` : "No registered student accounts in database."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-slate-200/80 hover:bg-transparent">
                <TableHead className="font-semibold text-slate-700">Student</TableHead>
                <TableHead className="font-semibold text-slate-700">Class</TableHead>
                <TableHead className="font-semibold text-slate-700">Board</TableHead>
                <TableHead className="font-semibold text-slate-700">Registration Date</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStudents.map((student) => (
                <TableRow key={student.id} className="border-slate-100 transition-colors hover:bg-slate-50/70">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-100 font-bold text-cyan-800 text-xs">
                        {getInitials(student.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{student.name}</p>
                        <p className="text-xs font-mono text-slate-500 truncate">{student.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-cyan-50 text-cyan-800 border-cyan-200/80 font-medium text-xs">
                      Class {student.classLevel ?? "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-700">
                    {student.board || <span className="italic text-slate-400">Not set</span>}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(student.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onViewDetails(student.id)}
                        className="h-8 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        View Profile
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-xs text-slate-500">
              <p>
                Showing <span className="font-semibold text-slate-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
                <span className="font-semibold text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredStudents.length)}</span> of{" "}
                <span className="font-semibold text-slate-900">{filteredStudents.length}</span> students
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-7 w-7 p-0 rounded-lg border-slate-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-2 font-mono font-semibold text-slate-700">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-7 w-7 p-0 rounded-lg border-slate-200"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
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
  const [activeTab, setActiveTab] = useState("overview");

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
    toast({
      title: "Data Refreshed",
      description: "Admin dashboard stats and tables updated.",
    });
  };

  const approveMutation = useMutation({
    mutationFn: approveTeacher,
    onSuccess: async () => {
      toast({
        title: "Teacher Approved",
        description: "The teacher account has been activated.",
      });
      await refreshData();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Approval Failed",
        description: error.message || "Could not approve teacher.",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectTeacher,
    onSuccess: async () => {
      toast({
        title: "Teacher Suspended",
        description: "The teacher account has been suspended.",
      });
      await refreshData();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Rejection Failed",
        description: error.message || "Could not reject teacher.",
      });
    },
  });

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logoutAdmin();
      toast({
        title: "Logged Out",
        description: "Your admin session has ended.",
      });
      navigate("/admin-login", { replace: true });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: error.message || "Could not end session.",
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

  const approvalRate = useMemo(() => {
    if (!stats || !stats.totalTeachers) return "0%";
    return `${Math.round((stats.approvedTeachers / stats.totalTeachers) * 100)}%`;
  }, [stats]);

  const activeStudentRate = useMemo(() => {
    if (!stats || !stats.totalStudents) return "0%";
    return `${Math.round((stats.activeStudents / stats.totalStudents) * 100)}%`;
  }, [stats]);

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-slate-900 text-lg">MCQGyaan AI</span>
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] font-bold tracking-wider uppercase px-2 py-0.2">
                  Admin
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium">Executive Control Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-slate-800 font-semibold">{session?.email || "Super Admin"}</span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={isLoading}
              className="h-9 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="h-9 rounded-xl text-rose-700 hover:bg-rose-50 hover:text-rose-800 font-medium"
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 space-y-6">
        {/* Banner Card */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-xl sm:p-8">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-emerald-600/15 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/90">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Control Center
              </div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl text-white">
                Platform Overview
              </h1>
              <p className="max-w-2xl text-sm text-slate-300 leading-relaxed">
                Manage teacher verification approvals, inspect student performance footprints, and track platform-wide custom test generation metrics.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Teacher Approval Rate</p>
                <p className="mt-1 text-xl font-black text-emerald-400">{approvalRate}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Student Ratio</p>
                <p className="mt-1 text-xl font-black text-cyan-400">{activeStudentRate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Total Teachers"
            value={stats?.totalTeachers ?? (isLoading ? "..." : 0)}
            description="Registered educator profiles."
            icon={<GraduationCap className="h-5 w-5" />}
            accent="bg-slate-900"
          />
          <StatCard
            title="Approved Teachers"
            value={stats?.approvedTeachers ?? (isLoading ? "..." : 0)}
            description="Verified & active teacher accounts."
            icon={<CheckCircle2 className="h-5 w-5" />}
            accent="bg-emerald-600"
          />
          <StatCard
            title="Pending Approval"
            value={stats?.pendingTeachers ?? (isLoading ? "..." : 0)}
            description="Verified teachers awaiting admin signoff."
            icon={<Clock3 className="h-5 w-5" />}
            accent="bg-amber-600"
          />
          <StatCard
            title="Total Students"
            value={stats?.totalStudents ?? (isLoading ? "..." : 0)}
            description="Registered student accounts."
            icon={<Users className="h-5 w-5" />}
            accent="bg-blue-600"
          />
          <StatCard
            title="Active Students (30D)"
            value={stats?.activeStudents ?? (isLoading ? "..." : 0)}
            description="Students active in the past 30 days."
            icon={<Users2 className="h-5 w-5" />}
            accent="bg-cyan-600"
          />
          <StatCard
            title="Tests Generated"
            value={stats?.totalTestsGenerated ?? (isLoading ? "..." : 0)}
            description="Custom MCQ tests created by teachers."
            icon={<BookOpenCheck className="h-5 w-5" />}
            accent="bg-violet-600"
          />
        </div>

        {/* Workspace Card with Tabs */}
        <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">
                  Management Workspace
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-1">
                  Filter, inspect, and approve system accounts.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 rounded-xl border border-slate-200 bg-slate-100 p-1">
                <TabsTrigger
                  value="overview"
                  className="rounded-lg py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="teachers"
                  className="rounded-lg py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs"
                >
                  Teachers ({teachers.length})
                </TabsTrigger>
                <TabsTrigger
                  value="students"
                  className="rounded-lg py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs"
                >
                  Students ({students.length})
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="rounded-lg py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs"
                >
                  Analytics
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Overview */}
              <TabsContent value="overview" className="mt-6 space-y-6">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-blue-600" />
                      Teacher Management Summary
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Review approval queue and teacher counts.</p>

                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total</p>
                        <p className="mt-1 text-2xl font-black text-slate-900">{stats?.totalTeachers ?? 0}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Approved</p>
                        <p className="mt-1 text-2xl font-black text-emerald-600">{stats?.approvedTeachers ?? 0}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pending</p>
                        <p className="mt-1 text-2xl font-black text-amber-600">{stats?.pendingTeachers ?? 0}</p>
                      </div>
                    </div>

                    <Button
                      onClick={() => setActiveTab("teachers")}
                      className="mt-4 w-full rounded-xl bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      Manage Teacher Directory
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>

                  <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Users className="h-5 w-5 text-cyan-600" />
                      Student Footprint Summary
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Active student engagement and test generation.</p>

                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Registered</p>
                        <p className="mt-1 text-2xl font-black text-slate-900">{stats?.totalStudents ?? 0}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active (30D)</p>
                        <p className="mt-1 text-2xl font-black text-cyan-600">{stats?.activeStudents ?? 0}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tests Created</p>
                        <p className="mt-1 text-2xl font-black text-violet-600">{stats?.totalTestsGenerated ?? 0}</p>
                      </div>
                    </div>

                    <Button
                      onClick={() => setActiveTab("students")}
                      className="mt-4 w-full rounded-xl bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      View Student Directory
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Teachers */}
              <TabsContent value="teachers" className="mt-6">
                <TeacherTable
                  teachers={teachers}
                  search={teacherSearch}
                  onSearchChange={setTeacherSearch}
                  onApprove={(id) => approveMutation.mutate(id)}
                  onReject={(id) => rejectMutation.mutate(id)}
                  onViewDetails={handleViewTeacher}
                  isMutating={isMutating}
                />
              </TabsContent>

              {/* Tab 3: Students */}
              <TabsContent value="students" className="mt-6">
                <StudentTable
                  students={students}
                  search={studentSearch}
                  onSearchChange={setStudentSearch}
                  onViewDetails={handleViewStudent}
                />
              </TabsContent>

              {/* Tab 4: Analytics */}
              <TabsContent value="analytics" className="mt-6">
                <AdminAnalytics />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
