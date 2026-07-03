import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    "auth/index": "server/auth.ts",
    "auth/helpers": "lib/auth-helpers.ts",
    "auth-client/index": "lib/auth-client.ts",
    "db/index": "server/db/index.ts",
    "db/schema": "server/db/schema.ts",
    "config/env": "config/env.ts",
    "types/auth/loginSchema": "types/auth/loginSchema.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  outDir: "dist",
  external: ["react", "react-dom", "next", "next/headers", "next/navigation"],
  tsconfig: "tsconfig.build.json",
})
