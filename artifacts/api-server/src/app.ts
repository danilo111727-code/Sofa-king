import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Serve Sofa King static files
const sofaKingDist = path.resolve(__dirname, "../../deploy-guide/dist/public");
if (existsSync(sofaKingDist)) {
  app.use(express.static(sofaKingDist));
  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(sofaKingDist, "index.html"));
  });
}

export default app;
