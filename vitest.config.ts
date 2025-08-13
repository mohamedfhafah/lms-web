import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      server: fileURLToPath(new URL("./server", import.meta.url)),
      src: fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
