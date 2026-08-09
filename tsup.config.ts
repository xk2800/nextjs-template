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
    "types/auth/signupSchema": "types/auth/signupSchema.ts",
    "activity/logger": "lib/activity-logger.ts",
    "activity/queries": "lib/activity-queries.ts",
    "sessions/queries": "lib/session-queries.ts",
    "admin/queries": "lib/admin-queries.ts",
    "users/queries": "lib/user-queries.ts",
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
