import * as z from "zod";
import { generalRules } from "../../common/utils/generalRules";

export const createCommentSchema: any = {
  body: z.object({
    content: z.string().min(1),
    likes: z.array(z.string()).optional(),
  }),
  params: z.object({
    postId: generalRules.id,
  }),
};

export const likeCommentSchema: any = {
  params: z.object({
    postId: generalRules.id,
    commentId: generalRules.id,
  }),
};

export const deleteCommentSchema: any = {
  params: z.object({
    commentId: generalRules.id,
  }),
};

export const updateCommentSchema: any = {
  body: z.object({
    content: z.string().min(1).optional(),
    likes: z.array(z.string()).optional(),
  }),
  params: z.object({
    commentId: generalRules.id,
  }),
};
