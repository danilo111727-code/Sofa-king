import { defineConfig } from "vite";
  import react from "@vitejs/plugin-react";
  import tailwindcss from "@tailwindcss/vite";
  import path from "path";
  import { fileURLToPath } from "url";

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const isDev = process.env.NODE_ENV !== "production";
  const basePath = process.env.BASE_PATH || "/";

  export default defineConfig({
    base: basePath,
    plugins: [
      react(),
      tailwindcss(),
      ...(isDev && process.env.REPL_ID !== undefined
        ? [
            (await import("@replit/vite-plugin-runtime-error-modal")).default(),
            await import("@replit/vite-plugin-cartographer").then((m) =>
              m.cartographer({
                root: path.resolve(__dirname, ".."),
              }),
            ),
            await import("@replit/vite-plugin-dev-banner").then((m) =>
              m.devBanner(),
            ),
          ]
        : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
      dedupe: ["react", "react-dom"],
    },
    root: __dirname,
    build: {
      outDir: path.resolve(__dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      port: Number(process.env.PORT) || 3000,
      host: "0.0.0.0",
      allowedHosts: true,
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
    preview: {
      port: Number(process.env.PORT) || 3000,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  });
  