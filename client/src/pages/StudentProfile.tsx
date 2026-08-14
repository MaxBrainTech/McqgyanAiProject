import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, updateProfile, User } from "firebase/auth";
import {
  ArrowLeft,
  BookOpen,
  Globe2,
  GraduationCap,
  RefreshCcw,
  Save,
  UserPen,
  MapPin,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Target,
  Trophy,
  ArrowRight,
  Sparkles,
  BarChart3,
  Building2,
  Compass,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getStoredAuthRole } from "@/lib/authSession";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SignInWithGoogle from "@/pages/signInWithGoogle";
import ScoreHistoryReportDialog from "@/components/ScoreHistoryReportDialog";
import {
  buildScoreSummary,
  doesAttemptMatchClass,
  loadRemoteScoreHistory,
  loadScoreHistory,
  mergeScoreHistoryEntries,
  normalizeScoreEntry,
  type ScoreHistoryEntry,
} from "@/lib/scoreHistory";
import { getNames } from "country-list";

import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const countries = getNames().sort();
const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
].sort();

const indianCities = [
  "Ahmedabad",
  "Bengaluru",
  "Bhopal",
  "Bhubaneswar",
  "Chandigarh",
  "Chennai",
  "Coimbatore",
  "Delhi",
  "Faridabad",
  "Ghaziabad",
  "Gurugram",
  "Hyderabad",
  "Indore",
  "Jaipur",
  "Jodhpur",
  "Kanpur",
  "Kochi",
  "Kolkata",
  "Lucknow",
  "Ludhiana",
  "Mumbai",
  "Nagpur",
  "Patna",
  "Pune",
  "Raipur",
  "Ranchi",
  "Surat",
  "Thane",
  "Thiruvananthapuram",
  "Visakhapatnam",
].sort();

const getFilteredOptions = (options: string[], search: string) => {
  const normalizedSearch = search.trim().toLowerCase();

  return options
    .filter((option) => {
      if (!normalizedSearch) return true;
      return option.toLowerCase().includes(normalizedSearch);
    })
    .sort((a, b) => {
      if (!normalizedSearch) return a.localeCompare(b);

      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      const aStarts = aLower.startsWith(normalizedSearch);
      const bStarts = bLower.startsWith(normalizedSearch);

      if (aStarts !== bStarts) return aStarts ? -1 : 1;
      return a.localeCompare(b);
    });
};

interface ProfileForm {
  fullName: string;
  emailAddress: string;
  classLevel: string;
  school: string;
  medium: string;
  board: string;
  country: string;
  state: string;
  city: string;
}

const CLASS_OPTIONS = [6, 7, 8, 9, 10, 11, 12];

const getProviderName = (user: User | null) => {
  if (!user) return "Not Available";
  const providerId = user.providerData?.[0]?.providerId;
  if (!providerId) return "Not Available";
  if (providerId.includes("google")) return "Google Account";
  if (providerId.includes("password")) return "Email & Password";
  return providerId;
};

const getStatusText = (user: User | null) => {
  if (!user) return "Not Available";
  return user.emailVerified ? "Verified Account" : "Registered Account";
};

const formatValue = (value: string | null | undefined) => value || "Not set";

const getClassLabel = (classLevel: string, t: (key: string) => string) => {
  if (!classLevel.trim()) return "Class N/A";
  return t(`class_${classLevel}`) || `Class ${classLevel}`;
};

const getMediumLabel = (medium: string, t: (key: string) => string) => {
  if (!medium.trim()) return t("medium");
  if (medium.toLowerCase() === "english") return t("medium_english");
  if (medium.toLowerCase() === "hindi") return t("medium_hindi");
  return medium;
};

const getBoardLabel = (board: string, t: (key: string) => string) => {
  if (!board.trim()) return "Board N/A";
  if (board.toLowerCase().includes("cbse")) return "CBSE";
  if (board.toLowerCase().includes("rbse")) return "RBSE";
  if (board.toLowerCase().includes("icse")) return "ICSE";
  if (board.toLowerCase().includes("state")) return "State Board";
  return board;
};

