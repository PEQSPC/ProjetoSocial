
import {defineConfig,env} from 'prisma/config';
import dotenv from 'dotenv';
// Load environment variables
dotenv.config();
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env(process.env.NODE_ENV === 'production' ? 'DATABASE_URL' : 'DATABASE_URL_LOCAL')
  }
});