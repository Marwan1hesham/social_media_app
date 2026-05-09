import { resolve } from "node:path";
import { config } from "dotenv";

const NODE_ENV = process.env.NODE_ENV;
config({ path: resolve(__dirname, `../../.env.${NODE_ENV}`) });

export const PORT: number = Number(process.env.PORT);
export const MONGO_URI: string = process.env.MONGO_URI!;
export const REDIS_URL: string = process.env.REDIS_URL!;
export const SALT_ROUNDS = Number(process.env.SALT_ROUNDS);
export const EMAIL = process.env.EMAIL;
export const PASS = process.env.PASS;
export const ACCESS_SECRET_KEY_USER = process.env.ACCESS_SECRET_KEY_USER!;
export const ACCESS_SECRET_KEY_ADMIN = process.env.ACCESS_SECRET_KEY_ADMIN!;
export const REFRESH_SECRET_KEY_USER = process.env.REFRESH_SECRET_KEY_USER!;
export const REFRESH_SECRET_KEY_ADMIN = process.env.REFRESH_SECRET_KEY_ADMIN!;
export const PREFIX_USER = process.env.PREFIX_USER!;
export const PREFIX_ADMIN = process.env.PREFIX_ADMIN!;
export const CLIENT_ID = process.env.CLIENT_ID!;
export const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY!;
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY!;
export const AWS_REGION = process.env.AWS_REGION!;
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME!;