export default function StudentProfile() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileForm>({
    fullName: "",
    emailAddress: "",
    classLevel: "",
    school: "",
    medium: "",
    board: "",
    country: "",
    state: "",
    city: "",
  });
  const [initialProfile, setInitialProfile] = useState<ProfileForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [scoreHistory, setScoreHistory] = useState<ScoreHistoryEntry[]>([]);
  const [scoreHistoryOpen, setScoreHistoryOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const countryListRef = useRef<HTMLDivElement | null>(null);
  const [stateOpen, setStateOpen] = useState(false);
  const [stateSearch, setStateSearch] = useState("");
  const stateListRef = useRef<HTMLDivElement | null>(null);
  const [cityOpen, setCityOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const cityListRef = useRef<HTMLDivElement | null>(null);

  const filteredCountries = getFilteredOptions(countries, countrySearch);
  const filteredStates = getFilteredOptions(indianStates, stateSearch);
  const filteredCities = getFilteredOptions(indianCities, citySearch);

  useEffect(() => {
    if (!countryOpen) return;
    countryListRef.current?.scrollTo({ top: 0 });
  }, [countryOpen, countrySearch]);

  useEffect(() => {
    if (!stateOpen) return;
    stateListRef.current?.scrollTo({ top: 0 });
  }, [stateOpen, stateSearch]);

  useEffect(() => {
    if (!cityOpen) return;
    cityListRef.current?.scrollTo({ top: 0 });
  }, [cityOpen, citySearch]);

  const completionStats = useMemo(() => {
    const fields = [
      profile.fullName,
      profile.classLevel,
      profile.school,
      profile.medium,
      profile.board,
      profile.country,
      profile.state,
      profile.city,
    ];
    const filled = fields.filter((v) => (v ?? "").trim().length > 0).length;
    const percentage = Math.round((filled / fields.length) * 100);
    return { filled, total: fields.length, percentage };
  }, [profile]);

  const profileComplete = completionStats.percentage === 100;

  const activeClassLevel = useMemo(() => {
    const num = Number(profile.classLevel);
    return Number.isFinite(num) && num > 0 ? num : null;
  }, [profile.classLevel]);

  const filteredScoreHistory = useMemo(
    () =>
      [...scoreHistory]
        .map(normalizeScoreEntry)
        .filter((entry) => doesAttemptMatchClass(entry, activeClassLevel))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [scoreHistory, activeClassLevel]
  );

  const scoreSummary = useMemo(
    () => buildScoreSummary(filteredScoreHistory),
    [filteredScoreHistory]
  );

  useEffect(() => {
    if (getStoredAuthRole() === "teacher") {
      navigate("/teacher-dashboard", { replace: true });
      return;
    }

    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const createProfileState = (data: any): ProfileForm => ({
      fullName: data.fullName || data.displayName || user.displayName || "",
      emailAddress: data.emailAddress || user.email || "",
      classLevel:
        data.classLevel !== null && data.classLevel !== undefined
          ? String(data.classLevel)
          : "",
      school: data.school || "",
      medium: data.medium || "",
      board: data.board || "",
      country: data.country || "",
      state: data.state || "",
      city: data.city || "",
    });

    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`/api/student-profile?userId=${encodeURIComponent(user.uid)}`, {
          credentials: "include",
          headers: {
            "Accept": "application/json",
          },
        });

        if (res.status === 404) {
          const fallbackProfile = createProfileState({});
          setProfile(fallbackProfile);
          setInitialProfile(fallbackProfile);
          return;
        }

        if (!res.ok) {
          let errText = res.statusText;
          try {
            const contentType = res.headers.get("content-type") || "";
            if (contentType.includes("application/json")) {
              const errJson = await res.json();
              errText = errJson.error || errJson.message || res.statusText;
            } else {
              const rawText = await res.text();
              errText = rawText ? rawText.slice(0, 300) : res.statusText;
            }
          } catch {}
          throw new Error(errText);
        }

        const data = await res.json();
        const nextProfile = createProfileState(data);
        setProfile(nextProfile);
        setInitialProfile(nextProfile);
      } catch (err: any) {
        console.error("Load profile failed:", err);
        setError(t("profile_load_failed"));
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, t]);

  useEffect(() => {
    if (!user) {
      setScoreHistory(loadScoreHistory());
      return;
    }

    let cancelled = false;

    const loadHistory = async () => {
      const localHistory = loadScoreHistory();

      try {
        const remoteHistory = await loadRemoteScoreHistory(user.uid);
        if (cancelled) return;
        setScoreHistory(mergeScoreHistoryEntries(remoteHistory, localHistory));
      } catch (err) {
        console.warn("Failed to load score history for profile", err);
        if (!cancelled) {
          setScoreHistory(localHistory);
        }
      }
    };

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleChange = (field: keyof ProfileForm, value: string) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setError("");

    try {
      if (!profile.fullName.trim()) {
        setError("Full name is required.");
        return;
      }

      let parsedClassLevel: number | null = null;
      if (profile.classLevel.trim()) {
        const digits = profile.classLevel.replace(/\D+/g, "");
        if (digits) {
          const num = parseInt(digits, 10);
          if (Number.isFinite(num) && num > 0) {
            parsedClassLevel = num;
          }
        }
      }

      const res = await apiRequest("POST", "/api/student-profile", {
        userId: user.uid,
        fullName: profile.fullName.trim(),
        displayName: profile.fullName.trim(),
        classLevel: parsedClassLevel,
        school: profile.school.trim() || null,
        medium: profile.medium.trim() || null,
        board: profile.board.trim() || null,
        country: profile.country.trim() || null,
        state: profile.state.trim() || null,
        city: profile.city.trim() || null,
      });

      const savedProfile = await res.json();
      const updatedProfile: ProfileForm = {
        fullName: savedProfile.fullName ?? savedProfile.displayName ?? profile.fullName,
        emailAddress: savedProfile.emailAddress ?? profile.emailAddress,
        classLevel:
          savedProfile.classLevel !== null && savedProfile.classLevel !== undefined
            ? String(savedProfile.classLevel)
            : profile.classLevel,
        school: savedProfile.school ?? profile.school,
        medium: savedProfile.medium ?? profile.medium,
        board: savedProfile.board ?? profile.board,
        country: savedProfile.country ?? profile.country,
        state: savedProfile.state ?? profile.state,
        city: savedProfile.city ?? profile.city,
      };

      setProfile(updatedProfile);
      setInitialProfile(updatedProfile);

      if (profile.fullName && profile.fullName !== user.displayName) {
        await updateProfile(user, { displayName: profile.fullName });
      }

      toast({
        title: t("profile_save_success"),
        description: t("profile_save_success_desc"),
      });
    } catch (err: any) {
      console.error("Save profile failed:", err);
      const displayMsg = err?.message || err?.error || t("profile_save_error");
      setError(displayMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Loading State */}
        {loading ? (
          <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
            <Card className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                  <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t("loading_profile")}</p>
            </Card>
          </div>
        ) : !user ? (
          /* Logged-Out Login Prompts */
          <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md items-center">
            <Card className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25">
                  <UserPen className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  {t("student_profile_title")}
                </CardTitle>
                <CardDescription className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {t("student_profile_description")}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <Button
                  type="button"
                  onClick={() => navigate("/teacher-auth")}
                  variant="outline"
                  className="h-11 w-full rounded-xl border-slate-200 bg-white font-semibold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <GraduationCap className="mr-2 h-4 w-4" />
                  {t("teacher_login")}
                </Button>

                <SignInWithGoogle role="student" />
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Main Logged-In Profile Dashboard */
          <div className="space-y-6">
            {/* Top Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/", { replace: true })}
                className="rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("back_home")}
              </Button>

              <div className="flex items-center gap-2">
                <Badge className={profileComplete ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold text-xs" : "bg-amber-50 text-amber-700 border-amber-200 font-semibold text-xs"}>
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  {completionStats.percentage}% Profile Complete
                </Badge>
              </div>
            </div>

            {/* Student Hero Header Banner */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-xl sm:p-8">
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
              <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />

              <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:text-left">
                <div className="relative shrink-0">
                  <div className="h-24 w-24 overflow-hidden rounded-2xl border-4 border-white/20 bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl sm:h-28 sm:w-28 flex items-center justify-center text-3xl font-black text-white">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || t("profile")}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (profile.fullName || user.displayName || "S").charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-slate-950 text-white">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 font-bold uppercase tracking-wider text-[10px]">
                      Student Dashboard
                    </Badge>
                    <Badge className="bg-white/10 text-slate-200 border-white/15 font-semibold text-[11px]">
                      {getProviderName(user)}
                    </Badge>
                  </div>

                  <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl truncate">
                    {formatValue(profile.fullName || user.displayName)}
                  </h1>

                  <p className="text-sm font-mono text-slate-300 truncate">
                    {formatValue(profile.emailAddress || user.email)}
                  </p>

                  <div className="flex flex-wrap justify-center gap-2 pt-2 sm:justify-start">
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 backdrop-blur">
                      <GraduationCap className="h-3.5 w-3.5 text-cyan-400" />
                      {getClassLabel(profile.classLevel, t)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 backdrop-blur">
                      <BookOpen className="h-3.5 w-3.5 text-blue-400" />
                      {getBoardLabel(profile.board, t)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 backdrop-blur">
                      <Globe2 className="h-3.5 w-3.5 text-violet-400" />
                      {getMediumLabel(profile.medium, t)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Completion Progress Bar */}
              <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300">
                <span>Profile completion status ({completionStats.filled} of {completionStats.total} fields filled)</span>
                <div className="w-full sm:w-48 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${completionStats.percentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Profile Overview & Edit Form Layout */}
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
              {/* Left Column: Performance Report & Academic Footprint */}
              <div className="space-y-6">
                {/* Score Performance Card */}
                <Card className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-blue-600" />
                          {t("score_history")} & Performance
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500 mt-0.5">
                          {scoreSummary.attempts > 0 ? scoreSummary.trendLabel : t("score_history_empty_hint")}
                        </CardDescription>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setScoreHistoryOpen(true)}
                        className="rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm"
                      >
                        {t("view_full_report")}
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                          <Trophy className="h-3.5 w-3.5 text-amber-500" />
                          <p className="text-[10px] font-bold uppercase tracking-wider">{t("attempts")}</p>
                        </div>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{scoreSummary.attempts}</p>
                      </div>

                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                          <p className="text-[10px] font-bold uppercase tracking-wider">{t("average_score")}</p>
                        </div>
                        <p className="text-2xl font-black text-emerald-600">{scoreSummary.averagePercentage}%</p>
                      </div>

                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                          <Target className="h-3.5 w-3.5 text-blue-500" />
                          <p className="text-[10px] font-bold uppercase tracking-wider">{t("best_score")}</p>
                        </div>
                        <p className="text-2xl font-black text-blue-600">{scoreSummary.bestPercentage}%</p>
                      </div>

                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                          <BookOpen className="h-3.5 w-3.5 text-violet-500" />
                          <p className="text-[10px] font-bold uppercase tracking-wider">{t("latest_score")}</p>
                        </div>
                        <p className="text-2xl font-black text-violet-600">
                          {filteredScoreHistory[0]
                            ? `${filteredScoreHistory[0].score}/${filteredScoreHistory[0].maxScore}`
                            : "0/0"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Academic Footprint Card */}
                <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/50">
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-cyan-600" />
                      Academic Details & Location
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Detailed view of your enrolled academic track and regional details.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5 text-cyan-500" />
                        {t("class_level")}
                      </p>
                      <p className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-white">{getClassLabel(profile.classLevel, t)}</p>
                    </div>

                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-blue-500" />
                        {t("school")}
                      </p>
                      <p className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-white truncate">{formatValue(profile.school)}</p>
                    </div>

                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Globe2 className="h-3.5 w-3.5 text-violet-500" />
                        {t("medium")}
                      </p>
                      <p className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-white">{getMediumLabel(profile.medium, t)}</p>
                    </div>

                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                        {t("education_board")}
                      </p>
                      <p className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-white">{getBoardLabel(profile.board, t)}</p>
                    </div>

                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Compass className="h-3.5 w-3.5 text-emerald-500" />
                        {t("country")}
                      </p>
                      <p className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-white truncate">{formatValue(profile.country)}</p>
                    </div>

                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-rose-500" />
                        State & City
                      </p>
                      <p className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {[profile.city, profile.state].filter(Boolean).join(", ") || "Not set"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Edit Profile Form */}
              <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                      <UserPen className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                        {t("edit_profile")}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        {t("profile_edit_desc")}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  {error ? (
                    <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  ) : null}

                  {/* Form Grid */}
                  <div className="space-y-3.5">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <Label htmlFor="fullName" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {t("full_name")} <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="fullName"
                        value={profile.fullName}
                        onChange={(e) => handleChange("fullName", e.target.value)}
                        disabled={loading}
                        placeholder="Enter full name"
                        className="h-10 rounded-xl border-slate-200 bg-slate-50/50 text-sm focus-visible:bg-white focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
                      />
                    </div>

                    {/* Class Level & Medium */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="classLevel" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {t("class_level")} <span className="text-rose-500">*</span>
                        </Label>
                        <Select
                          value={String(profile.classLevel ?? "")}
                          onValueChange={(value) => handleChange("classLevel", value)}
                          disabled={loading}
                        >
                          <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-slate-50/50 text-sm focus-visible:bg-white focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800">
                            <SelectValue placeholder={t("select_class")} />
                          </SelectTrigger>
                          <SelectContent>
                            {CLASS_OPTIONS.map((cls) => (
                              <SelectItem key={cls} value={String(cls)}>
                                {t(`class_${cls}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="medium" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {t("medium")} <span className="text-rose-500">*</span>
                        </Label>
                        <Select
                          value={profile.medium}
                          onValueChange={(value) => handleChange("medium", value)}
                          disabled={loading}
                        >
                          <SelectTrigger id="medium" className="h-10 rounded-xl border-slate-200 bg-slate-50/50 text-sm focus-visible:bg-white focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800">
                            <SelectValue placeholder={t("select_medium")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="English">{t("medium_english")}</SelectItem>
                            <SelectItem value="Hindi">{t("medium_hindi")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* School Name */}
                    <div className="space-y-1.5">
                      <Label htmlFor="school" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {t("school")} <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="school"
                        value={profile.school}
                        onChange={(e) => handleChange("school", e.target.value)}
                        disabled={loading}
                        placeholder="Enter school name"
                        className="h-10 rounded-xl border-slate-200 bg-slate-50/50 text-sm focus-visible:bg-white focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
                      />
                    </div>

                    {/* Board */}
                    <div className="space-y-1.5">
                      <Label htmlFor="board" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {t("education_board")} <span className="text-rose-500">*</span>
                      </Label>
                      <Select
                        value={profile.board}
                        onValueChange={(value) => handleChange("board", value)}
                        disabled={loading}
                      >
                        <SelectTrigger id="board" className="h-10 rounded-xl border-slate-200 bg-slate-50/50 text-sm focus-visible:bg-white focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800">
                          <SelectValue placeholder={t("select_board")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CBSE">{t("board_cbse")}</SelectItem>
                          <SelectItem value="RBSE">{t("board_rbse")}</SelectItem>
                          <SelectItem value="ICSE">{t("board_icse")}</SelectItem>
                          <SelectItem value="State Board">{t("board_state")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Country Selector */}
                    <div className="space-y-1.5">
                      <Label htmlFor="country" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {t("country")} <span className="text-rose-500">*</span>
                      </Label>
                      <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="h-10 w-full justify-start rounded-xl border-slate-200 bg-slate-50/50 text-sm font-normal dark:border-slate-700 dark:bg-slate-800"
                          >
                            <MapPin className="mr-2 h-3.5 w-3.5 text-slate-400" />
                            {profile.country || "Select Country"}
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-full p-0">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Search Country..."
                              value={countrySearch}
                              onValueChange={setCountrySearch}
                              autoComplete="off"
                            />
                            <CommandList ref={countryListRef} className="max-h-56 overflow-auto">
                              <CommandEmpty>No Country Found.</CommandEmpty>
                              <CommandGroup>
                                {filteredCountries.map((country) => (
                                  <CommandItem
                                    key={country}
                                    onSelect={() => {
                                      handleChange("country", country);
                                      setCountryOpen(false);
                                      setCountrySearch("");
                                    }}
                                  >
                                    {country}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* State & City Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* State Selector */}
                      <div className="space-y-1.5">
                        <Label htmlFor="state" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {t("state")} <span className="text-rose-500">*</span>
                        </Label>
                        <Popover open={stateOpen} onOpenChange={setStateOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="h-10 w-full justify-start rounded-xl border-slate-200 bg-slate-50/50 text-sm font-normal dark:border-slate-700 dark:bg-slate-800"
                            >
                              <span className="truncate">{profile.state || "Select State"}</span>
                            </Button>
                          </PopoverTrigger>

                          <PopoverContent className="w-full p-0">
                            <Command shouldFilter={false}>
                              <CommandInput
                                placeholder="Search State..."
                                value={stateSearch}
                                onValueChange={setStateSearch}
                                autoComplete="off"
                              />
                              <CommandList ref={stateListRef} className="max-h-56 overflow-auto">
                                <CommandEmpty>No State Found.</CommandEmpty>
                                <CommandGroup>
                                  {filteredStates.map((state) => (
                                    <CommandItem
                                      key={state}
                                      onSelect={() => {
                                        handleChange("state", state);
                                        setStateOpen(false);
                                        setStateSearch("");
                                      }}
                                    >
                                      {state}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* City Selector */}
                      <div className="space-y-1.5">
                        <Label htmlFor="city" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {t("city")} <span className="text-rose-500">*</span>
                        </Label>
                        <Popover open={cityOpen} onOpenChange={setCityOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="h-10 w-full justify-start rounded-xl border-slate-200 bg-slate-50/50 text-sm font-normal dark:border-slate-700 dark:bg-slate-800"
                            >
                              <span className="truncate">{profile.city || "Select City"}</span>
                            </Button>
                          </PopoverTrigger>

                          <PopoverContent className="w-full p-0">
                            <Command shouldFilter={false}>
                              <CommandInput
                                placeholder="Search City..."
                                value={citySearch}
                                onValueChange={setCitySearch}
                                autoComplete="off"
                              />
                              <CommandList ref={cityListRef} className="max-h-56 overflow-auto">
                                <CommandEmpty>No City Found.</CommandEmpty>
                                <CommandGroup>
                                  {filteredCities.map((city) => (
                                    <CommandItem
                                      key={city}
                                      onSelect={() => {
                                        handleChange("city", city);
                                        setCityOpen(false);
                                        setCitySearch("");
                                      }}
                                    >
                                      {city}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>

                  {/* Form Action Buttons */}
                  <div className="pt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (initialProfile) {
                          setProfile(initialProfile);
                        } else if (user) {
                          setProfile((current) => ({
                            ...current,
                            fullName: user.displayName || "",
                            emailAddress: user.email || "",
                          }));
                        }
                      }}
                      disabled={loading || saving}
                      className="h-10 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
                      {t("reset")}
                    </Button>

                    <Button
                      onClick={handleSave}
                      disabled={loading || saving}
                      className="h-10 rounded-xl bg-blue-600 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                    >
                      {saving ? (
                        <>
                          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                            <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                          </svg>
                          {t("saving")}
                        </>
                      ) : (
                        <>
                          <Save className="mr-1.5 h-3.5 w-3.5" />
                          {t("save_changes")}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      <ScoreHistoryReportDialog
        open={scoreHistoryOpen}
        onOpenChange={setScoreHistoryOpen}
        entries={filteredScoreHistory}
        activeClassLevel={activeClassLevel}
      />
    </div>
  );
}
