// import express, { type Request, Response, NextFunction } from "express";
// import dotenv from "dotenv";
// import "dotenv/config";
// import { registerRoutes } from "./routes";
// import { setupVite, serveStatic, log } from "./vite";

// dotenv.config(); // ✅ LOAD .env

// const app = express();

// declare module "http" {
//   interface IncomingMessage {
//     rawBody?: unknown;
//   }
// }

// app.use(express.json({
//   limit: "50mb",
//   verify: (req, _res, buf) => {
//     req.rawBody = buf;
//   }
// }));

// app.use(express.urlencoded({ extended: false, limit: "50mb" }));

// app.use((req, res, next) => {
//   const start = Date.now();
//   const path = req.path;
//   let capturedJsonResponse: Record<string, any> | undefined;

//   const originalResJson = res.json;
//   res.json = function (bodyJson, ...args) {
//     capturedJsonResponse = bodyJson;
//     return originalResJson.apply(res, [bodyJson, ...args]);
//   };

//   res.on("finish", () => {
//     const duration = Date.now() - start;
//     if (path.startsWith("/api")) {
//       let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
//       if (capturedJsonResponse) {
//         logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
//       }
//       if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
//       log(logLine);
//     }
//   });

//   next();
// });

// (async () => {
//   const server = await registerRoutes(app);

//   app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
//     res.status(err.status || 500).json({
//       message: err.message || "Internal Server Error",
//     });
//     throw err;
//   });

//   if (app.get("env") === "development") {
//     await setupVite(app, server);
//   } else {
//     serveStatic(app);
//   }

//   const port = parseInt(process.env.PORT || "5000", 10);

//   server.listen(
//     {
//       port,
//       host: "0.0.0.0",
//       reusePort: true,
//     },
//     () => log(`🚀 serving on http://localhost:${port}`)
//   );
// })();

// import express, { type Request, Response, NextFunction } from "express";
// import dotenv from "dotenv";
// import "dotenv/config";
// import { registerRoutes } from "./routes";
// import { setupVite, serveStatic, log } from "./vite";

// import { generateMCQs } from "./openai";

// dotenv.config(); // ✅ LOAD .env

// const app = express();

// declare module "http" {
//   interface IncomingMessage {
//     rawBody?: unknown;
//   }
// }

// app.use(
//   express.json({
//     limit: "50mb",
//     verify: (req, _res, buf) => {
//       req.rawBody = buf;
//     },
//   })
// );

// app.use(express.urlencoded({ extended: false, limit: "50mb" }));

// app.use((req, res, next) => {
//   const start = Date.now();
//   const path = req.path;
//   let capturedJsonResponse: Record<string, any> | undefined;

//   const originalResJson = res.json;
//   res.json = function (bodyJson, ...args) {
//     capturedJsonResponse = bodyJson;
//     return originalResJson.apply(res, [bodyJson, ...args]);
//   };

//   res.on("finish", () => {
//     const duration = Date.now() - start;
//     if (path.startsWith("/api")) {
//       let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
//       if (capturedJsonResponse) {
//         logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
//       }
//       if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
//       log(logLine);
//     }
//   });

//   next();
// });

// (async () => {
//   const server = await registerRoutes(app);

//   app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
//     res.status(err.status || 500).json({
//       message: err.message || "Internal Server Error",
//     });
//   });

//   if (app.get("env") === "development") {
//     await setupVite(app, server);
//   } else {
//     serveStatic(app);
//   }

//   // ✅ WINDOWS SAFE LISTEN
//   const port = parseInt(process.env.PORT || "5000", 10);
//   const host = "127.0.0.1";

//   server.listen(port, host, () => {
//     log(`🚀 serving on http://${host}:${port}`);
//   });
// })();

// import express, { type Request, Response, NextFunction } from "express";
// import dotenv from "dotenv";
// import { registerRoutes } from "./routes";
// import { setupVite, serveStatic, log } from "./vite";

// import router from "./routes";

// const app = express();

// app.use(express.json());
// app.use(router);

// app.listen(5000, () => {
//   console.log("Server running on port 5000");
// });

// dotenv.config();

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // rawBody support
// declare module "http" {
//   interface IncomingMessage {
//     rawBody?: unknown;
//   }
// }

// // body parsers
// app.use(
//   express.json({
//     limit: "50mb",
//     verify: (req, _res, buf) => {
//       (req as any).rawBody = buf;
//     },
//   })
// );

import express, { type Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

dotenv.config();

console.log("DATABASE_URL:", process.env.DATABASE_URL);


const app = express();

// body parsers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

// logging middleware
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
  const server = await registerRoutes(app);

  // error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    res.status(err.status || 500).json({
      message: err.message || "Internal Server Error",
    });
  });

  // 🔥 THIS IS IMPORTANT FOR FRONTEND + BACKEND SAME PORT
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT) || 5000;

  server.listen(port, "0.0.0.0", () => {
    log(`🚀 serving on port ${port}`);
  });
})();

// app.use(express.urlencoded({ extended: false, limit: "50mb" }));

// logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      log(logLine);
    }
  });

  next();
});

// (async () => {
//   // ✅ REGISTER ROUTES
//   const server = await registerRoutes(app);

//   // error handler
//   app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
//     res.status(err.status || 500).json({
//       message: err.message || "Internal Server Error",
//     });
//   });

//   // vite / static
//   if (app.get("env") === "development") {
//     await setupVite(app, server);
//   } else {
//     serveStatic(app);
//   }

//   // ✅ SINGLE LISTEN (IMPORTANT)
//   const port = parseInt(process.env.PORT || "5000", 10);
//   const host = "127.0.0.1";

//   server.listen(port, host, () => {
//     log(`🚀 serving on http://${host}:${port}`);
//   });
// })();

// ✅ AUTO PORT FALLBACK (EADDRINUSE SAFE)
// const DEFAULT_PORT = Number(process.env.PORT) || 5000;
// const host = "127.0.0.1";

// function startServer(port: number) {
//   server.once("error", (err: any) => {
//     if (err.code === "EADDRINUSE") {
//       log(`⚠️ Port ${port} busy, trying ${port + 1}...`);
//       startServer(port + 1);
//     } else {
//       throw err;
//     }
//   });

//   server.listen(port, host, () => {
//     log(`🚀 serving on http://${host}:${port}`);
//   });
// }

// startServer(DEFAULT_PORT);
// })();
