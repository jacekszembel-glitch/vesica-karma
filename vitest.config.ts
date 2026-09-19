import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Alias „@/” musi być znany także testom — bez tego moduły wyliczeń, które
 * sięgają po dane spoza lib/astro (np. lista miejscowości), nie dają się
 * w ogóle zaimportować w vitest.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    include: ["lib/**/*.test.ts"],
  },
});
