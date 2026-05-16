import { Router } from "express";
import { validation } from "../../common/middleware/validation.js";
import * as postValidation from "./post.validation.js";
import postService from "./post.service.js";
import { authentication } from "../../common/middleware/authentication.js";
import multerCloud from "../../common/middleware/multer.cloud.js";
import { StoreEnum } from "../../common/enum/multer.enum.js";
import commentRouter from "../comments/comment.controller.js";

const postRouter = Router();

postRouter.use("/:postId/comments{/:commentId/replies}", commentRouter);

postRouter.post(
  "/",
  authentication,
  multerCloud({ store_type: StoreEnum.memory }).array("attachments"),
  validation(postValidation.createPostSchema),
  postService.createPost,
);

postRouter.get("/", postService.getPosts);

postRouter.patch(
  "/:postId",
  authentication,
  validation(postValidation.likePostSchema),
  postService.likePost,
);

postRouter.put(
  "/update/:postId",
  authentication,
  multerCloud({ store_type: StoreEnum.memory }).array("attachments"),
  validation(postValidation.updatePostSchema),
  postService.updatePost,
);

postRouter.delete(
  "/delete/:postId",
  authentication,
  validation(postValidation.deletePostSchema),
  postService.deletePost,
);

export default postRouter;
