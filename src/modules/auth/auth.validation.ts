import * as z from "zod";
import { GenderEnum } from "../../common/enum/user.enum";

export const resendOtpSchema = {
  body: z.object({
    email: z.email("Invalid email address"),
  }),
};

export const singInSchema: any = {
  body: z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(6),
    fcm: z.string(),
  }),
};

export const singUpSchema: any = {
  body: z
    .object({
      userName: z.string({ error: "userName is required" }).min(3).max(25),
      email: z.email("Invalid email address"),
      password: z.string().min(6),
      cPassword: z.string().min(6),
      age: z.number({ error: "age is required" }).min(18).max(100),
      gender: z.enum(GenderEnum).optional(),
      phone: z.string().min(11).max(15).optional(),
      address: z.string().min(3).max(100).optional(),
    })
    .refine(
      (data: any) => {
        return data.password === data.cPassword;
      },
      {
        message: "Passwords do not match",
        path: ["cPassword"],
      },
    ),
};

export const confirmEmailSchema: any = {
  body: z.object({
    email: z.email("Invalid email address"),
    code: z.string().regex(/^\d{6}$/),
  }),
};
