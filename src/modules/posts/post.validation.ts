import * as z from "zod";
import {
  Allow_Comment_Enum,
  Availability_Enum,
} from "../../common/enum/post.enum";
import { Types } from "mongoose";
import { generalRules } from "../../common/utils/generalRules";

export const createPostSchema: any = {
  body: z
    .strictObject({
      content: z.string().optional(),
      attachments: z.array(generalRules.file).optional(),
      tags: z.array(generalRules.id).optional(),
      availability: z.enum(Availability_Enum).default(Availability_Enum.public),
      allowComments: z
        .enum(Allow_Comment_Enum)
        .default(Allow_Comment_Enum.allow),
    })
    .superRefine((args, ctx) => {
      if (!args.content && !args.attachments?.length) {
        ctx.addIssue({
          code: "custom",
          path: ["content"],
          message: "Content is required",
        });
      }

      if (args?.tags) {
        const uniqueTags = new Set(args.tags);
        if (args.tags.length !== uniqueTags.size) {
          ctx.addIssue({
            code: "custom",
            path: ["tags"],
            message: "Don't Duplicate tags",
          });
        }
      }
    }),
};

export const likePostSchema: any = {
  params: z.strictObject({
    postId: generalRules.id,
  }),
};

export const updatePostSchema: any = {
  body: z
    .strictObject({
      content: z.string().optional(),
      attachments: z.array(generalRules.file).optional(),
      removeFiles: z.array(z.string()).optional(),
      tags: z.array(generalRules.id).optional(),
      removeTags: z.array(generalRules.id).optional(),
      availability: z.enum(Availability_Enum).default(Availability_Enum.public),
      allowComments: z
        .enum(Allow_Comment_Enum)
        .default(Allow_Comment_Enum.allow),
    })
    .superRefine((args, ctx) => {
      if (args?.tags) {
        const uniqueTags = new Set(args.tags);
        if (args.tags.length !== uniqueTags.size) {
          ctx.addIssue({
            code: "custom",
            path: ["tags"],
            message: "Don't Duplicate tags",
          });
        }
      }
    }),
  params: likePostSchema.params,
};


export const deletePostSchema: any = {
  params: z.strictObject({
    postId: generalRules.id,
  }),
};
