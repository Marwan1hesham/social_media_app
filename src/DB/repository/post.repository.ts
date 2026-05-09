import { Model, QueryFilter } from "mongoose";
import PostModel, { IPost } from "../models/post.model";
import BaseRepository from "./base.repository";
import { AppError } from "../../common/utils/global-error-handler";

class PostRepository extends BaseRepository<IPost> {
  constructor(protected readonly model: Model<IPost> = PostModel) {
    super(model);
  }
}

export default PostRepository;
