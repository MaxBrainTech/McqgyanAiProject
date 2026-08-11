import { useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Sparkles,
  Users,
  Users2,
  TrendingUp,
  Shield,
  Activity,
  FileText,
  BadgeCheck,
  CalendarClock,
  TestTube2,
  Layers,
  Award,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { getAdminAnalytics, type AdminAnalyticsResponse } from "@/lib/adminApi";

const DATE_LABEL_FORMAT = new Intl.DateTimeFormat("en-IN", {
  month: "short",
  day: "numeric",
});

const formatDateLabel = (date: string) => {
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? date : DATE_LABEL_FORMAT.format(parsed);
};

const formatValue = (value: number | null | undefined, fallback = "0") => {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback;
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(value);
};

const formatPercent = (value: number | null | undefined, fallback = "N/A") => {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback;
  return `${Number(value).toFixed(1)}%`;
};

const hasSeriesData = (series: Array<{ value: number }>) => series.some((item) => Number(item.value) > 0);

const EMPTY_ANALYTICS: AdminAnalyticsResponse = {
  overview: {
    totalStudents: 0,
    activeStudents: 0,
    totalTeachers: 0,
    approvedTeachers: 0,
    pendingTeachers: 0,
    totalTestsGenerated: 0,
    totalQuestionsGenerated: 0,
    averageStudentScore: null,
  },
  charts: {
    studentRegistrations: [],
    teacherRegistrations: [],
    testsGeneratedPerDay: [],
    testsAttemptedPerDay: [],
    averageScoreTrend: [],
  },
  teacherAnalytics: {
    topTeachersByTestsGenerated: [],
    topTeachersByActiveStudents: [],
  },
  studentAnalytics: {
    topPerformingStudents: [],
    mostActiveStudents: [],
  },
  subjectAnalytics: {
    mostAttemptedSubjects: [],
    averageScoreBySubject: [],
  },
  recentActivity: {
    latestStudentRegistrations: [],
    latestTeacherApprovals: [],
    latestGeneratedTests: [],
    latestTestAttempts: [],
  },
};

function MetricCard({
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
    <Card className="group overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-1.5 text-2xl font-black tracking-tight text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">{description}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent} text-white shadow-sm transition-transform duration-200 group-hover:scale-105`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

function SectionCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-5 flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-base font-bold text-slate-900">{title}</CardTitle>
          <CardDescription className="mt-0.5 text-xs text-slate-500">{description}</CardDescription>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="p-5">{children}</CardContent>
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
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-xs text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="rounded-2xl border-slate-200/80 bg-white p-5">
            <Skeleton className="h-4 w-28 rounded-full" />
            <Skeleton className="mt-3 h-8 w-20 rounded-full" />
            <Skeleton className="mt-2 h-3 w-full rounded-full" />
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="rounded-2xl border-slate-200/80 bg-white p-6">
            <Skeleton className="h-6 w-48 rounded-full" />
            <Skeleton className="mt-2 h-4 w-80 rounded-full" />
            <Skeleton className="mt-6 h-[260px] rounded-xl" />
          </Card>
        ))}
      </div>
    </div>
  );
}

function TimeSeriesChart({
  title,
  description,
  series,
  valueLabel,
  strokeColor,
  fillColor,
  icon,
  yAxisFormatter,
  type = "area",
}: {
  title: string;
  description: string;
  series: Array<{ date: string; value: number }>;
  valueLabel: string;
  strokeColor: string;
  fillColor: string;
  icon: ReactNode;
  yAxisFormatter?: (value: number) => string;
  type?: "area" | "line";
}) {
  const chartData = useMemo(
    () =>
      series.map((item) => ({
        ...item,
        label: formatDateLabel(item.date),
      })),
    [series],
  );

  const chartConfig = {
    value: {
      label: valueLabel,
      color: strokeColor,
    },
  };

  const hasData = hasSeriesData(series);

  return (
    <SectionCard title={title} description={description} icon={icon}>
      {hasData ? (
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          {type === "line" ? (
            <LineChart data={chartData} margin={{ top: 12, right: 12, bottom: 8, left: 0 }}>
              <defs>
                <linearGradient id={`gradient-${strokeColor}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={yAxisFormatter} tick={{ fontSize: 11, fill: "#64748b" }} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <Line type="monotone" dataKey="value" stroke={strokeColor} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
            </LineChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 12, right: 12, bottom: 8, left: 0 }}>
              <defs>
                <linearGradient id={`areaGradient-${strokeColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={yAxisFormatter} tick={{ fontSize: 11, fill: "#64748b" }} />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Area type="monotone" dataKey="value" stroke={strokeColor} strokeWidth={2} fill={`url(#areaGradient-${strokeColor.replace('#', '')})`} />
            </AreaChart>
          )}
        </ChartContainer>
      ) : (
        <EmptyState title="No trend data available" description="Data points will render as users interact with the platform." />
      )}
    </SectionCard>
  );
}function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold text-[10px] px-2 py-0.5">
        🥇 #1
      </Badge>
    );
  }
  if (rank === 2) {
    return (
      <Badge className="bg-slate-100 text-slate-700 border-slate-300 font-bold text-[10px] px-2 py-0.5">
        🥈 #2
      </Badge>
    );
  }
  if (rank === 3) {
    return (
      <Badge className="bg-amber-50 text-amber-900 border-amber-200 font-bold text-[10px] px-2 py-0.5">
        🥉 #3
      </Badge>
    );
  }
  return <span className="font-mono text-xs font-semibold text-slate-400">#{rank}</span>;
}

