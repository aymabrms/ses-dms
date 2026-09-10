import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/.expo/**",
      "**/android/**",
      "**/ios/**"
    ]
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [tseslint.configs.recommended]
  }
);
