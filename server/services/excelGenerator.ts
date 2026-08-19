import zlib from "zlib";
import type { GeneratedTest, GeneratedTestQuestion } from "@shared/schema";

type ZipFileEntry = {
  filename: string;
  data: Buffer;
};

// CRC32 calculation table
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[i] = c;
}

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createZipArchive(files: ZipFileEntry[]): Buffer {
  const localHeaders: Buffer[] = [];
  const centralHeaders: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const filenameBuf = Buffer.from(file.filename, "utf8");
    const uncompressedData = file.data;
    const crc = crc32(uncompressedData);
    const compressedData = zlib.deflateRawSync(uncompressedData);

    // Local file header (30 bytes + filename length + compressed data)
    const localHeader = Buffer.alloc(30 + filenameBuf.length);
    localHeader.writeUInt32LE(0x04034b50, 0); // Signature
    localHeader.writeUInt16LE(20, 4); // Version
    localHeader.writeUInt16LE(0, 6); // Flags
    localHeader.writeUInt16LE(8, 8); // Deflate
    localHeader.writeUInt16LE(0, 10); // Time
    localHeader.writeUInt16LE(0, 12); // Date
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressedData.length, 18);
    localHeader.writeUInt32LE(uncompressedData.length, 22);
    localHeader.writeUInt16LE(filenameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);
    filenameBuf.copy(localHeader, 30);

    // Central directory header (46 bytes + filename length)
    const centralHeader = Buffer.alloc(46 + filenameBuf.length);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressedData.length, 20);
    centralHeader.writeUInt32LE(uncompressedData.length, 24);
    centralHeader.writeUInt16LE(filenameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    filenameBuf.copy(centralHeader, 46);

    localHeaders.push(localHeader, compressedData);
    centralHeaders.push(centralHeader);

    offset += localHeader.length + compressedData.length;
  }

  const centralDirOffset = offset;
  let centralDirSize = 0;
  for (const ch of centralHeaders) {
    centralDirSize += ch.length;
  }

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(centralHeaders.length, 8);
  eocd.writeUInt16LE(centralHeaders.length, 10);
  eocd.writeUInt32LE(centralDirSize, 12);
  eocd.writeUInt32LE(centralDirOffset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
}

function escapeXml(str: any): string {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
}

function getColumnLetter(colIndex: number): string {
  let letter = "";
  let temp = colIndex;
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
}

function formatDate(val: any): string {
  if (!val) return "N/A";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return String(val);
  }
}

export type ExportTestData = {
  test: GeneratedTest;
  questions: GeneratedTestQuestion[];
};

