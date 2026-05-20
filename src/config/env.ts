import dotenv from 'dotenv';

import { loadEnv } from './env.schema';

dotenv.config();

export const env = loadEnv(process.env);
