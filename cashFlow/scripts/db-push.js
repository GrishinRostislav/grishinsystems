const { execSync } = require('child_process');

function clean(url) {
  if (!url) return '';
  let cleaned = url.trim().replace(/^['"\\]+|['"\\]+$/g, '');
  const equalIdx = cleaned.indexOf('=');
  if (equalIdx !== -1 && equalIdx < 50) { 
    cleaned = cleaned.substring(equalIdx + 1);
  }
  cleaned = cleaned.trim().replace(/^['"\\]+|['"\\]+$/g, '');
  if (cleaned.startsWith('prisma+postgres://')) {
    cleaned = cleaned.replace('prisma+postgres://', 'postgres://');
  }
  return cleaned;
}

const env = { ...process.env };
if (env.POSTGRES_PRISMA_URL) {
  env.POSTGRES_PRISMA_URL = clean(env.POSTGRES_PRISMA_URL);
}
if (env.POSTGRES_URL_NON_POOLING) {
  env.POSTGRES_URL_NON_POOLING = clean(env.POSTGRES_URL_NON_POOLING);
}

try {
  console.log('[DB-PUSH] Syncing database schema with Prisma...');
  execSync('npx prisma db push --skip-generate', { env, stdio: 'inherit' });
  console.log('[DB-PUSH] Database schema sync successful!');
} catch (err) {
  console.warn('[DB-PUSH] Warning: Database schema sync bypassed:', err.message);
}
