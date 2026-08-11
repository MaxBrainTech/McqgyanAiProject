import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import session from "express-session";
import MemoryStoreFactory from "memorystore";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { ensureBaseTables } from "./db";

dotenv.config();

console.log("DATABASE_URL:", process.env.DATABASE_URL);

const app = express();
const MemoryStore = MemoryStoreFactory(session);
const isProduction = process.env.NODE_ENV === "production";
const sessionMiddleware = session as unknown as (
  options: any,
) => express.RequestHandler;

app.set("trust proxy", 1);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));
app.use(
  sessionMiddleware({
    name: "mcqgyaan.admin.sid",
    secret:
      process.env.ADMIN_SESSION_SECRET ||
      process.env.SESSION_SECRET ||
      "mcqgyaan-admin-session-dev-secret",
    store: new MemoryStore({
      checkPeriod: 24 * 60 * 60 * 1000,
    }),
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      maxAge: 8 * 60 * 60 * 1000,
    },
  }),
);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

(async () => {
  await ensureBaseTables();
  const server = await registerRoutes(app);
  log("✔ Registered admin email routes: POST /api/admin/send-email, GET /api/admin/email-health");

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    res.status(err.status || 500).json({
      message: err.message || "Internal Server Error",
    });
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT) || 5001;

  server.listen(port, "0.0.0.0", () => {
    log(`🚀 serving on port ${port}`);
  });
})();