function RankTable<T extends Record<string, any>>({
  title,
  description,
  icon,
  rows,
  columns,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  rows: T[];
  columns: Array<{
    header: string;
    accessor: keyof T | string;
    format?: (value: any, row: T) => ReactNode;
  }>;
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <SectionCard title={title} description={description} icon={icon}>
      {rows.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200/90">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-slate-200/80 hover:bg-transparent">
                <TableHead className="w-16 text-center font-semibold text-slate-700">Rank</TableHead>
                {columns.map((col) => (
                  <TableHead key={String(col.accessor)} className="font-semibold text-slate-700">
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={index} className="border-slate-100 hover:bg-slate-50/60">
                  <TableCell className="text-center font-bold text-xs">
                    <RankBadge rank={index + 1} />
                  </TableCell>
                  {columns.map((col) => {
                    const raw = (row as any)[col.accessor];
                    const content = col.format ? col.format(raw, row) : (raw as ReactNode);
                    return (
                      <TableCell key={String(col.accessor)} className="text-sm font-medium text-slate-900">
                        {content}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </SectionCard>
  );
}

function ActivityList({
  title,
  description,
  icon,
  items,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  items: Array<{ id: string; title: string; subtitle: string; timestamp: string }>;
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <SectionCard title={title} description={description} icon={icon}>
      {items.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 transition-colors hover:bg-slate-100/60">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">{item.title}</p>
                <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
              </div>
              <Badge variant="outline" className="shrink-0 rounded-lg border-slate-200 bg-white font-mono text-[10px] text-slate-600">
                {item.timestamp}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export default function AdminAnalytics() {
  const analyticsQuery = useQuery<AdminAnalyticsResponse>({
    queryKey: ["admin", "analytics"],
    queryFn: getAdminAnalytics,
  });

  const data = analyticsQuery.data ?? EMPTY_ANALYTICS;
  const overview = data.overview;

  const latestStudentRegistrations = useMemo(
    () =>
      data.recentActivity.latestStudentRegistrations.map((item) => ({
        id: item.id,
        title: item.name,
        subtitle: `${item.email} • Class ${item.classLevel ?? "N/A"}`,
        timestamp: item.createdAt || "N/A",
      })),
    [data.recentActivity.latestStudentRegistrations],
  );

  const latestTeacherApprovals = useMemo(
    () =>
      data.recentActivity.latestTeacherApprovals.map((item) => ({
        id: item.id,
        title: item.fullName,
        subtitle: `${item.email} • ${item.school || "School N/A"}`,
        timestamp: item.approvedAt || "N/A",
      })),
    [data.recentActivity.latestTeacherApprovals],
  );

  const latestGeneratedTests = useMemo(
    () =>
      data.recentActivity.latestGeneratedTests.map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: `${item.teacherName || "Teacher"} • ${item.subject}${item.classLevel ? ` (Class ${item.classLevel})` : ""}`,
        timestamp: item.createdAt || "N/A",
      })),
    [data.recentActivity.latestGeneratedTests],
  );

  const latestTestAttempts = useMemo(
    () =>
      data.recentActivity.latestTestAttempts.map((item) => ({
        id: item.id,
        title: `${item.studentName} — ${item.subject}`,
        subtitle: `Score: ${item.score}/${item.totalQuestions} (${item.percentage}%)`,
        timestamp: item.createdAt || "N/A",
      })),
    [data.recentActivity.latestTestAttempts],
  );

  if (analyticsQuery.isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Students"
          value={formatValue(overview.totalStudents)}
          description="Registered platform students"
          icon={<Users className="h-5 w-5" />}
          accent="bg-blue-600"
        />
        <MetricCard
          title="Active Students"
          value={formatValue(overview.activeStudents)}
          description="Active in past 30 days"
          icon={<Users2 className="h-5 w-5" />}
          accent="bg-cyan-600"
        />
        <MetricCard
          title="Total Teachers"
          value={formatValue(overview.totalTeachers)}
          description="All teacher accounts"
          icon={<GraduationCap className="h-5 w-5" />}
          accent="bg-slate-900"
        />
        <MetricCard
          title="Approved Teachers"
          value={formatValue(overview.approvedTeachers)}
          description="Active verified educators"
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="bg-emerald-600"
        />
        <MetricCard
          title="Pending Approvals"
          value={formatValue(overview.pendingTeachers)}
          description="Awaiting admin signoff"
          icon={<Clock3 className="h-5 w-5" />}
          accent="bg-amber-600"
        />
        <MetricCard
          title="Tests Generated"
          value={formatValue(overview.totalTestsGenerated)}
          description="Custom test sets created"
          icon={<BookOpenCheck className="h-5 w-5" />}
          accent="bg-violet-600"
        />
        <MetricCard
          title="Questions Generated"
          value={formatValue(overview.totalQuestionsGenerated)}
          description="AI & custom questions"
          icon={<Layers className="h-5 w-5" />}
          accent="bg-indigo-600"
        />
        <MetricCard
          title="Average Score"
          value={formatPercent(overview.averageStudentScore)}
          description="Platform-wide score average"
          icon={<Award className="h-5 w-5" />}
          accent="bg-emerald-600"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 xl:grid-cols-2">
        <TimeSeriesChart
          title="Student Registrations Trend"
          description="New student accounts registered per day."
          series={data.charts.studentRegistrations}
          valueLabel="Students"
          strokeColor="#0284c7"
          fillColor="#0284c7"
          icon={<Users className="h-5 w-5" />}
          yAxisFormatter={(value) => formatValue(value)}
        />
        <TimeSeriesChart
          title="Teacher Registrations Trend"
          description="New teacher accounts created per day."
          series={data.charts.teacherRegistrations}
          valueLabel="Teachers"
          strokeColor="#0f172a"
          fillColor="#0f172a"
          icon={<GraduationCap className="h-5 w-5" />}
          yAxisFormatter={(value) => formatValue(value)}
        />
        <TimeSeriesChart
          title="Tests Generated Per Day"
          description="Custom test creation activity over time."
          series={data.charts.testsGeneratedPerDay}
          valueLabel="Tests"
          strokeColor="#7c3aed"
          fillColor="#7c3aed"
          icon={<BookOpenCheck className="h-5 w-5" />}
          yAxisFormatter={(value) => formatValue(value)}
        />
        <TimeSeriesChart
          title="Tests Attempted Per Day"
          description="Student test submission frequency over time."
          series={data.charts.testsAttemptedPerDay}
          valueLabel="Attempts"
          strokeColor="#059669"
          fillColor="#059669"
          icon={<Activity className="h-5 w-5" />}
          yAxisFormatter={(value) => formatValue(value)}
        />
      </div>

      {/* Leaderboards & Subject Tables */}
      <div className="grid gap-6 xl:grid-cols-2">
        <RankTable
          title="Top Teachers by Tests Created"
          description="Educators who have generated the most test sets."
          icon={<GraduationCap className="h-5 w-5" />}
          rows={data.teacherAnalytics.topTeachersByTestsGenerated}
          columns={[
            {
              header: "Teacher Name",
              accessor: "fullName",
              format: (val, row) => val || row.email || "Teacher",
            },
            {
              header: "Tests Created",
              accessor: "totalTestsGenerated",
              format: (value) => formatValue(value),
            },
          ]}
          emptyTitle="No teacher data"
          emptyDescription="Teacher generation rankings will appear once tests exist."
        />
        <RankTable
          title="Top Teachers by Active Students"
          description="Educators engaging the highest student volume."
          icon={<Users2 className="h-5 w-5" />}
          rows={data.teacherAnalytics.topTeachersByActiveStudents}
          columns={[
            {
              header: "Teacher Name",
              accessor: "fullName",
              format: (val, row) => val || row.email || "Teacher",
            },
            {
              header: "Active Students",
              accessor: "activeStudents",
              format: (value) => formatValue(value),
            },
          ]}
          emptyTitle="No active student data"
          emptyDescription="Teacher student rankings will appear after student engagement."
        />
        <RankTable
          title="Top Performing Students"
          description="Students with the highest average test scores."
          icon={<Award className="h-5 w-5" />}
          rows={data.studentAnalytics.topPerformingStudents}
          columns={[
            {
              header: "Student Name",
              accessor: "name",
              format: (val, row) => val || row.email || "Student",
            },
            {
              header: "Attempts",
              accessor: "attempts",
              format: (value) => formatValue(value),
            },
            {
              header: "Average Score",
              accessor: "averageScore",
              format: (value) => formatPercent(value),
            },
          ]}
          emptyTitle="No student test scores"
          emptyDescription="Performance rankings will appear after test submissions."
        />
        <RankTable
          title="Most Attempted Subjects"
          description="Subjects with the highest submission volume."
          icon={<BarChart3 className="h-5 w-5" />}
          rows={data.subjectAnalytics.mostAttemptedSubjects}
          columns={[
            { header: "Subject", accessor: "subject" },
            { header: "Total Attempts", accessor: "attempts", format: (value) => formatValue(value) },
            { header: "Average Score", accessor: "averageScore", format: (value) => formatPercent(value) },
          ]}
          emptyTitle="No subject activity yet"
          emptyDescription="Subject analytics will appear once test attempts exist."
        />
      </div>

      {/* Recent Activity Section */}
      <div className="grid gap-6 xl:grid-cols-2">
        <ActivityList
          title="Latest Student Registrations"
          description="Newest student profiles registered."
          icon={<CalendarClock className="h-5 w-5" />}
          items={latestStudentRegistrations}
          emptyTitle="No student registrations"
          emptyDescription="Registrations will appear here as profiles are created."
        />
        <ActivityList
          title="Latest Teacher Approvals"
          description="Approved educators on the platform."
          icon={<BadgeCheck className="h-5 w-5" />}
          items={latestTeacherApprovals}
          emptyTitle="No teacher approvals"
          emptyDescription="Approved teacher records will appear here when available."
        />
        <ActivityList
          title="Latest Generated Tests"
          description="Newest custom tests created by teachers."
          icon={<FileText className="h-5 w-5" />}
          items={latestGeneratedTests}
          emptyTitle="No generated tests"
          emptyDescription="Generated tests will appear here once teachers start creating them."
        />
        <ActivityList
          title="Latest Test Attempts"
          description="Most recent student submissions."
          icon={<TestTube2 className="h-5 w-5" />}
          items={latestTestAttempts}
          emptyTitle="No test attempts"
          emptyDescription="Recent attempts will appear here once students submit tests."
        />
      </div>
    </div>
  );
}
