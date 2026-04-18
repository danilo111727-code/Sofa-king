import { defineConfig } from "vite";
  import react from "@vitejs/plugin-react";
  import tailwindcss from "@tailwindcss/vite";
  import path from "path";
  import { fileURLToPath } from "url";

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const isDev = process.env.NODE_ENV !== "production";

  export default defineConfig({
    base: process.env.BASE_PATH || "/",
    plugins: [
      react(),
      tailwindcss(),
      ...(isDev && process.env.REPL_ID !== undefined
        ? [
            (await import("@replit/vite-plugin-runtime-error-modal")).default(),
            await import("@replit/vite-plugin-cartographer").then((m) =>
              m.cartographer({ root: path.resolve(__dirname, "..") }),
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
      outDir: path.resolve(__dirname, "dist"),
      emptyOutDir: true,
    },
    server: {
      port: 5173,
      host: "0.0.0.0",
      allowedHosts: true,
    },
    preview: {
      port: 4173,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  });
  