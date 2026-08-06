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
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getStoredAuthRole } from "@/lib/authSession";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  loadRemoteScoreHistory,
  loadScoreHistory,
  mergeScoreHistoryEntries,
  normalizeScoreEntry,
  resetRemoteScoreHistory,
  resetScoreHistory,
  type ScoreHistoryEntry,
} from "@/lib/scoreHistory";
import { TrendingUp, Target, Trophy, ArrowRight, BarChart3 } from "lucide-react";
import { getNames } from "country-list";

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
  if (providerId.includes("google")) return "Google";
  if (providerId.includes("password")) return "Email";
  return providerId;
};

const getStatusText = (user: User | null) => {
  if (!user) return "Not Available";
  return user.emailVerified ? "Verified" : "Not Verified";
};

const formatValue = (value: string | null | undefined) => value || "Not Available";

const getClassLabel = (classLevel: string, t: (key: string) => string) => {
  if (!classLevel.trim()) return "--";
  return t(`class_${classLevel}`) || `${t("class_level")} ${classLevel}`;
};

const getMediumLabel = (medium: string, t: (key: string) => string) => {
  if (!medium.trim()) return t("medium");
  if (medium.toLowerCase() === "english") return t("medium_english");
  if (medium.toLowerCase() === "hindi") return t("medium_hindi");
  return medium;
};

