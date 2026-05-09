import { Model } from "mongoose";
import userModel, { IUser } from "../models/user.model";
import BaseRepository from "./base.repository";
import { AppError } from "../../common/utils/global-error-handler";

class UserRepository extends BaseRepository<IUser> {
  constructor(protected readonly model: Model<IUser> = userModel) {
    super(model);
  }
}

export default UserRepository;
