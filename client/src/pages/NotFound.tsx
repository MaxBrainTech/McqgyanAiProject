import { useTranslation } from "react-i18next";
import { Trans } from "react-i18next";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Home,
  SearchX,
  BookOpen,
  GraduationCap,
  Pencil,
  Bot,
  Brain,
  FileText,
} from "lucide-react";

export default function NotFound() {
    const { t } = useTranslation();
  return (
    <div
      className="
      relative
      flex
      items-center
      justify-center
      overflow-hidden
      bg-gradient-to-br
      from-blue-50
      via-white
      to-indigo-50
      dark:from-slate-950
      dark:via-slate-900
      dark:to-slate-950
      "
      style={{
        minHeight: "calc(100vh - 80px)",
      }}
    >
      {/* ===================== */}
      {/* Background Blur */}
      {/* ===================== */}

      <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-400/15 blur-3xl" />

      <div className="absolute -right-40 bottom-0 h-[430px] w-[430px] rounded-full bg-indigo-400/15 blur-3xl" />

      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-300/10 blur-3xl" />

      {/* ===================== */}
      {/* Floating Education Icons */}
      {/* ===================== */}

      <div className="pointer-events-none absolute inset-0">

        <BookOpen
          className="absolute left-[7%] top-[15%] h-10 w-10 text-blue-500/65 animate-pulse"
        />

        <GraduationCap
          className="absolute right-[30%] top-[12%] h-10 w-10 text-indigo-500/65 animate-pulse"
        />

        <Pencil
          className="absolute left-[4%] bottom-[15%] h-10 w-10 text-sky-500/65 animate-pulse"
        />

        <Bot
          className="absolute right-[5%] bottom-[22%] h-11 w-11 text-indigo-500/65 animate-pulse"
        />

        <Brain
          className="absolute left-[15%] top-[48%] h-10 w-10 text-blue-500/65 animate-pulse"
        />

        <FileText
          className="absolute right-[27%] top-[45%] h-10 w-10 text-sky-500/65 animate-pulse"
        />
      </div>

      {/* ===================== */}
      {/* MCQ Letters */}
      {/* ===================== */}

      <div className="pointer-events-none absolute inset-0">

        <span className="absolute left-[25%] top-[22%] text-8xl font-black text-blue-500/[0.2]">
          A
        </span>

        <span className="absolute right-[10%] top-[22%] text-8xl font-black text-indigo-500/[0.2]">
          B
        </span>

        <span className="absolute left-[20%] bottom-[18%] text-8xl font-black text-sky-500/[0.2]">
          C
        </span>

        <span className="absolute right-[22%] bottom-[15%] text-8xl font-black text-blue-500/[0.2]">
          D
        </span>
        <span className="absolute left-[4%] top-[40%] text-6xl font-bold text-indigo-500/55 animate-pulse">
            ?
        </span>
        <span className="absolute right-[15%] bottom-[35%] text-6xl font-bold text-indigo-500/55 animate-pulse">
         ?
        </span>

      </div>

      {/* ===================== */}
      {/* Main Content */}
      {/* ===================== */}

      <div className="relative z-10 flex max-w-2xl flex-col items-center px-6 text-center">

        {/* Icon */}

        <div className="relative mt-8 mb-8">

          <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl" />

          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/20 transition-all duration-300 hover:scale-105">

            <SearchX className="h-11 w-11 text-white" />

          </div>

        </div>

        {/* 404 */}

        <h1 className="bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 bg-clip-text text-8xl font-black tracking-tight  text-transparent drop-shadow-lg">

          404

        </h1>

        <h2 className="mt-4 text-4xl font-bold text-slate-900 dark:text-white">

          {t("notFound.title")}

        </h2>

        <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600 dark:text-slate-300">

          {t("notFound.description")}

        </p>
                {/* Buttons */}

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">

          <Link
            to="/"
            className="
              group
              inline-flex
              items-center
              gap-2
              rounded-xl
              bg-gradient-to-r
              from-blue-600
              to-indigo-600
              px-6
              py-3
              font-semibold
              text-white
              shadow-lg
              shadow-blue-500/20
              transition-all
              duration-300
              hover:scale-105
              hover:shadow-2xl
              hover:shadow-blue-500/30
            "
          >
            <Home
              size={20}
              className="transition-transform duration-300 group-hover:scale-110"
            />
           {t("notFound.home")}
          </Link>

          <button
            onClick={() => window.history.back()}
            className="
              group
              inline-flex
              items-center
              gap-2
              rounded-xl
              border
              border-slate-300
              bg-white/70
              px-6
              py-3
              font-semibold
              text-slate-700
              backdrop-blur-sm
              transition-all
              duration-300
              hover:scale-105
              hover:bg-white
              hover:shadow-lg
              dark:border-slate-700
              dark:bg-slate-900/70
              dark:text-white
              dark:hover:bg-slate-800
            "
          >
            <ArrowLeft
              size={20}
              className="transition-transform duration-300 group-hover:-translate-x-1"
            />
             {t("notFound.back")}
          </button>

        </div>

        {/* Small Footer Text */}

        <div className="mt-8 pb-6">

          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            <Trans
                i18nKey="notFound.footer"
                components={{
                1: (
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text font-semibold text-transparent" />
                ),
                }}
            />
            </p>

        </div>

      </div>

    </div>
  );
}