const getBoardLabel = (board: string, t: (key: string) => string) => {
  if (!board.trim()) return "Board";
  if (board.toLowerCase().includes("cbse")) return "CBSE";
  if (board.toLowerCase().includes("rbse")) return "RBSE";
  if (board.toLowerCase().includes("icse")) return "ICSE";
  if (board.toLowerCase().includes("state")) return "State";
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

  const isProfileComplete = () =>
    [
      profile.fullName,
      profile.classLevel,
      profile.school,
      profile.medium,
      profile.board,
      profile.country,
      profile.state,
      profile.city,
    ].every((value) => value.trim().length > 0);

  const profileComplete = isProfileComplete();
  const handleResetScoreHistory = async () => {
    resetScoreHistory();
    if (user) {
      try {
        await resetRemoteScoreHistory(user.uid);
      } catch (error) {
        console.warn("Failed to reset remote score history from profile", error);
      }
    }
    setScoreHistory([]);
  };
  const normalizedScoreHistory = useMemo(
    () =>
      [...scoreHistory]
        .map(normalizeScoreEntry)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [scoreHistory]
  );
  const scoreSummary = useMemo(
    () => buildScoreSummary(normalizedScoreHistory),
    [normalizedScoreHistory]
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
        });

        if (res.status === 404) {
          const fallbackProfile = createProfileState({});
          setProfile(fallbackProfile);
          setInitialProfile(fallbackProfile);
          return;
        }

        if (!res.ok) {
          throw new Error(await res.text());
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
      const requiredFields: Array<[string, string]> = [
        ["Full name", profile.fullName],
        ["Class", profile.classLevel],
        ["School", profile.school],
        ["Medium", profile.medium],
        ["Board", profile.board],
        ["Country", profile.country],
        ["State", profile.state],
        ["City", profile.city],
      ];

      const missingField = requiredFields.find(([, value]) => !value.trim());
      if (missingField) {
        setError(`${missingField[0]} is required.`);
        return;
      }

      const parsedClassLevel = Number(profile.classLevel);
      if (!Number.isInteger(parsedClassLevel) || parsedClassLevel <= 0) {
        setError("Class must be a valid number.");
        return;
      }

      const res = await apiRequest("POST", "/api/student-profile", {
        userId: user.uid,
        fullName: profile.fullName,
        displayName: profile.fullName,
        classLevel: parsedClassLevel,
        school: profile.school,
        medium: profile.medium,
        board: profile.board,
        country: profile.country,
        state: profile.state,
        city: profile.city,
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
      setError(t("profile_save_error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="relative min-h-screen overflow-x-hidden overflow-y-auto bg-slate-50 text-slate-900 transition-colors dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_30%),radial-gradient(circle_at_bottom,_rgba(99,102,241,0.18),_transparent_35%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] dark:text-slate-50"
      style={{
        backgroundImage: `
          radial-gradient(circle at 20% 10%, rgba(59,130,246,0.08), transparent 30%),
          radial-gradient(circle at 80% 80%, rgba(168,85,247,0.08), transparent 35%),
          radial-gradient(circle, rgba(100,116,139,0.38) 1.8px, transparent 2px)
        `,
        backgroundSize: `
          100% 100%,
          100% 100%,
          26px 26px
        `,
        backgroundAttachment: "fixed",
      }}
    >
      <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {!loading && !user ? (
          <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-2xl items-center">
            <Card className="w-full overflow-hidden rounded-[1.75rem] border border-blue-200/70 bg-white/95 p-6 shadow-2xl dark:border-blue-900/40 dark:bg-slate-950/85 sm:p-8">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-lg shadow-blue-500/30">
                  <UserPen className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-black text-slate-900 dark:text-slate-50 sm:text-3xl">
                  {t("student_profile_title")}
                </CardTitle>
                <CardDescription className="mt-2 text-slate-600 dark:text-slate-300">
                  {t("student_profile_description")}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <Button
                  type="button"
                  onClick={() => navigate("/teacher-auth")}
                  variant="outline"
                  className="h-12 w-full rounded-xl border-slate-200 bg-slate-50 font-semibold text-slate-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  <GraduationCap className="mr-2 h-4 w-4" />
                  {t("teacher_login")}
                </Button>

                <SignInWithGoogle role="student" />
              </CardContent>
            </Card>
          </div>
        ) : null}

        {loading && !user ? (
          <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
            <Card className="rounded-[1.5rem] border bg-card p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">{t("loading_profile")}</p>
            </Card>
          </div>
        ) : null}

        {user ? (
          <>
        <Button
          variant="outline"
          onClick={() => navigate("/", { replace: true })}
          className="mb-3 bg-white/85 text-slate-700 shadow-sm backdrop-blur-md transition-all hover:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("back_home")}
        </Button>

        {/* {showProfileWarning && !profileComplete && (
          <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900/50 dark:bg-blue-950/30">
            <p className="text-sm text-blue-700 dark:text-blue-200">
              {t("profile_complete_warning")}
              {" "}
              {t("profile_complete_warning_desc")}
            </p>
          </div>
        )} */}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-6">
          <Card className="overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-4 text-slate-900 shadow-md transition-all duration-300 hover:shadow-xl sm:p-6 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-50">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-xl text-slate-900 sm:text-2xl dark:text-slate-50">{t("my_profile")}</CardTitle>
              <CardDescription className="text-sm text-slate-600 sm:text-base dark:text-slate-300">
                {t("profile_desc")}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 p-4 pt-0 sm:space-y-6 sm:p-6">
              <div className="relative min-w-0 overflow-hidden rounded-[32px] bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-600 px-5 py-6 text-white shadow-2xl ring-1 ring-white/10 sm:min-h-[240px] sm:px-8 sm:py-10">
                <div className="absolute inset-0 bg-black/0 dark:bg-slate-950/10" />
                <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-white/10 blur-2xl" />

                <div className="relative flex flex-col gap-5 text-center sm:flex-row sm:items-center sm:text-left">
                  <div className="mx-auto h-24 w-24 overflow-hidden rounded-full border-[5px] border-white shadow-2xl ring-8 ring-white/10 transition-all duration-300 hover:scale-105 sm:mx-0 sm:h-32 sm:w-32">
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || t("profile")}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-pink-500 to-purple-600 text-4xl font-bold text-white">
                        {(profile.fullName || user?.displayName || "S").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium uppercase tracking-widest text-blue-100">
                      {t("welcome")}
                    </p>

                    <h2 className="mt-1 break-words text-2xl font-extrabold tracking-tight drop-shadow-md sm:text-3xl lg:text-4xl">
                      {formatValue(profile.fullName || user?.displayName)}
                    </h2>

                    <p className="mt-2 break-words text-sm text-blue-100 sm:text-base lg:text-lg">
                      {formatValue(profile.emailAddress || user?.email)}
                    </p>

                    <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start sm:gap-3">
                      <span className="flex min-w-0 items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-2 text-xs backdrop-blur-xl shadow-lg transition-all duration-300 hover:scale-105 hover:bg-white/25 sm:px-4 sm:text-sm">
                        <GraduationCap className="h-4 w-4" />
                        {getClassLabel(profile.classLevel, t)}
                      </span>
                      <span className="flex min-w-0 items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-2 text-xs backdrop-blur-xl shadow-lg transition-all duration-300 hover:scale-105 hover:bg-white/25 sm:px-4 sm:text-sm">
                        <BookOpen className="h-4 w-4" />
                        {getBoardLabel(profile.board, t)}
                      </span>
                      <span className="flex min-w-0 items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-2 text-xs backdrop-blur-xl shadow-lg transition-all duration-300 hover:scale-105 hover:bg-white/25 sm:px-4 sm:text-sm">
                        <Globe2 className="h-4 w-4" />
                        {getMediumLabel(profile.medium, t)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 p-4 text-slate-900 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-950 dark:text-slate-50">
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {t("login_provider")}
                  </p>
                  <p className="mt-2 text-base font-medium text-slate-900 dark:text-slate-50">
                    {getProviderName(user)}
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 p-4 text-slate-900 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-950 dark:text-slate-50">
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {t("account_status")}
                  </p>
                  <p className="mt-2 text-base font-medium text-slate-900 dark:text-slate-50">
                    {getStatusText(user)}
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-4 text-white shadow-[0_20px_60px_rgba(37,99,235,.22)] transition-all duration-300 hover:shadow-[0_24px_70px_rgba(37,99,235,.32)] sm:p-6 dark:border-slate-800">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-blue-50 backdrop-blur">
                      <BarChart3 className="h-3.5 w-3.5" />
                      {t("score_history")}
                    </div>
                    <h3 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
                      {t("overall_result")}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-50/90 sm:text-base">
                      {scoreSummary.attempts > 0
                        ? scoreSummary.trendLabel
                        : t("score_history_empty_hint")}
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setScoreHistoryOpen(true)}
                    className="w-full rounded-full bg-white px-5 text-slate-900 shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-xl sm:w-auto"
                  >
                    {t("view_full_report")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-white/15 p-3">
                        <Trophy className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-blue-50/80">
                          {t("attempts")}
                        </p>
                        <p className="mt-1 text-2xl font-black">
                          {scoreSummary.attempts}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-white/15 p-3">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-blue-50/80">
                          {t("average_score")}
                        </p>
                        <p className="mt-1 text-2xl font-black">
                          {scoreSummary.averagePercentage}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-white/15 p-3">
                        <Target className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-blue-50/80">
                          {t("best_score")}
                        </p>
                        <p className="mt-1 text-2xl font-black">
                          {scoreSummary.bestPercentage}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-white/15 p-3">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-blue-50/80">
                          {t("latest_score")}
                        </p>
                        <p className="mt-1 text-lg font-black">
                          {normalizedScoreHistory[0]
                            ? `${normalizedScoreHistory[0].score}/${normalizedScoreHistory[0].maxScore}`
                            : "0/0"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[32px] border border-slate-200/70 bg-white/80 text-slate-900 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,.08)] transition-all duration-300 hover:shadow-[0_25px_70px_rgba(59,130,246,.12)] dark:border-slate-800 dark:bg-slate-950/75 dark:text-slate-50">
            <CardHeader className="relative overflow-hidden rounded-[24px] border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-blue-50 p-4 shadow-sm sm:p-6 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />
              <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-violet-500/10 blur-3xl" />
              <div className="absolute inset-0 bg-white/40 dark:bg-slate-950/10" />

              <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-5 sm:text-left">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-500 to-violet-600 shadow-lg shadow-blue-500/30 sm:h-16 sm:w-16">
                  <UserPen className="h-7 w-7 text-white sm:h-8 sm:w-8" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <CardTitle className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl dark:text-slate-50">
                      {t("edit_profile")}
                    </CardTitle>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/70 dark:text-blue-200">
                      {t("student")}
                    </span>
                  </div>

                  <CardDescription className="mt-2 max-w-md text-sm leading-relaxed text-slate-500 sm:text-base dark:text-slate-300">
                    {t("profile_edit_desc")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 p-4 pt-0 sm:p-6">
              {error ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
                  {error}
                </div>
              ) : null}

              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200" htmlFor="fullName">
                      {t("full_name")}
                    </Label>
                    <Input
                      id="fullName"
                      value={profile.fullName}
                      onChange={(e) => handleChange("fullName", e.target.value)}
                      disabled={loading}
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-400 dark:focus:bg-slate-950"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200" htmlFor="classLevel">
                      {t("class_level")}
                    </Label>
                    <Select
                      value={String(profile.classLevel ?? "")}
                      onValueChange={(value) => handleChange("classLevel", value)}
                      disabled={loading}
                    >
                      <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50 transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:bg-slate-950">
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

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200" htmlFor="school">
                      {t("school")}
                    </Label>
                    <Input
                      id="school"
                      value={profile.school}
                      onChange={(e) => handleChange("school", e.target.value)}
                      disabled={loading}
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-400 dark:focus:bg-slate-950"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200" htmlFor="medium">
                      {t("medium")}
                    </Label>
                    <Select
                      value={profile.medium}
                      onValueChange={(value) => handleChange("medium", value)}
                      disabled={loading}
                    >
                      <SelectTrigger
                        id="medium"
                        className="h-12 rounded-xl border-slate-200 bg-slate-50 transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:bg-slate-950"
                      >
                        <SelectValue placeholder={t("select_medium")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">{t("medium_english")}</SelectItem>
                        <SelectItem value="Hindi">{t("medium_hindi")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200" htmlFor="board">
                      {t("education_board")}
                    </Label>
                    <Select
                      value={profile.board}
                      onValueChange={(value) => handleChange("board", value)}
                      disabled={loading}
                    >
                      <SelectTrigger
                        id="board"
                        className="h-12 rounded-xl border-slate-200 bg-slate-50 transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:bg-slate-950"
                      >
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

                  {/* <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200" htmlFor="country">
                      {t("country")}
                    </Label>
                    <Input
                      id="country"
                      value={profile.country}
                      onChange={(e) => handleChange("country", e.target.value)}
                      disabled={loading}
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-400 dark:focus:bg-slate-950"
                    />
                  </div> */}

                  <div className="space-y-2">
                    <Label
                      htmlFor="country"
                      className="text-sm font-semibold text-slate-700 dark:text-slate-200"
                    >
                      {t("country")}
                    </Label>

                    <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-12 w-full justify-start rounded-xl border-slate-200 bg-slate-50 font-normal"
                        >
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
                          autoCorrect="off"
                          spellCheck={false}
                        />

                        <CommandList
                          ref={countryListRef}
                          className="max-h-64 overflow-auto"
                        >
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

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200" htmlFor="state">
                      {t("state")}
                    </Label>
                    <Popover open={stateOpen} onOpenChange={setStateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-12 w-full justify-start rounded-xl border-slate-200 bg-slate-50 font-normal"
                        >
                          {profile.state || "Select State"}
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-full p-0">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Search State..."
                            value={stateSearch}
                            onValueChange={setStateSearch}
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                          />

                          <CommandList
                            ref={stateListRef}
                            className="max-h-64 overflow-auto"
                          >
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

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200" htmlFor="city">
                      {t("city")}
                    </Label>
                    <Popover open={cityOpen} onOpenChange={setCityOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-12 w-full justify-start rounded-xl border-slate-200 bg-slate-50 font-normal"
                        >
                          {profile.city || "Select City"}
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-full p-0">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Search City..."
                            value={citySearch}
                            onValueChange={setCitySearch}
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                          />

                          <CommandList
                            ref={cityListRef}
                            className="max-h-64 overflow-auto"
                          >
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

                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
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
                    className="h-12 w-full rounded-xl border-slate-200 bg-white px-6 font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 hover:shadow-md disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-50 sm:w-auto"
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    {t("reset")}
                  </Button>

                  <Button
                    onClick={handleSave}
                    disabled={loading || saving}
                    className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 px-7 font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/40 active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100 sm:w-auto"
                  >
                    {saving ? (
                      <>
                        <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            opacity="0.25"
                          />
                          <path
                            d="M22 12a10 10 0 00-10-10"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeLinecap="round"
                          />
                        </svg>
                        {t("saving")}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {t("save_changes")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
          </>
        ) : null}
      </div>

      <ScoreHistoryReportDialog
        open={scoreHistoryOpen}
        onOpenChange={setScoreHistoryOpen}
        entries={normalizedScoreHistory}
        onReset={handleResetScoreHistory}
      />
    </div>
  );
}
