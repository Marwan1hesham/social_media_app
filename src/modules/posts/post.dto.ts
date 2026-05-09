import { createPostSchema, updatePostSchema } from "./post.validation";
import { z } from "zod";

export type createPostDto = z.infer<typeof createPostSchema.body>;
export type updatePostDto = z.infer<typeof updatePostSchema.body>;
export type PostIdDto = z.infer<typeof updatePostSchema.params>;
