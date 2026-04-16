import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { join, extname } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PORT = Number(process.env.PORT) || 5173;
const distDir = join(__dirname, "dist", "public");

const mimeTypes = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
};

const server = createServer((req, res) => {
  let urlPath = req.url.split("?")[0];
  let filePath = join(distDir, urlPath);

  if (!existsSync(filePath) || urlPath === "/") {
    filePath = join(distDir, "index.html");
  }

  const ext = extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || "application/octet-stream";

  try {
    const content = readFileSync(filePath);
    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000",
    });
    res.end(content);
  } catch {
    const index = readFileSync(join(distDir, "index.html"));
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(index);
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Sofa King serving on port ${PORT}`);
});
