import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Ignore generated outputs
  {
    ignores: ["src/generated/**"],
  },
  // Base Next.js configs
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Allow require() in JS (generated prisma wasm.js)
  {
    files: ["**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];

export default eslintConfig;
