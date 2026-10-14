const REQUIRED_ENV_VARS = ['DATABASE_URL', 'JWT_SECRET', 'PORT'] as const;

export function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    for (const key of missing) {
      console.error(`[envValidator] Missing required environment variable: ${key}`);
    }
    process.exit(1);
  }
}
