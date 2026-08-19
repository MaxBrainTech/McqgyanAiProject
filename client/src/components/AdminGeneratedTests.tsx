import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Download,
  Eye,
  Trash2,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  HelpCircle,
  Sparkles,
  Calendar,
  Layers,
  GraduationCap,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  getAdminGeneratedTests,
  getAdminGeneratedTestDetails,
  deleteAdminGeneratedTest,
  type AdminGeneratedTestItem,
  type AdminGeneratedQuestionItem,
  type AdminGeneratedTestStats,
} from "@/lib/adminApi";

const QUERY_KEY = ["admin", "generated-tests"];

const formatDate = (val: string | null) => {
  if (!val) return "N/A";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(val));
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
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <Card className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-black tracking-tight text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent} text-white shadow-sm`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

export default function AdminGeneratedTests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filters & State
  const [classFilter, setClassFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [mediumFilter, setMediumFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);

  // Selection & Modal State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Fetch paginated data
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...QUERY_KEY, classFilter, subjectFilter, difficultyFilter, mediumFilter, searchQuery, page, limit],
    queryFn: () =>
      getAdminGeneratedTests({
        classLevel: classFilter,
        subject: subjectFilter,
        difficulty: difficultyFilter,
        medium: mediumFilter,
        search: searchQuery,
        page,
        limit,
      }),
  });

  // Fetch test details for preview modal
  const { data: previewData, isLoading: isPreviewLoading } = useQuery({
    queryKey: [...QUERY_KEY, "preview", previewId],
    queryFn: () => (previewId ? getAdminGeneratedTestDetails(previewId) : null),
    enabled: Boolean(previewId),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteAdminGeneratedTest,
    onSuccess: () => {
      toast({
        title: "Test Deleted",
        description: "The generated test record has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: err.message || "Could not delete test.",
      });
    },
  });

  const tests = data?.tests ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const stats: AdminGeneratedTestStats | undefined = data?.stats;

  const isAllSelected = tests.length > 0 && tests.every((t) => selectedIds.includes(t.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tests.map((t) => t.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Single Test Export Trigger
  const handleExportSingle = (id: string) => {
    const url = `/api/admin/generated-tests/${id}/export`;
    window.open(url, "_blank");
    toast({
      title: "Exporting Excel",
      description: "Single test Excel download initiated...",
    });
  };

  // Bulk / Filtered Export Trigger
  const handleExportBulk = (exportSelected = false) => {
    setIsExporting(true);
    try {
      const query = new URLSearchParams();
      if (exportSelected && selectedIds.length > 0) {
        query.set("ids", selectedIds.join(","));
      } else {
        if (classFilter !== "all") query.set("classLevel", classFilter);
        if (subjectFilter !== "all") query.set("subject", subjectFilter);
        if (difficultyFilter !== "all") query.set("difficulty", difficultyFilter);
        if (mediumFilter !== "all") query.set("medium", mediumFilter);
        if (searchQuery.trim()) query.set("search", searchQuery.trim());
      }

      const url = `/api/admin/generated-tests/export?${query.toString()}`;
      window.open(url, "_blank");

      toast({
        title: "Preparing Excel...",
        description: exportSelected
          ? `Exporting ${selectedIds.length} selected tests.`
          : "Exporting matching filtered tests.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: err.message || "Could not generate Excel file.",
      });
    } finally {
      setTimeout(() => setIsExporting(false), 1500);
    }
  };

  const resetFilters = () => {
    setClassFilter("all");
    setSubjectFilter("all");
    setDifficultyFilter("all");
    setMediumFilter("all");
    setSearchQuery("");
    setPage(1);
    setSelectedIds([]);
  };

  return (
    <div className="space-y-6">
      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Generated Tests"
          value={stats?.totalGeneratedTests ?? 0}
          description="Stored in student AI library."
          icon={<FileSpreadsheet className="h-5 w-5" />}
          accent="bg-blue-600"
        />
        <StatCard
          title="Generated Today"
          value={stats?.testsGeneratedToday ?? 0}
          description="New AI tests generated today."
          icon={<Calendar className="h-5 w-5" />}
          accent="bg-emerald-600"
        />
        <StatCard
          title="Generated This Week"
          value={stats?.testsGeneratedThisWeek ?? 0}
          description="Generated in past 7 days."
          icon={<Sparkles className="h-5 w-5" />}
          accent="bg-violet-600"
        />
        <StatCard
          title="Total Questions"
          value={stats?.totalQuestionsGenerated ?? 0}
          description="Total MCQs generated & stored."
          icon={<HelpCircle className="h-5 w-5" />}
          accent="bg-amber-600"
        />
        <StatCard
          title="Most Popular Class"
          value={stats?.mostUsedClass ? `Class ${stats.mostUsedClass}` : "N/A"}
          description="Highest test generation volume."
          icon={<GraduationCap className="h-5 w-5" />}
          accent="bg-cyan-600"
        />
        <StatCard
          title="Most Popular Subject"
          value={stats?.mostUsedSubject || "N/A"}
          description="Top test generation subject."
          icon={<BookOpen className="h-5 w-5" />}
          accent="bg-indigo-600"
        />
      </div>

      {/* Main Filter & Data Section */}
      <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600" />
                Generated Test Library & Excel Management
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-1">
                Centrally inspect all student AI generated tests, preview questions & answers, and export to Excel (.xlsx).
              </CardDescription>
            </div>

            {/* Global Export Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {selectedIds.length > 0 && (
                <Button
                  onClick={() => handleExportBulk(true)}
                  disabled={isExporting}
                  size="sm"
                  className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-semibold shadow-xs"
                >
                  <FileSpreadsheet className="mr-1.5 h-4 w-4" />
                  Export Selected ({selectedIds.length})
                </Button>
              )}

              <Button
                onClick={() => handleExportBulk(false)}
                disabled={isExporting || total === 0}
                size="sm"
                variant="outline"
                className="rounded-xl border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold"
              >
                <Download className="mr-1.5 h-4 w-4" />
                Export Filtered Tests (.xlsx)
              </Button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search Student, Email, ID, Topic..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9 rounded-xl border-slate-200 text-xs"
              />
            </div>

            {/* Class Filter */}
            <Select
              value={classFilter}
              onValueChange={(val) => {
                setClassFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="rounded-xl border-slate-200 text-xs">
                <SelectValue placeholder="Filter by Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="6">Class 6</SelectItem>
                <SelectItem value="7">Class 7</SelectItem>
                <SelectItem value="8">Class 8</SelectItem>
                <SelectItem value="9">Class 9</SelectItem>
                <SelectItem value="10">Class 10</SelectItem>
                <SelectItem value="11">Class 11</SelectItem>
                <SelectItem value="12">Class 12</SelectItem>
              </SelectContent>
            </Select>

            {/* Subject Filter */}
            <Select
              value={subjectFilter}
              onValueChange={(val) => {
                setSubjectFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="rounded-xl border-slate-200 text-xs">
                <SelectValue placeholder="Filter by Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                <SelectItem value="Physics">Physics</SelectItem>
                <SelectItem value="Chemistry">Chemistry</SelectItem>
                <SelectItem value="Biology">Biology</SelectItem>
                <SelectItem value="Science">Science</SelectItem>
                <SelectItem value="Mathematics">Mathematics</SelectItem>
                <SelectItem value="Hindi">Hindi</SelectItem>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Social Science">Social Science</SelectItem>
                <SelectItem value="Kannada">Kannada</SelectItem>
                <SelectItem value="French">French</SelectItem>
                {stats?.distinctSubjects?.map((subj) => (
                  <SelectItem key={subj} value={subj}>
                    {subj}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Difficulty Filter */}
            <Select
              value={difficultyFilter}
              onValueChange={(val) => {
                setDifficultyFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="rounded-xl border-slate-200 text-xs">
                <SelectValue placeholder="Filter by Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>

            {/* Medium Filter */}
            <Select
              value={mediumFilter}
              onValueChange={(val) => {
                setMediumFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="rounded-xl border-slate-200 text-xs">
                <SelectValue placeholder="Filter by Medium" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Mediums</SelectItem>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Hindi">Hindi</SelectItem>
                <SelectItem value="Kannada">Kannada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(classFilter !== "all" ||
            subjectFilter !== "all" ||
            difficultyFilter !== "all" ||
            mediumFilter !== "all" ||
            searchQuery.trim().length > 0) && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Showing filtered results ({total} matching tests found)
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-7 text-xs text-rose-600 hover:bg-rose-50"
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </CardHeader>

        {/* Table Content */}
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <XCircle className="mx-auto h-8 w-8 text-rose-500" />
              <p className="font-semibold text-slate-800">Failed to load generated tests</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl">
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Retry
              </Button>
            </div>
          ) : tests.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
              <p className="font-bold text-slate-700 text-base">No generated tests found</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {classFilter !== "all" || subjectFilter !== "all" || searchQuery.trim()
                  ? "No tests match your active filter criteria. Try clearing or adjusting filters."
                  : "When students generate AI tests, they will automatically be recorded here centrally."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">Test ID</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">Student</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">Class & Subject</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">Chapter / Topic</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-center">Questions</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-center">Difficulty / Medium</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">Generated At</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tests.map((test) => {
                    const isSelected = selectedIds.includes(test.id);
                    return (
                      <TableRow
                        key={test.id}
                        className={`transition-colors ${
                          isSelected ? "bg-blue-50/60 hover:bg-blue-50/80" : "hover:bg-slate-50/50"
                        }`}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelectOne(test.id)}
                            aria-label={`Select ${test.id}`}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs font-semibold text-slate-900">
                          {test.id.length > 14 ? `${test.id.slice(0, 8)}...` : test.id}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{test.studentName}</p>
                            {test.studentEmail && (
                              <p className="text-[11px] text-slate-500">{test.studentEmail}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {test.classLevel != null && (
                              <Badge className="bg-slate-100 text-slate-800 border-slate-200 text-[10px] px-2 py-0">
                                Class {test.classLevel}
                              </Badge>
                            )}
                            <Badge className="bg-blue-50 text-blue-800 border-blue-200 text-[10px] px-2 py-0 font-medium">
                              {test.subject}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs text-slate-700 font-medium">
                          {test.chapterTopic || "General Topic"}
                        </TableCell>
                        <TableCell className="text-center font-bold text-xs text-slate-800">
                          {test.questionCount}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Badge className="capitalize text-[10px] px-2 py-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                              {test.difficulty || "Medium"}
                            </Badge>
                            <Badge className="capitalize text-[10px] px-2 py-0 bg-slate-50 text-slate-600 border-slate-200">
                              {test.medium || "English"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                          {formatDate(test.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* View / Preview */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPreviewId(test.id)}
                              className="h-8 w-8 p-0 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              title="Preview Test & Answers"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {/* Export Single Excel */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExportSingle(test.id)}
                              className="h-8 w-8 p-0 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                              title="Export to Excel (.xlsx)"
                            >
                              <Download className="h-4 w-4" />
                            </Button>

                            {/* Delete */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete Test ID ${test.id}?`)) {
                                  deleteMutation.mutate(test.id);
                                }
                              }}
                              disabled={deleteMutation.isPending}
                              className="h-8 w-8 p-0 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              title="Delete Generated Test"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Bar */}
          {!isLoading && tests.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 bg-slate-50/50 text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <span>
                  Showing {tests.length} of {total} records
                </span>
                <span className="text-slate-300">|</span>
                <span>Page {page} of {totalPages}</span>
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={String(limit)}
                  onValueChange={(val) => {
                    setLimit(Number(val));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[100px] rounded-lg border-slate-200 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 / page</SelectItem>
                    <SelectItem value="20">20 / page</SelectItem>
                    <SelectItem value="50">50 / page</SelectItem>
                    <SelectItem value="100">100 / page</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-8 rounded-lg"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="h-8 rounded-lg"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* TEST PREVIEW MODAL */}
      <Dialog open={Boolean(previewId)} onOpenChange={(open) => !open && setPreviewId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center justify-between">
              <span>Test Details & Question Paper</span>
              {previewId && (
                <Button
                  size="sm"
                  onClick={() => handleExportSingle(previewId)}
                  className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Export .xlsx
                </Button>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Full preview of questions, options, highlighted correct answers, and explanations.
            </DialogDescription>
          </DialogHeader>

          {isPreviewLoading ? (
            <div className="py-12 space-y-4">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          ) : !previewData ? (
            <div className="py-8 text-center text-slate-500">Could not load test details.</div>
          ) : (
            <div className="space-y-6">
              {/* Test Metadata Box */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                <div>
                  <p className="font-semibold text-slate-500 text-[10px] uppercase">Test ID</p>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">{previewData.test.id}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500 text-[10px] uppercase">Student</p>
                  <p className="font-bold text-slate-900 mt-0.5">{previewData.test.studentName}</p>
                  {previewData.test.studentEmail && (
                    <p className="text-slate-500 text-[11px]">{previewData.test.studentEmail}</p>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-500 text-[10px] uppercase">Class & Subject</p>
                  <p className="font-bold text-slate-900 mt-0.5">
                    Class {previewData.test.classLevel ?? "—"} • {previewData.test.subject}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500 text-[10px] uppercase">Topic / Difficulty</p>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {previewData.test.chapterTopic || "General"} ({previewData.test.difficulty || "Medium"})
                  </p>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Questions ({previewData.questions.length})
                </h4>

                {previewData.questions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs"
                  >
                    {/* Q Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <Badge className="bg-blue-100 text-blue-900 border-blue-200 font-bold px-2 py-0.5 rounded-lg text-xs shrink-0">
                          Q{q.questionNumber || idx + 1}.
                        </Badge>
                        <p className="font-bold text-slate-900 text-sm leading-snug">{q.question}</p>
                      </div>
                    </div>

                    {/* Options Grid */}
                    <div className="grid gap-2 sm:grid-cols-2 pt-1">
                      {[
                        { key: "A", text: q.optionA },
                        { key: "B", text: q.optionB },
                        { key: "C", text: q.optionC },
                        { key: "D", text: q.optionD },
                      ]
                        .filter((opt) => opt.text)
                        .map((opt) => {
                          const isCorrect =
                            q.correctOption?.toUpperCase() === opt.key ||
                            q.correctAnswer?.trim().toLowerCase() === opt.text?.trim().toLowerCase();

                          return (
                            <div
                              key={opt.key}
                              className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium transition-colors ${
                                isCorrect
                                  ? "border-emerald-300 bg-emerald-50/80 text-emerald-950 font-semibold"
                                  : "border-slate-200 bg-slate-50/60 text-slate-700"
                              }`}
                            >
                              <div
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                                  isCorrect
                                    ? "bg-emerald-600 text-white"
                                    : "border border-slate-300 bg-white text-slate-600"
                                }`}
                              >
                                {opt.key}
                              </div>
                              <span className="flex-1">{opt.text}</span>
                              {isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                            </div>
                          );
                        })}
                    </div>

                    {/* Correct Answer Banner */}
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5 text-xs text-emerald-900 flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-extrabold text-emerald-950">Correct Answer: </span>
                        <span className="font-semibold">{q.correctOption ? `${q.correctOption} — ` : ""}{q.correctAnswer}</span>
                      </div>
                    </div>

                    {/* Explanation Banner */}
                    {q.explanation && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-2.5 text-xs text-amber-950 flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-extrabold text-amber-950">Explanation: </span>
                          <span>{q.explanation}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
