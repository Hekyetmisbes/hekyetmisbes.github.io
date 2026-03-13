import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

function slashRedirectPlugin() {
  const redirect = (req, res, next) => {
    if (req.url === "/easter-egg") {
      res.statusCode = 302;
      res.setHeader("Location", "/easter-egg/");
      res.end();
      return;
    }

    next();
  };

  return {
    name: "slash-redirect-plugin",
    configureServer(server) {
      server.middlewares.use(redirect);
    },
    configurePreviewServer(server) {
      server.middlewares.use(redirect);
    }
  };
}

export default defineConfig({
  plugins: [react(), slashRedirectPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        easterEgg: fileURLToPath(new URL("./easter-egg/index.html", import.meta.url))
      }
    }
  }
});
