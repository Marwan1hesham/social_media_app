import { createCommentSchema } from "./comment.validation";
import { z } from "zod";

export type createCommentDto = z.infer<typeof createCommentSchema>;
