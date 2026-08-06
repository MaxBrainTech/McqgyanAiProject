import { useEffect, useRef, useState } from "react";
import { Code2, GraduationCap, Clock3 } from "lucide-react";

interface TestTimerBarProps {
  endTime: string | null;
  shareCode: string;
  studentName: string;
  classLabel: string | number;
  durationMinutes: number;
  onTick?: (remainingSeconds: number) => void;
  onExpire?: () => void;
}

const formatCountdown = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
};

export default function TestTimerBar({
  endTime,
  shareCode,
  studentName,
  classLabel,
  durationMinutes,
  onTick,
  onExpire,
}: TestTimerBarProps) {

  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const hasExpiredRef = useRef(false);

  const totalSeconds = Math.max(1, Math.floor(durationMinutes * 60));
  const progressPercent = Math.max(
    0,
    Math.min(100, 100 - (remainingSeconds / totalSeconds) * 100)
  );

  useEffect(() => {
    if (!endTime) return;

    hasExpiredRef.current = false;

    const update = () => {
      const endMs = new Date(endTime).getTime();
      const nextRemaining = Math.max(
        0,
        Math.ceil((endMs - Date.now()) / 1000)
      );

      setRemainingSeconds(nextRemaining);
      onTick?.(nextRemaining);

      if (nextRemaining <= 0 && !hasExpiredRef.current) {
        hasExpiredRef.current = true;
        onExpire?.();
      }
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [endTime, onTick, onExpire]);

  const timeWarning = remainingSeconds <= 60;

  return (
    <div className="sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 py-3">

        {/* OUTER GRADIENT BORDER */}
        <div className="
          rounded-2xl p-[1.5px]
          bg-gradient-to-r from-indigo-400 via-blue-500 to-cyan-400
          shadow-[0_25px_60px_-20px_rgba(0,0,0,0.25)]
        ">

          {/* INNER GLASS CARD */}
          <div className="
            rounded-2xl px-5 py-4
            bg-white/85 dark:bg-zinc-900/85
            backdrop-blur-xl
            border border-white/30
            transition-transform duration-300 hover:scale-[1.01]
          ">

            {/* TOP ROW */}
            <div className="flex items-center justify-between">

              {/* LEFT SIDE */}
             <div className="flex items-center gap-4">

            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-semibold shadow-lg">
              {studentName[0]}
            </div>

            <div>

              {/* CODE BADGE */}
              <div className="flex items-center gap-2 mb-1 px-3 py-1 rounded-full bg-white/70 backdrop-blur border border-gray-200 shadow-sm w-fit">

                <Code2 className="w-3.5 h-3.5 text-indigo-500" />

                <span className="text-[11px] font-semibold text-indigo-600 tracking-widest">
                  {shareCode}
                </span>
              </div>

              {/* NAME */}
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {studentName}
              </h2>

              {/* CLASS + TIME */}
              <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">

                {/* Class */}
                <div className="flex items-center gap-1">
                  <GraduationCap className="w-4 h-4 text-indigo-500" />
                  <span>Class {classLabel}</span>
                </div>

                <span className="opacity-40">•</span>

                {/* Duration */}
                <div className="flex items-center gap-1">
                  <Clock3 className="w-4 h-4 text-indigo-500" />
                  <span>{durationMinutes} mins</span>
                </div>

              </div>
            </div>
          </div>

              {/* TIMER */}
              <div className="flex flex-col items-end">

                <div
                  className={`relative px-5 py-2 rounded-xl font-mono text-2xl tracking-widest
                  transition-all duration-300
                  ${
                    timeWarning
                      ? "bg-red-600 text-white shadow-[0_0_20px_rgba(255,0,0,0.5)]"
                      : "bg-black text-white shadow-[0_0_20px_rgba(0,0,0,0.4)]"
                  }`}
                >

                  {/* shine */}
                  <div className="absolute inset-0 rounded-xl bg-white/10 opacity-20"></div>

                  <span className="relative tabular-nums">
                    {formatCountdown(remainingSeconds)}
                  </span>
                </div>

                <span className="text-[15px] mt-1 text-gray-400">
                  Time Remaining
                </span>
              </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="mt-4 h-[4px] w-full bg-gray-200/50 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-linear
                ${
                  timeWarning
                    ? "bg-gradient-to-r from-red-500 via-orange-400 to-yellow-300"
                    : "bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

          </div>
        </div>

        {/* WARNING TEXT */}
        {timeWarning && (
          <p className="mt-2 text-center text-sm font-medium text-red-500">
            Last 60 seconds — auto submit incoming
          </p>
        )}
      </div>
    </div>
  );
}