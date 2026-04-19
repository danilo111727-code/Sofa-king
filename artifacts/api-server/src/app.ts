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

    // Serve static files (product images, hero, etc.) from public/
    const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
    app.use(express.static(publicDir));

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

  // Global error handler
  app.use((err: any, _req: any, res: any, _next: any) => {
    logger.error({ err }, "Unhandled Express error");
    res.status(err?.status || 500).json({ error: err?.message || "Internal Server Error" });
  });

  export default app;
  