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
  const margin = 14;
  let y = 18;
  const pageHeight = pdf.internal.pageSize.getHeight();
  const bottomLimit = pageHeight - margin;

  const ensureSpace = (lines = 1, lineHeight = 5.5) => {
    const needed = lines * lineHeight;
    if (y + needed > bottomLimit) {
      pdf.addPage();
      y = 18;
    }
  };

  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, pageWidth, 28, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(labels.appName, margin, 12);
  pdf.setFontSize(12);
  pdf.text(labels.title, margin, 21);
  pdf.text(new Date().toLocaleString(), pageWidth - margin, 21, { align: "right" });

  y = 38;
  const cards = [
    { label: labels.subject, value: entry.subject },
    { label: labels.class, value: entry.insights?.classLevel ? String(entry.insights.classLevel) : "—" },
    { label: labels.score, value: `${entry.score}/${entry.maxScore}` },
    { label: labels.accuracy, value: `${Math.round(entry.percentage)}%` },
    { label: labels.improvement, value: `${summary.improvement > 0 ? "+" : ""}${Math.round(summary.improvement)}%` },
  ];

  const cardWidth = (pageWidth - margin * 2 - 9) / 2;
  cards.forEach((card, index) => {
    const x = margin + (index % 2) * (cardWidth + 9);
    const cardY = y + Math.floor(index / 2) * 18;
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(x, cardY, cardWidth, 15, 2.5, 2.5, "FD");
    pdf.setTextColor(71, 85, 105);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(card.label, x + 4, cardY + 5);
    pdf.setTextColor(15, 23, 42);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text(String(card.value), x + 4, cardY + 11);
  });

  // advance y based on how many card rows were rendered to avoid overlap
  const cardRows = Math.ceil(cards.length / 2);
  const cardRowHeight = 18; // same value used when positioning cards above
  y += cardRows * cardRowHeight + 4; // small gap after cards

  autoTable(pdf, {
    startY: y,
    head: [[labels.subjectBreakdown, labels.attempts, labels.accuracy]],
    body: subjectBreakdown.map((item) => [
      item.subject,
      String(item.attempts),
      `${item.averagePercentage}%`,
    ]),
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235] },
  });

  y = (pdf as any).lastAutoTable?.finalY ? (pdf as any).lastAutoTable.finalY + 8 : y + 24;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(15, 23, 42);
  pdf.text(labels.recommendations, margin, y);
  y += 6;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  for (const item of insights.recommendations) {
    ensureSpace(1);
    pdf.text(`- ${item}`, margin, y);
    y += 5.5;
  }

  y += 3;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text(labels.weaknesses, margin, y);
  y += 6;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  for (const item of insights.weaknesses) {
    ensureSpace(1);
    pdf.text(`- ${item}`, margin, y);
    y += 5.5;
  }

  y += 4;
  ensureSpace(2);
  autoTable(pdf, {
    startY: y,
    head: [[labels.recentAttempts, labels.accuracy]],
    body: [...history]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)
      .map((item) => [item.date, `${Math.round(item.percentage)}%`]),
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [15, 118, 110] },
  });

  // update y in case the table continued on another page
  y = (pdf as any).lastAutoTable?.finalY ? (pdf as any).lastAutoTable.finalY + 8 : y;

  pdf.save(`mcqgyaan-score-report-${entry.subject.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
