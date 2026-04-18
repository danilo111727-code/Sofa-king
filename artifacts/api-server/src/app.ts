import express, { type Express } from "express";
  import cors from "cors";
  import pinoHttp from "pino-http";
  import { clerkMiddleware } from "@clerk/express";
  import { existsSync } from "fs";
  import { join, dirname } from "path";
  import { fileURLToPath } from "url";
  import { CLERK_PROXY_PATH, clerkProxyMiddleware } from "./middlewares/clerkProxyMiddleware";
  import router from "./routes";
  import { logger } from "./lib/logger";

  const app: Express = express();

  // DEBUG: Raw ping before any middleware
  app.get("/ping", (_req, res) => {
    res.json({ pong: true, time: new Date().toISOString(), env: process.env.NODE_ENV });
  });

  app.use(
    pinoHttp({
      logger,
      serializers: {
        req(req) {
          return {
            id: req.id,
            method: req.method,
            url: req.url?.split("?")[0],
          };
        },
        res(res) {
          return {
            statusCode: res.statusCode,
          };
        },
      },
    }),
  );

  app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

  app.use(cors({ credentials: true, origin: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(clerkMiddleware());

  app.use("/api", router);

  if (process.env.NODE_ENV === "production") {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const frontendDist = join(__dirname, "..", "..", "sofa-king", "dist", "public");
    if (existsSync(frontendDist)) {
      app.use(express.static(frontendDist));
      app.get("/{*path}", (_req, res) => {
        res.sendFile(join(frontendDist, "index.html"));
      });
      logger.info({ frontendDist }, "Serving frontend static files");
    } else {
      logger.warn({ frontendDist }, "Frontend dist not found — skipping static file serving");
    }
  }

  // Global error handler - reveal actual error for debugging
  app.use((err: any, _req: any, res: any, _next: any) => {
    const msg = err?.message || String(err);
    const stack = err?.stack?.slice(0, 800) || "";
    logger.error({ err }, "Express error handler caught error");
    res.status(err?.status || 500).json({ error: msg, stack });
  });

  export default app;
  