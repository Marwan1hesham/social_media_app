import { Router } from "express";
import { validation } from "../../common/middleware/validation.js";
import * as commentValidation from "./comment.validation.js";
import { authentication } from "../../common/middleware/authentication.js";
import multerCloud from "../../common/middleware/multer.cloud.js";
import { StoreEnum } from "../../common/enum/multer.enum.js";
import commentService from "./comment.service.js";

const commentRouter = Router({ mergeParams: true });

commentRouter.post(
  "/",
  authentication,
  multerCloud({ store_type: StoreEnum.memory }).array("attachments"),
  validation(commentValidation.createCommentSchema),
  commentService.createComment,
);

export default commentRouter;
