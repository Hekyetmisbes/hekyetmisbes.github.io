import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

function slashRedirectPlugin() {
  const redirect = (req, res, next) => {
    if (req.url === "/easter-egg" || req.url === "/theunlitdoor" || req.url === "/thefinalloop") {
      res.statusCode = 302;
      res.setHeader("Location", req.url + "/");
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
        easterEgg: fileURLToPath(new URL("./easter-egg/index.html", import.meta.url)),
        theUnlitDoor: fileURLToPath(new URL("./theunlitdoor/index.html", import.meta.url)),
        theFinalLoop: fileURLToPath(new URL("./thefinalloop/index.html", import.meta.url))
      }
    }
  }
});
