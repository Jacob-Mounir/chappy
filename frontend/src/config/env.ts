import { z } from 'zod';

const envSchema = z.object({
  VITE_WS_URL: z.string().url(),
  VITE_API_URL: z.string().url(),
  MODE: z.enum(['development', 'production']).default('development'),
});

const env = {
  SOCKET_URL: import.meta.env.VITE_WS_URL,
  API_URL: import.meta.env.VITE_API_URL,
  NODE_ENV: import.meta.env.MODE,
} as const;

export const validateEnv = () => {
  try {
    envSchema.parse({
      VITE_WS_URL: env.SOCKET_URL,
      VITE_API_URL: env.API_URL,
      MODE: env.NODE_ENV,
    });
  } catch (error) {
    console.error('Invalid environment variables:', error);
    throw new Error('Invalid environment configuration');
  }
};

export { env }; 