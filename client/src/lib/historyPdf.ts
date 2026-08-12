import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  type ScoreHistoryEntry,
  type ScoreInsightSnapshot,
  type ScoreSubjectBreakdown,
  buildScoreSummary,
} from "@/lib/scoreHistory";

type GenerateHistoryPdfOptions = {
  entry: ScoreHistoryEntry;
  history: ScoreHistoryEntry[];
  insights: ScoreInsightSnapshot;
  subjectBreakdown: ScoreSubjectBreakdown[];
  labels: {
    appName: string;
    title: string;
    subject: string;
    class: string;
    score: string;
    accuracy: string;
    attempts: string;
    improvement: string;
    strongestSubject: string;
    weakestSubject: string;
    recommendations: string;
    weaknesses: string;
    subjectBreakdown: string;
    recentAttempts: string;
    generatedOn: string;
  };
};

export async function generateHistoryReportPdf({
  entry,
  history,
  insights,
  subjectBreakdown,
  labels,
}: GenerateHistoryPdfOptions) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const summary = buildScoreSummary(history);
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const headerHeight = 26;
  const footerHeight = 14;
  const bottomLimit = pageHeight - footerHeight - 6;

  const getSubjectName = (sub?: string) => {
    if (!sub) return "General";
    return sub.replace(/^school[_-]/i, "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const drawHeader = () => {
    // Header background
    pdf.setFillColor(15, 23, 42); // slate-900
    pdf.rect(0, 0, pageWidth, headerHeight, "F");

    // Accent line
    pdf.setFillColor(37, 99, 235); // blue-600
    pdf.rect(0, headerHeight, pageWidth, 1.5, "F");

    // App Name
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);
    pdf.text(labels.appName || "MCQGyaan AI", margin, 11);

    // Title / Subtitle
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(203, 213, 225); // slate-300
    pdf.text(labels.title || "Student Score History & Performance Report", margin, 19);

    // Date & Subject badge on right
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);
    const dateStr = entry.date || new Date().toLocaleString();
    pdf.text(dateStr, pageWidth - margin, 11, { align: "right" });

    const subjectStr = `${getSubjectName(entry.subject)}${entry.classLevel ? ` (Class ${entry.classLevel})` : ""}`;
    pdf.setTextColor(147, 197, 253); // blue-300
    pdf.setFont("helvetica", "bold");
    pdf.text(subjectStr, pageWidth - margin, 19, { align: "right" });
  };

  const drawFooter = (pageNumber: number, totalPages: number) => {
    const footerY = pageHeight - 7;
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.line(margin, pageHeight - footerHeight, pageWidth - margin, pageHeight - footerHeight);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(100, 116, 139); // slate-500
    pdf.text("MCQGyaan AI Performance Report", margin, footerY);
    pdf.text(`Page ${pageNumber} of ${totalPages}`, pageWidth / 2, footerY, { align: "center" });
    pdf.text("www.mcqgyaan.com", pageWidth - margin, footerY, { align: "right" });
  };

  const ensureSpace = (neededHeight: number, currentY: number): number => {
    if (currentY + neededHeight > bottomLimit) {
      pdf.addPage();
      drawHeader();
      return headerHeight + 10;
    }
    return currentY;
  };

  drawHeader();
  let y = headerHeight + 10;

  // --- 1. KEY METRICS SUMMARY CARDS ---
  const cards = [
    { label: labels.score || "Attempt Score", value: `${entry.score}/${entry.maxScore} (${Math.round(entry.percentage)}%)` },
    { label: labels.attempts || "Total Attempts", value: String(summary.attempts) },
    { label: labels.accuracy || "Avg Accuracy", value: `${summary.averagePercentage}%` },
    { label: labels.improvement || "Improvement", value: `${summary.improvement > 0 ? "+" : ""}${Math.round(summary.improvement)}%` },
  ];

  const gap = 4;
  const numCards = cards.length;
  const cardWidth = (contentWidth - gap * (numCards - 1)) / numCards;
  const cardHeight = 17;

  cards.forEach((card, idx) => {
    const cx = margin + idx * (cardWidth + gap);
    pdf.setFillColor(248, 250, 252); // slate-50
    pdf.setDrawColor(226, 232, 240); // slate-200
    pdf.setLineWidth(0.3);
    pdf.roundedRect(cx, y, cardWidth, cardHeight, 2.5, 2.5, "FD");

    pdf.setTextColor(100, 116, 139);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(card.label.toUpperCase(), cx + 4, y + 5.5);

    pdf.setTextColor(15, 23, 42);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(card.value, cx + 4, y + 13);
  });

  y += cardHeight + 8;

  // --- 2. SUBJECT BREAKDOWN TABLE ---
  if (subjectBreakdown && subjectBreakdown.length > 0) {
    y = ensureSpace(30, y);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(15, 23, 42);
    pdf.text(labels.subjectBreakdown || "Subject Breakdown", margin, y);
    y += 4;

    autoTable(pdf, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [[labels.subject || "Subject", labels.attempts || "Attempts", labels.accuracy || "Avg Score", "Best Score"]],
      body: subjectBreakdown.map((item) => [
        getSubjectName(item.subject),
        String(item.attempts),
        `${item.averagePercentage}%`,
        `${item.bestPercentage}%`,
      ]),
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 3,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [30, 58, 138], // blue-900
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    y = (pdf as any).lastAutoTable?.finalY ? (pdf as any).lastAutoTable.finalY + 8 : y + 30;
  }

  // --- 3. RECOMMENDATIONS & WEAKNESSES BOXES ---
  const recommendations = insights?.recommendations || [];
  const weaknesses = insights?.weaknesses || [];

  if (recommendations.length > 0) {
    y = ensureSpace(25, y);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(15, 23, 42);
    pdf.text(labels.recommendations || "AI Recommendations", margin, y);
    y += 4;

    // Draw recommendation card container
    let recLines: string[] = [];
    recommendations.forEach((rec) => {
      const wrapped = pdf.splitTextToSize(`• ${rec}`, contentWidth - 10);
      recLines = recLines.concat(wrapped);
    });

    const boxHeight = recLines.length * 4.5 + 6;
    y = ensureSpace(boxHeight + 4, y);

    pdf.setFillColor(240, 249, 255); // sky-50
    pdf.setDrawColor(186, 230, 253); // sky-200
    pdf.setLineWidth(0.3);
    pdf.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, "FD");

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(12, 74, 110); // sky-900

    let currentTextY = y + 5;
    recLines.forEach((line) => {
      pdf.text(line, margin + 5, currentTextY);
      currentTextY += 4.5;
    });

    y += boxHeight + 8;
  }

  if (weaknesses.length > 0) {
    y = ensureSpace(25, y);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(15, 23, 42);
    pdf.text(labels.weaknesses || "Areas for Improvement", margin, y);
    y += 4;

    let weakLines: string[] = [];
    weaknesses.forEach((weak) => {
      const wrapped = pdf.splitTextToSize(`• ${weak}`, contentWidth - 10);
      weakLines = weakLines.concat(wrapped);
    });

    const boxHeight = weakLines.length * 4.5 + 6;
    y = ensureSpace(boxHeight + 4, y);

    pdf.setFillColor(254, 242, 242); // rose-50
    pdf.setDrawColor(254, 202, 202); // rose-200
    pdf.setLineWidth(0.3);
    pdf.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, "FD");

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(153, 27, 27); // rose-800

    let currentTextY = y + 5;
    weakLines.forEach((line) => {
      pdf.text(line, margin + 5, currentTextY);
      currentTextY += 4.5;
    });

    y += boxHeight + 8;
  }

  // --- 4. RECENT ATTEMPTS TABLE ---
  if (history && history.length > 0) {
    y = ensureSpace(30, y);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(15, 23, 42);
    pdf.text(labels.recentAttempts || "Recent Attempt History", margin, y);
    y += 4;

    const recentHistory = [...history]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    autoTable(pdf, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Date & Time", labels.subject || "Subject", labels.score || "Score", labels.accuracy || "Accuracy"]],
      body: recentHistory.map((item) => [
        item.date || new Date(item.timestamp).toLocaleDateString(),
        getSubjectName(item.subject),
        `${item.score}/${item.maxScore}`,
        `${Math.round(item.percentage)}%`,
      ]),
      theme: "striped",
      styles: {
        font: "helvetica",
        fontSize: 8.5,
        cellPadding: 2.5,
        textColor: [30, 41, 59],
      },
      headStyles: {
        fillColor: [15, 118, 110], // teal-700
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8.5,
      },
    });
  }

  // Add footers on all pages
  const totalPages = pdf.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    drawFooter(p, totalPages);
  }

  const cleanSubject = getSubjectName(entry.subject).replace(/\s+/g, "-").toLowerCase();
  pdf.save(`mcqgyaan-score-report-${cleanSubject}.pdf`);
}
