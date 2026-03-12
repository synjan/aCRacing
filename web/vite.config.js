import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const SERVER_IP = "46.225.176.106";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api/trackday": {
        target: `http://${SERVER_IP}:9680`,
        changeOrigin: true,
        rewrite: () => "/INFO",
      },
      "/api/mx5cup": {
        target: `http://${SERVER_IP}:9690`,
        changeOrigin: true,
        rewrite: () => "/INFO",
      },
      "/api/gt3": {
        target: `http://${SERVER_IP}:9700`,
        changeOrigin: true,
        rewrite: () => "/INFO",
      },
      "/data": {
        target: `http://${SERVER_IP}:8080`,
        changeOrigin: true,
      },
    },
  },
});
