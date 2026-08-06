import {
  BookOpen,
  GraduationCap,
  Pencil,
  Bot,
  Brain,
  FileText,
} from "lucide-react";

export default function FloatingIcons() {
  return (
    <div className="hidden lg:block">
      {/* ===================== */}
      {/* Background Glow */}
      {/* ===================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div className="absolute -left-40 top-20 h-72 w-72 rounded-full bg-blue-400/20 blur-[120px]" />

        <div className="absolute -right-32 bottom-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-[120px]" />

      </div>

      {/* ===================== */}
      {/* Floating Icons */}
      {/* ===================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <BookOpen
          className="absolute left-[6%] top-[15%]
          h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10
          text-blue-500/60 animate-float"
          style={{ animationDelay: "0s" }}
        />

        <GraduationCap
          className="absolute right-[25%] top-[10%]
          hidden md:block
          h-10 w-10
          text-indigo-500/60 animate-float"
          style={{ animationDelay: "1s" }}
        />

        <Pencil
          className="absolute left-[3%] bottom-[18%]
          h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10
          text-sky-500/60 animate-float"
          style={{ animationDelay: "2s" }}
        />

        <Bot
          className="absolute right-[5%] bottom-[18%]
          h-8 w-8 sm:h-9 sm:w-9 lg:h-11 lg:w-11
          text-indigo-500/60 animate-float"
          style={{ animationDelay: "3s" }}
        />

        <Brain
          className="absolute left-[14%] top-[48%]
          hidden md:block
          h-10 w-10
          text-blue-500/60 animate-float"
          style={{ animationDelay: "4s" }}
        />

        <FileText
          className="absolute right-[25%] top-[45%]
          hidden lg:block
          h-10 w-10
          text-sky-500/60 animate-float"
          style={{ animationDelay: "5s" }}
        />

      </div>

      {/* ===================== */}
      {/* MCQ Letters */}
      {/* ===================== */}

      <div className="pointer-events-none absolute inset-0 hidden lg:block overflow-hidden">

        <span className="absolute left-[22%] top-[20%] text-8xl font-black text-blue-500/15">
          A
        </span>

        <span className="absolute right-[10%] top-[22%] text-8xl font-black text-indigo-500/15">
          B
        </span>

        <span className="absolute left-[18%] bottom-[18%] text-8xl font-black text-sky-500/15">
          C
        </span>

        <span className="absolute right-[20%] bottom-[16%] text-8xl font-black text-blue-500/15">
          D
        </span>

        <span
          className="absolute left-[5%] top-[40%] text-6xl font-bold text-indigo-400/40 animate-float"
          style={{ animationDelay: "1s" }}
        >
          ?
        </span>

        <span
          className="absolute right-[12%] bottom-[34%] text-6xl font-bold text-indigo-400/40 animate-float"
          style={{ animationDelay: "2s" }}
        >
          ?
        </span>

      </div>
   </div>
  );
}