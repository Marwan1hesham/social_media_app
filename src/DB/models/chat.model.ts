import mongoose, { Types } from "mongoose";

interface IMessage {
  createdBy: Types.ObjectId;
  content: string;
}

export interface IChat {
  //ovo
  createdBy: Types.ObjectId;
  participants: Types.ObjectId[];
  messages: IMessage[];
  //ovm
  group: string;
  groupImage: string;
  roomId: string;
}

const messageSchema = new mongoose.Schema<IMessage>(
  {
    content: {
      type: String,
      required: true,
    },

    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

const ChatSchema = new mongoose.Schema<IChat>(
  {
    messages: [messageSchema],
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [
      {
        type: Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    group: String,
    groupImage: String,
    roomId: String,
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

const ChatModel =
  (mongoose.models.chat as mongoose.Model<IChat>) ||
  mongoose.model<IChat>("chat", ChatSchema);

export default ChatModel;
