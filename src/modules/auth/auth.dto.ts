import {
  confirmEmailSchema,
  singInSchema,
  singUpSchema,
} from "./auth.validation";
import { z } from "zod";

export type SignUpDto = z.infer<typeof singUpSchema.body>;
export type SignInDto = z.infer<typeof singInSchema.body>;
export type ConfirmEmailDto = z.infer<typeof confirmEmailSchema.body>;
