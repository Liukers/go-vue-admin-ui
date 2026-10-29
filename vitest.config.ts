import { defineConfig } from "vitest/config";
import { alias } from "./build/utils";

export default defineConfig({
  resolve: {
    alias
  },
  test: {
    environment: "happy-dom",
    include: ["tests/**/*.test.ts"]
  }
});
