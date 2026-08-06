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
  Layers3,
  Sparkles,
  Users,
  Users2,
  TrendingUp,
  Shield,
  Activity,
  FileText,
  School,
  BadgeCheck,
  CalendarClock,
  TestTube2,
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

const formatPercent = (value: number | null | undefined, fallback = "Not available") => {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback;
  return `${Number(value).toFixed(2)}%`;
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
    <Card className="group overflow-hidden rounded-[1.75rem] border-slate-200/80 bg-white/90 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-slate-500">{title}</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p>
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
    <Card className="rounded-[1.75rem] border-slate-200/80 bg-white/88 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-xl font-bold text-slate-950">{title}</CardTitle>
          <CardDescription className="mt-1 text-slate-600">{description}</CardDescription>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/20">
          {icon}
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

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="rounded-[1.5rem] border-slate-200/80 bg-white/95 shadow-lg shadow-slate-200/50">
            <CardContent className="p-5">
              <Skeleton className="h-4 w-28 rounded-full" />
              <Skeleton className="mt-4 h-10 w-20 rounded-full" />
              <Skeleton className="mt-3 h-4 w-full rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="rounded-[1.75rem] border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/50">
            <CardHeader className="space-y-4">
              <Skeleton className="h-6 w-48 rounded-full" />
              <Skeleton className="h-4 w-80 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[280px] rounded-2xl" />
            </CardContent>
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
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          {type === "line" ? (
            <LineChart data={chartData} margin={{ top: 12, right: 12, bottom: 8, left: 0 }}>
              <defs>
                <linearGradient id={`${title.replace(/\s+/g, "-").toLowerCase()}-fill`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={fillColor} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={fillColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} strokeOpacity={0.35} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval="preserveStartEnd"
                tick={{ fontSize: 12, fill: "hsl(215 20% 45%)" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={44}
                tickMargin={6}
                tickFormatter={yAxisFormatter}
                tick={{ fontSize: 12, fill: "hsl(215 20% 45%)" }}
              />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={3}
                dot={{ r: 3, fill: "#fff", strokeWidth: 2 }}
              />
            </LineChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 12, right: 12, bottom: 8, left: 0 }}>
              <defs>
                <linearGradient id={`${title.replace(/\s+/g, "-").toLowerCase()}-fill`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={fillColor} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={fillColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} strokeOpacity={0.35} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval="preserveStartEnd"
                tick={{ fontSize: 12, fill: "hsl(215 20% 45%)" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={44}
                tickMargin={6}
                tickFormatter={yAxisFormatter}
                tick={{ fontSize: 12, fill: "hsl(215 20% 45%)" }}
              />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={3}
                fill={`url(#${title.replace(/\s+/g, "-").toLowerCase()}-fill)`}
                dot={{ r: 3, fill: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          )}
        </ChartContainer>
      ) : (
        <EmptyState
          title={`No ${title.toLowerCase()} data yet`}
          description={`We could not find any platform data for ${title.toLowerCase()}.`}
        />
      )}
    </SectionCard>
  );
}

function RankTable({
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
  rows: Array<Record<string, any>>;
  columns: Array<{ header: string; accessor: string; format?: (value: any) => React.ReactNode }>;
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <SectionCard title={title} description={description} icon={icon}>
      {rows.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="overflow-hidden rounded-[1.25rem] border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.header}>{column.header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={row.id ?? `${title}-${index}`}>
                  {columns.map((column) => (
                    <TableCell key={column.header} className={column.accessor === "name" ? "font-medium text-slate-900" : "text-slate-600"}>
                      {column.format ? column.format(row[column.accessor]) : row[column.accessor]}
                    </TableCell>
                  ))}
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
  icon: React.ReactNode;
  items: Array<{
    id: string;
    title: string;
    description: string;
    createdAt: string | null;
    badge: string;
    badgeClassName: string;
  }>;
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
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
                <Badge className={item.badgeClassName}>{item.badge}</Badge>
              </div>
              <p className="mt-2 text-xs text-slate-500">{item.createdAt ?? "Not available"}</p>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export default function AdminAnalytics() {
  const analyticsQuery = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: getAdminAnalytics,
  });

  if (analyticsQuery.isLoading) {
    return <LoadingState />;
  }

  const data = analyticsQuery.data ?? EMPTY_ANALYTICS;
  const overview = data.overview;

  const topTeachersByTestsGenerated = data.teacherAnalytics.topTeachersByTestsGenerated.map((teacher) => ({
    ...teacher,
    name: teacher.fullName,
  }));
  const topTeachersByActiveStudents = data.teacherAnalytics.topTeachersByActiveStudents.map((teacher) => ({
    ...teacher,
    name: teacher.fullName,
  }));

  const latestStudentRegistrations = data.recentActivity.latestStudentRegistrations.map((item) => ({
    id: item.id,
    title: item.name,
    description: `${item.email || "No email"}${item.classLevel ? ` - Class ${item.classLevel}` : ""}${item.board ? ` - ${item.board}` : ""}`,
    createdAt: item.createdAt,
    badge: item.classLevel ? `Class ${item.classLevel}` : "Student",
    badgeClassName: "bg-cyan-100 text-cyan-800 hover:bg-cyan-100",
  }));

  const latestTeacherApprovals = data.recentActivity.latestTeacherApprovals.map((item) => ({
    id: item.id,
    title: item.fullName,
    description: `${item.email || "No email"}${item.school ? ` - ${item.school}` : ""}`,
    createdAt: item.approvedAt,
    badge: item.approved ? "Approved" : "Pending",
    badgeClassName: item.approved
      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
      : "bg-amber-100 text-amber-800 hover:bg-amber-100",
  }));

  const latestGeneratedTests = data.recentActivity.latestGeneratedTests.map((item) => ({
    id: item.id,
    title: item.title,
    description: `${item.subject}${item.classLevel ? ` - Class ${item.classLevel}` : ""}${item.teacherName ? ` - ${item.teacherName}` : ""}`,
    createdAt: item.createdAt,
    badge: item.status || "draft",
    badgeClassName: item.status?.toLowerCase() === "published"
      ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
      : "bg-slate-100 text-slate-700 hover:bg-slate-100",
  }));

  const latestTestAttempts = data.recentActivity.latestTestAttempts.map((item) => ({
    id: item.id,
    title: item.studentName,
    description: `${item.subject} - ${item.score}/${item.totalQuestions} - ${formatPercent(item.percentage, "0%")}`,
    createdAt: item.createdAt,
    badge: "Attempt",
    badgeClassName: "bg-violet-100 text-violet-800 hover:bg-violet-100",
  }));

  return (
    <div className="space-y-6">
      {analyticsQuery.error ? (
        <Card className="rounded-[1.5rem] border-amber-200 bg-amber-50/80">
          <CardContent className="px-5 py-4 text-sm text-amber-900">
            Analytics data is temporarily unavailable, so the dashboard is showing safe defaults.
          </CardContent>
        </Card>
      ) : null}
      <Card className="relative overflow-hidden rounded-[2rem] border-slate-200/80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.22),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.14),transparent_28%)]" />
        <CardContent className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-slate-200">
              <Shield className="h-3.5 w-3.5 text-cyan-300" />
              Intelligence layer
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                Platform intelligence at a glance
              </h3>
              <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Track teacher growth, student engagement, test volume, and score trends from a single premium analytics surface.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:w-[32rem]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-400">
                Students
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {formatValue(overview.totalStudents)}
              </p>
              <p className="mt-1 text-xs text-slate-300">Registered profiles</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-400">
                Teachers
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {formatValue(overview.totalTeachers)}
              </p>
              <p className="mt-1 text-xs text-slate-300">Live accounts</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-400">
                Avg score
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {formatPercent(overview.averageStudentScore)}
              </p>
              <p className="mt-1 text-xs text-slate-300">Platform-wide trend</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Students"
          value={formatValue(overview.totalStudents)}
          description="Registered student profiles."
          icon={<Users className="h-5 w-5" />}
          accent="bg-slate-900"
        />
        <MetricCard
          title="Active Students"
          value={formatValue(overview.activeStudents)}
          description="Students active in the last 30 days."
          icon={<Users2 className="h-5 w-5" />}
          accent="bg-cyan-600"
        />
        <MetricCard
          title="Total Teachers"
          value={formatValue(overview.totalTeachers)}
          description="Registered teacher accounts."
          icon={<GraduationCap className="h-5 w-5" />}
          accent="bg-blue-600"
        />
        <MetricCard
          title="Approved Teachers"
          value={formatValue(overview.approvedTeachers)}
          description="Teachers approved for dashboard access."
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="bg-emerald-600"
        />
        <MetricCard
          title="Pending Teachers"
          value={formatValue(overview.pendingTeachers)}
          description="Verified teachers waiting for approval."
          icon={<Clock3 className="h-5 w-5" />}
          accent="bg-amber-600"
        />
        <MetricCard
          title="Tests Generated"
          value={formatValue(overview.totalTestsGenerated)}
          description="Custom tests created on the platform."
          icon={<FileText className="h-5 w-5" />}
          accent="bg-violet-600"
        />
        <MetricCard
          title="Questions Generated"
          value={formatValue(overview.totalQuestionsGenerated)}
          description="Total questions across generated tests."
          icon={<BookOpenCheck className="h-5 w-5" />}
          accent="bg-rose-600"
        />
        <MetricCard
          title="Average Student Score"
          value={formatPercent(overview.averageStudentScore)}
          description="Average score across submitted attempts."
          icon={<TrendingUp className="h-5 w-5" />}
          accent="bg-slate-700"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <TimeSeriesChart
          title="Student Registrations"
          description="Daily student sign-ups over the last 30 days."
          series={data.charts.studentRegistrations}
          valueLabel="Student registrations"
          strokeColor="hsl(221 83% 53%)"
          fillColor="hsl(221 83% 53%)"
          icon={<Shield className="h-5 w-5" />}
        />
        <TimeSeriesChart
          title="Teacher Registrations"
          description="Daily teacher sign-ups over the last 30 days."
          series={data.charts.teacherRegistrations}
          valueLabel="Teacher registrations"
          strokeColor="hsl(160 84% 39%)"
          fillColor="hsl(160 84% 39%)"
          icon={<School className="h-5 w-5" />}
        />
        <TimeSeriesChart
          title="Tests Generated Per Day"
          description="Daily custom-test creation activity."
          series={data.charts.testsGeneratedPerDay}
          valueLabel="Tests generated"
          strokeColor="hsl(262 83% 58%)"
          fillColor="hsl(262 83% 58%)"
          icon={<Layers3 className="h-5 w-5" />}
        />
        <TimeSeriesChart
          title="Tests Attempted Per Day"
          description="Daily student attempts recorded in score history."
          series={data.charts.testsAttemptedPerDay}
          valueLabel="Tests attempted"
          strokeColor="hsl(14 100% 57%)"
          fillColor="hsl(14 100% 57%)"
          icon={<TestTube2 className="h-5 w-5" />}
        />
        <TimeSeriesChart
          title="Average Score Trend"
          description="Daily average score across submitted attempts."
          series={data.charts.averageScoreTrend}
          valueLabel="Average score"
          strokeColor="hsl(199 89% 48%)"
          fillColor="hsl(199 89% 48%)"
          icon={<Activity className="h-5 w-5" />}
          yAxisFormatter={(value) => `${value}%`}
          type="line"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <RankTable
          title="Top Teachers by Tests Generated"
          description="Teachers with the highest number of custom tests."
          icon={<BarChart3 className="h-5 w-5" />}
          rows={topTeachersByTestsGenerated}
          columns={[
            { header: "Teacher", accessor: "name" },
            { header: "Email", accessor: "email" },
            { header: "Tests", accessor: "totalTestsGenerated", format: (value) => formatValue(value) },
            { header: "Active Students", accessor: "activeStudents", format: (value) => formatValue(value) },
            {
              header: "Status",
              accessor: "approved",
              format: (value) => (
                <Badge className={value ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : "bg-amber-100 text-amber-800 hover:bg-amber-100"}>
                  {value ? "Approved" : "Pending"}
                </Badge>
              ),
            },
          ]}
          emptyTitle="No teacher analytics yet"
          emptyDescription="Teacher creation stats will appear once custom tests exist."
        />
        <RankTable
          title="Top Teachers by Active Students"
          description="Teachers whose tests are attracting the most active students."
          icon={<Users2 className="h-5 w-5" />}
          rows={topTeachersByActiveStudents}
          columns={[
            { header: "Teacher", accessor: "name" },
            { header: "Email", accessor: "email" },
            { header: "Active Students", accessor: "activeStudents", format: (value) => formatValue(value) },
            { header: "Tests", accessor: "totalTestsGenerated", format: (value) => formatValue(value) },
            {
              header: "Status",
              accessor: "approved",
              format: (value) => (
                <Badge className={value ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : "bg-amber-100 text-amber-800 hover:bg-amber-100"}>
                  {value ? "Approved" : "Pending"}
                </Badge>
              ),
            },
          ]}
          emptyTitle="No teacher activity yet"
          emptyDescription="Active-student rankings will appear once tests are being attempted."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <RankTable
          title="Top Performing Students"
          description="Students with the strongest average test scores."
          icon={<Sparkles className="h-5 w-5" />}
          rows={data.studentAnalytics.topPerformingStudents}
          columns={[
            { header: "Student", accessor: "name" },
            { header: "Email", accessor: "email" },
            { header: "Attempts", accessor: "attempts", format: (value) => formatValue(value) },
            { header: "Average", accessor: "averageScore", format: (value) => formatPercent(value) },
            { header: "High", accessor: "highestScore", format: (value) => formatPercent(value) },
            { header: "Low", accessor: "lowestScore", format: (value) => formatPercent(value) },
          ]}
          emptyTitle="No student score history yet"
          emptyDescription="Top-performing student rankings will appear after attempts are recorded."
        />
        <RankTable
          title="Most Active Students"
          description="Students with the highest number of attempts."
          icon={<BookOpenCheck className="h-5 w-5" />}
          rows={data.studentAnalytics.mostActiveStudents}
          columns={[
            { header: "Student", accessor: "name" },
            { header: "Email", accessor: "email" },
            { header: "Attempts", accessor: "attempts", format: (value) => formatValue(value) },
            { header: "Average", accessor: "averageScore", format: (value) => formatPercent(value) },
            { header: "High", accessor: "highestScore", format: (value) => formatPercent(value) },
            { header: "Low", accessor: "lowestScore", format: (value) => formatPercent(value) },
          ]}
          emptyTitle="No student attempts yet"
          emptyDescription="The most-active list will fill once students begin taking tests."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <RankTable
          title="Most Attempted Subjects"
          description="Subjects with the highest number of attempts."
          icon={<BarChart3 className="h-5 w-5" />}
          rows={data.subjectAnalytics.mostAttemptedSubjects}
          columns={[
            { header: "Subject", accessor: "subject" },
            { header: "Attempts", accessor: "attempts", format: (value) => formatValue(value) },
            { header: "Average", accessor: "averageScore", format: (value) => formatPercent(value) },
            { header: "High", accessor: "highestScore", format: (value) => formatPercent(value) },
            { header: "Low", accessor: "lowestScore", format: (value) => formatPercent(value) },
          ]}
          emptyTitle="No subject activity yet"
          emptyDescription="Subject analytics will appear once test attempts are available."
        />
        <RankTable
          title="Average Score by Subject"
          description="Subjects ranked by average student score."
          icon={<TrendingUp className="h-5 w-5" />}
          rows={data.subjectAnalytics.averageScoreBySubject}
          columns={[
            { header: "Subject", accessor: "subject" },
            { header: "Attempts", accessor: "attempts", format: (value) => formatValue(value) },
            { header: "Average", accessor: "averageScore", format: (value) => formatPercent(value) },
            { header: "High", accessor: "highestScore", format: (value) => formatPercent(value) },
            { header: "Low", accessor: "lowestScore", format: (value) => formatPercent(value) },
          ]}
          emptyTitle="No subject score data yet"
          emptyDescription="Average score by subject will appear after student attempts exist."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ActivityList
          title="Latest Student Registrations"
          description="Newest student profiles created on the platform."
          icon={<CalendarClock className="h-5 w-5" />}
          items={latestStudentRegistrations}
          emptyTitle="No student registrations yet"
          emptyDescription="Student registrations will appear here once profiles are created."
        />
        <ActivityList
          title="Latest Teacher Approvals"
          description="Recently approved teachers using the available admin data."
          icon={<BadgeCheck className="h-5 w-5" />}
          items={latestTeacherApprovals}
          emptyTitle="No teacher approvals yet"
          emptyDescription="Approved teacher records will appear here when available."
        />
        <ActivityList
          title="Latest Generated Tests"
          description="Newest custom tests generated by teachers."
          icon={<FileText className="h-5 w-5" />}
          items={latestGeneratedTests}
          emptyTitle="No generated tests yet"
          emptyDescription="Generated tests will appear here once teachers start creating them."
        />
        <ActivityList
          title="Latest Test Attempts"
          description="Most recent student submissions."
          icon={<TestTube2 className="h-5 w-5" />}
          items={latestTestAttempts}
          emptyTitle="No test attempts yet"
          emptyDescription="Recent attempts will appear here once students begin submitting tests."
        />
      </div>
    </div>
  );
}