export function generateGeneratedTestsExcel(items: ExportTestData[]): Buffer {
  // Styles definitions:
  // style 0: Normal default
  // style 1: Header style (bold white text on #1E293B slate fill, centered)
  // style 2: Data text cell (thin border, top-left aligned, wrapText)
  // style 3: Data centered cell (thin border, top-centered aligned, wrapText)

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font>
      <sz val="10"/>
      <name val="Calibri"/>
    </font>
    <font>
      <b/>
      <sz val="11"/>
      <color rgb="FFFFFFFF"/>
      <name val="Calibri"/>
    </font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1E293B"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFD1D5DB"/></left>
      <right style="thin"><color rgb="FFD1D5DB"/></right>
      <top style="thin"><color rgb="FFD1D5DB"/></top>
      <bottom style="thin"><color rgb="FFD1D5DB"/></bottom>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="4">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1">
      <alignment vertical="top" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="top" wrapText="1"/>
    </xf>
  </cellXfs>
</styleSheet>`;

  // --- SHEET 1: QUESTIONS ---
  const qHeaders = [
    { title: "Test ID", width: 20, center: true },
    { title: "Student Name", width: 22, center: false },
    { title: "Student Email", width: 26, center: false },
    { title: "Class", width: 10, center: true },
    { title: "Subject", width: 18, center: false },
    { title: "Chapter/Topic", width: 26, center: false },
    { title: "Medium", width: 12, center: true },
    { title: "Difficulty", width: 12, center: true },
    { title: "Test Type", width: 12, center: true },
    { title: "Test Mode", width: 12, center: true },
    { title: "Question No.", width: 12, center: true },
    { title: "Question", width: 50, center: false },
    { title: "Option A", width: 25, center: false },
    { title: "Option B", width: 25, center: false },
    { title: "Option C", width: 25, center: false },
    { title: "Option D", width: 25, center: false },
    { title: "Correct Option", width: 14, center: true },
    { title: "Correct Answer", width: 25, center: false },
    { title: "Explanation", width: 45, center: false },
    { title: "Generated At", width: 22, center: true },
  ];

  let sheet1RowsXml = "";
  sheet1RowsXml += `<row r="1" ht="28" customHeight="1">`;
  qHeaders.forEach((h, colIdx) => {
    const cellRef = `${getColumnLetter(colIdx + 1)}1`;
    sheet1RowsXml += `<c r="${cellRef}" t="inlineStr" s="1"><is><t>${escapeXml(h.title)}</t></is></c>`;
  });
  sheet1RowsXml += `</row>`;

  let rowCounter = 2;
  items.forEach(({ test, questions }) => {
    const qList = questions && questions.length > 0 ? questions : [
      {
        questionNumber: 1,
        question: "N/A",
        optionA: "N/A",
        optionB: "N/A",
        optionC: "N/A",
        optionD: "N/A",
        correctOption: "N/A",
        correctAnswer: "N/A",
        explanation: "N/A",
      } as any,
    ];

    qList.forEach((q) => {
      sheet1RowsXml += `<row r="${rowCounter}" customHeight="0">`;
      const rowValues: Array<{ val: any; isNum?: boolean; center?: boolean }> = [
        { val: test.id, center: true },
        { val: test.studentName || "Student", center: false },
        { val: test.studentEmail || "N/A", center: false },
        { val: test.classLevel != null ? `Class ${test.classLevel}` : "N/A", center: true },
        { val: test.subject || "N/A", center: false },
        { val: test.chapterTopic || "N/A", center: false },
        { val: test.medium || "English", center: true },
        { val: test.difficulty || "Medium", center: true },
        { val: test.testType || "MCQ", center: true },
        { val: test.testMode || "Practice", center: true },
        { val: q.questionNumber ?? 1, isNum: true, center: true },
        { val: q.question || "N/A", center: false },
        { val: q.optionA || "N/A", center: false },
        { val: q.optionB || "N/A", center: false },
        { val: q.optionC || "N/A", center: false },
        { val: q.optionD || "N/A", center: false },
        { val: q.correctOption || "N/A", center: true },
        { val: q.correctAnswer || "N/A", center: false },
        { val: q.explanation || "N/A", center: false },
        { val: formatDate(test.createdAt), center: true },
      ];

      rowValues.forEach((cellData, colIdx) => {
        const cellRef = `${getColumnLetter(colIdx + 1)}${rowCounter}`;
        const styleId = cellData.center ? "3" : "2";
        if (cellData.isNum && typeof cellData.val === "number") {
          sheet1RowsXml += `<c r="${cellRef}" s="${styleId}"><v>${cellData.val}</v></c>`;
        } else {
          sheet1RowsXml += `<c r="${cellRef}" t="inlineStr" s="${styleId}"><is><t>${escapeXml(cellData.val)}</t></is></c>`;
        }
      });

      sheet1RowsXml += `</row>`;
      rowCounter++;
    });
  });

  const lastRowSheet1 = Math.max(1, rowCounter - 1);
  const sheet1ColsXml = qHeaders
    .map((h, i) => `<col min="${i + 1}" max="${i + 1}" width="${h.width}" customWidth="1"/>`)
    .join("");

  const sheet1Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews>
    <sheetView tabSelected="1" workbookViewId="0">
      <pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>
    </sheetView>
  </sheetViews>
  <cols>${sheet1ColsXml}</cols>
  <sheetData>${sheet1RowsXml}</sheetData>
  <autoFilter ref="A1:T${lastRowSheet1}"/>
</worksheet>`;

  // --- SHEET 2: TEST SUMMARY ---
  const sHeaders = [
    { title: "Test ID", width: 20, center: true },
    { title: "Student Name", width: 22, center: false },
    { title: "Student Email", width: 26, center: false },
    { title: "Class", width: 10, center: true },
    { title: "Subject", width: 18, center: false },
    { title: "Chapter/Topic", width: 26, center: false },
    { title: "Medium", width: 12, center: true },
    { title: "Board", width: 12, center: true },
    { title: "Difficulty", width: 12, center: true },
    { title: "Test Type", width: 12, center: true },
    { title: "Question Count", width: 14, center: true },
    { title: "Generated At", width: 22, center: true },
  ];

  let sheet2RowsXml = "";
  sheet2RowsXml += `<row r="1" ht="28" customHeight="1">`;
  sHeaders.forEach((h, colIdx) => {
    const cellRef = `${getColumnLetter(colIdx + 1)}1`;
    sheet2RowsXml += `<c r="${cellRef}" t="inlineStr" s="1"><is><t>${escapeXml(h.title)}</t></is></c>`;
  });
  sheet2RowsXml += `</row>`;

  items.forEach(({ test, questions }, idx) => {
    const rNum = idx + 2;
    sheet2RowsXml += `<row r="${rNum}" customHeight="0">`;
    const rowValues: Array<{ val: any; isNum?: boolean; center?: boolean }> = [
      { val: test.id, center: true },
      { val: test.studentName || "Student", center: false },
      { val: test.studentEmail || "N/A", center: false },
      { val: test.classLevel != null ? `Class ${test.classLevel}` : "N/A", center: true },
      { val: test.subject || "N/A", center: false },
      { val: test.chapterTopic || "N/A", center: false },
      { val: test.medium || "English", center: true },
      { val: test.board || "CBSE", center: true },
      { val: test.difficulty || "Medium", center: true },
      { val: test.testType || "MCQ", center: true },
      { val: test.questionCount || questions?.length || 0, isNum: true, center: true },
      { val: formatDate(test.createdAt), center: true },
    ];

    rowValues.forEach((cellData, colIdx) => {
      const cellRef = `${getColumnLetter(colIdx + 1)}${rNum}`;
      const styleId = cellData.center ? "3" : "2";
      if (cellData.isNum && typeof cellData.val === "number") {
        sheet2RowsXml += `<c r="${cellRef}" s="${styleId}"><v>${cellData.val}</v></c>`;
      } else {
        sheet2RowsXml += `<c r="${cellRef}" t="inlineStr" s="${styleId}"><is><t>${escapeXml(cellData.val)}</t></is></c>`;
      }
    });

    sheet2RowsXml += `</row>`;
  });

  const lastRowSheet2 = Math.max(1, items.length + 1);
  const sheet2ColsXml = sHeaders
    .map((h, i) => `<col min="${i + 1}" max="${i + 1}" width="${h.width}" customWidth="1"/>`)
    .join("");

  const sheet2Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews>
    <sheetView workbookViewId="0">
      <pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>
    </sheetView>
  </sheetViews>
  <cols>${sheet2ColsXml}</cols>
  <sheetData>${sheet2RowsXml}</sheetData>
  <autoFilter ref="A1:L${lastRowSheet2}"/>
</worksheet>`;

  // --- WORKBOOK & RELS ---
  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Questions" sheetId="1" r:id="rId1"/>
    <sheet name="Test Summary" sheetId="2" r:id="rId2"/>
  </sheets>
</workbook>`;

  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const files: ZipFileEntry[] = [
    { filename: "[Content_Types].xml", data: Buffer.from(contentTypesXml, "utf8") },
    { filename: "_rels/.rels", data: Buffer.from(relsXml, "utf8") },
    { filename: "xl/workbook.xml", data: Buffer.from(workbookXml, "utf8") },
    { filename: "xl/_rels/workbook.xml.rels", data: Buffer.from(workbookRelsXml, "utf8") },
    { filename: "xl/styles.xml", data: Buffer.from(stylesXml, "utf8") },
    { filename: "xl/worksheets/sheet1.xml", data: Buffer.from(sheet1Xml, "utf8") },
    { filename: "xl/worksheets/sheet2.xml", data: Buffer.from(sheet2Xml, "utf8") },
  ];

  return createZipArchive(files);
}
