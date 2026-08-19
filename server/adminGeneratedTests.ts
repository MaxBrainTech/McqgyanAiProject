import type { Express, Request, Response } from "express";
import { requireAdminSession } from "./adminAuth";
import { storage } from "./storage";
import { generateGeneratedTestsExcel, type ExportTestData } from "./services/excelGenerator";

export function registerAdminGeneratedTestRoutes(app: Express) {
  // 1. Get paginated & filtered generated tests + dashboard stats
  app.get("/api/admin/generated-tests", requireAdminSession, async (req: Request, res: Response) => {
    try {
      const {
        classLevel,
        subject,
        chapterTopic,
        difficulty,
        medium,
        board,
        testType,
        testMode,
        studentId,
        search,
        dateFrom,
        dateTo,
        page,
        limit,
      } = req.query;

      const parsedClass =
        classLevel !== undefined && classLevel !== null && classLevel !== "" && classLevel !== "all"
          ? Number(classLevel)
          : null;

      const filterParams = {
        classLevel: parsedClass != null && !isNaN(parsedClass) ? parsedClass : null,
        subject: subject ? String(subject) : null,
        chapterTopic: chapterTopic ? String(chapterTopic) : null,
        difficulty: difficulty ? String(difficulty) : null,
        medium: medium ? String(medium) : null,
        board: board ? String(board) : null,
        testType: testType ? String(testType) : null,
        testMode: testMode ? String(testMode) : null,
        studentId: studentId ? String(studentId) : null,
        search: search ? String(search) : null,
        dateFrom: dateFrom ? String(dateFrom) : null,
        dateTo: dateTo ? String(dateTo) : null,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      };

      const result = await storage.getGeneratedTests(filterParams);
      const stats = await storage.getGeneratedTestStats();

      return res.json({
        ...result,
        stats,
      });
    } catch (error: any) {
      console.error("[ADMIN GENERATED TESTS GET ERROR]", error);
      return res.status(500).json({ error: error.message || "Failed to fetch generated tests" });
    }
  });

  // 2. Standalone Stats Endpoint
  app.get("/api/admin/generated-tests/stats", requireAdminSession, async (_req: Request, res: Response) => {
    try {
      const stats = await storage.getGeneratedTestStats();
      return res.json(stats);
    } catch (error: any) {
      console.error("[ADMIN GENERATED TESTS STATS ERROR]", error);
      return res.status(500).json({ error: error.message || "Failed to fetch stats" });
    }
  });

  // 3. Export Single Test to Excel
  app.get("/api/admin/generated-tests/:id/export", requireAdminSession, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const testWithQuestions = await storage.getGeneratedTestWithQuestions(id);

      if (!testWithQuestions) {
        return res.status(404).json({ error: "Generated test not found" });
      }

      const excelBuffer = generateGeneratedTestsExcel([testWithQuestions]);
      const filename = `MCQGyaan_Test_${id}.xlsx`;

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", excelBuffer.length);
      return res.send(excelBuffer);
    } catch (error: any) {
      console.error("[ADMIN SINGLE TEST EXPORT ERROR]", error);
      return res.status(500).json({ error: error.message || "Failed to export test" });
    }
  });

  // 4. Export Bulk / Filtered Tests to Excel
  app.get("/api/admin/generated-tests/export", requireAdminSession, async (req: Request, res: Response) => {
    try {
      const {
        ids,
        classLevel,
        subject,
        chapterTopic,
        difficulty,
        medium,
        board,
        testType,
        testMode,
        studentId,
        search,
        dateFrom,
        dateTo,
      } = req.query;

      let idList: string[] | undefined = undefined;
      if (ids) {
        idList = String(ids)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      const parsedClass =
        classLevel !== undefined && classLevel !== null && classLevel !== "" && classLevel !== "all"
          ? Number(classLevel)
          : null;

      const filterParams = {
        ids: idList,
        classLevel: parsedClass != null && !isNaN(parsedClass) ? parsedClass : null,
        subject: subject ? String(subject) : null,
        chapterTopic: chapterTopic ? String(chapterTopic) : null,
        difficulty: difficulty ? String(difficulty) : null,
        medium: medium ? String(medium) : null,
        board: board ? String(board) : null,
        testType: testType ? String(testType) : null,
        testMode: testMode ? String(testMode) : null,
        studentId: studentId ? String(studentId) : null,
        search: search ? String(search) : null,
        dateFrom: dateFrom ? String(dateFrom) : null,
        dateTo: dateTo ? String(dateTo) : null,
        page: 1,
        limit: 500, // Export up to 500 tests at once
      };

      const result = await storage.getGeneratedTests(filterParams);
      if (!result.tests || result.tests.length === 0) {
        return res.status(404).json({ error: "No matching generated tests found to export" });
      }

      const exportItems: ExportTestData[] = [];
      for (const test of result.tests) {
        const item = await storage.getGeneratedTestWithQuestions(test.id);
        if (item) {
          exportItems.push(item);
        }
      }

      const excelBuffer = generateGeneratedTestsExcel(exportItems);
      const filename = `MCQGyaan_Generated_Tests_${Date.now()}.xlsx`;

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", excelBuffer.length);
      return res.send(excelBuffer);
    } catch (error: any) {
      console.error("[ADMIN BULK EXPORT ERROR]", error);
      return res.status(500).json({ error: error.message || "Failed to export tests" });
    }
  });

  // 5. Preview Single Test + Questions
  app.get("/api/admin/generated-tests/:id", requireAdminSession, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = await storage.getGeneratedTestWithQuestions(id);

      if (!data) {
        return res.status(404).json({ error: "Generated test not found" });
      }

      return res.json(data);
    } catch (error: any) {
      console.error("[ADMIN PREVIEW TEST ERROR]", error);
      return res.status(500).json({ error: error.message || "Failed to fetch test details" });
    }
  });

  // 6. Delete Single Test
  app.delete("/api/admin/generated-tests/:id", requireAdminSession, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteGeneratedTest(id);

      if (!success) {
        return res.status(404).json({ error: "Generated test not found or already deleted" });
      }

      return res.json({ success: true, message: "Generated test deleted successfully" });
    } catch (error: any) {
      console.error("[ADMIN DELETE TEST ERROR]", error);
      return res.status(500).json({ error: error.message || "Failed to delete test" });
    }
  });
}
