import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  globalIgnores([
    "**/*",
    "!eslint-dummy.js",
  ]),
]);

export default eslintConfig;
