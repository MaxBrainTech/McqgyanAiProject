import crypto from "crypto";
import type { Express, NextFunction, Request, Response } from "express";

type AdminSessionPayload = {
  email: string;
  authenticatedAt: string;
};

type AdminRequest = Request & {
  session: Request["session"] & {
    admin?: AdminSessionPayload;
  };
};

const getConfiguredAdminEmail = () =>
  String(process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();

const getConfiguredAdminPassword = () =>
  String(process.env.ADMIN_PASSWORD ?? "");

const safeCompare = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const buildAdminSession = (): AdminSessionPayload => ({
  email: getConfiguredAdminEmail(),
  authenticatedAt: new Date().toISOString(),
});

const isAdminConfigured = () =>
  Boolean(getConfiguredAdminEmail() && getConfiguredAdminPassword());

const isValidAdminCredentials = (email: string, password: string) => {
  const configuredEmail = getConfiguredAdminEmail();
  const configuredPassword = getConfiguredAdminPassword();

  if (!configuredEmail || !configuredPassword) {
    return false;
  }

  return (
    safeCompare(email.trim().toLowerCase(), configuredEmail) &&
    safeCompare(password, configuredPassword)
  );
};

export const requireAdminSession = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const adminReq = req as AdminRequest;

  if (adminReq.session.admin) {
    return next();
  }

  return res.status(401).json({ error: "Admin session required" });
};

export function registerAdminAuthRoutes(app: Express) {
  app.post("/api/admin/login", async (req, res) => {
    try {
      if (!isAdminConfigured()) {
        return res.status(500).json({
          error: "Admin authentication is not configured",
        });
      }

      const email = String(req.body?.email ?? "").trim();
      const password = String(req.body?.password ?? "");

      if (!email || !password) {
        return res.status(400).json({
          error: "Email and password are required",
        });
      }

      if (!isValidAdminCredentials(email, password)) {
        return res.status(401).json({
          error: "Invalid admin credentials",
        });
      }

      const adminReq = req as AdminRequest;

      await new Promise<void>((resolve, reject) => {
        adminReq.session.regenerate((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });

      const adminSession = buildAdminSession();
      adminReq.session.admin = adminSession;

      await new Promise<void>((resolve, reject) => {
        adminReq.session.save((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });

      return res.json({
        admin: adminSession,
        message: "Admin login successful",
      });
    } catch (error) {
      console.error("Admin login error:", error);
      return res.status(500).json({
        error: "Failed to authenticate admin",
      });
    }
  });

  app.get("/api/admin/session", (req, res) => {
    const adminReq = req as AdminRequest;

    if (!adminReq.session.admin) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    return res.json({
      admin: adminReq.session.admin,
    });
  });

  app.post("/api/admin/logout", (req, res) => {
    const adminReq = req as AdminRequest;

    adminReq.session.destroy((error) => {
      if (error) {
        console.error("Admin logout error:", error);
        return res.status(500).json({
          error: "Failed to end admin session",
        });
      }

      res.clearCookie("mcqgyaan.admin.sid");
      return res.json({
        success: true,
        message: "Admin logged out",
      });
    });
  });
}
