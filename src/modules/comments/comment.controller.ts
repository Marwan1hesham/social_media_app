import { Router } from "express";
import { validation } from "../../common/middleware/validation.js";
import * as commentValidation from "./comment.validation.js";
import { authentication } from "../../common/middleware/authentication.js";
import multerCloud from "../../common/middleware/multer.cloud.js";
import { StoreEnum } from "../../common/enum/multer.enum.js";
import commentService from "./comment.service.js";

const commentRouter = Router();

commentRouter.post(
  "/:postId",
  authentication,
  validation(commentValidation.createCommentSchema),
  commentService.createComment,
);

commentRouter.patch(
  "/:postId/:commentId",
  authentication,
  validation(commentValidation.likeCommentSchema),
  commentService.likeComment,
);

commentRouter.delete(
  "/delete/:commentId",
  authentication,
  validation(commentValidation.deleteCommentSchema),
  commentService.deleteComment,
);

commentRouter.put(
  "/update/:commentId",
  authentication,
  validation(commentValidation.updateCommentSchema),
  commentService.updateComment,
);

export default commentRouter;
