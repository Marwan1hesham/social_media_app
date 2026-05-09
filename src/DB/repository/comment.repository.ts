import { Model, QueryFilter } from "mongoose";
import PostModel, { IPost } from "../models/post.model";
import BaseRepository from "./base.repository";
import { AppError } from "../../common/utils/global-error-handler";
import CommentModel, { IComment } from "../models/comment.model";

class CommentRepository extends BaseRepository<IComment> {
  constructor(protected readonly model: Model<IComment> = CommentModel) {
    super(model);
  }
}

export default CommentRepository;
