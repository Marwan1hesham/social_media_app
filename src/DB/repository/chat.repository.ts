import { Model, QueryFilter } from "mongoose";
import ChatModel, { IChat } from "../models/chat.model";
import BaseRepository from "./base.repository";
import { AppError } from "../../common/utils/global-error-handler";

class ChatRepository extends BaseRepository<IChat> {
  constructor(protected readonly model: Model<IChat> = ChatModel) {
    super(model);
  }
}

export default ChatRepository;
