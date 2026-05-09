import mongoose, { Types } from "mongoose";
import { Type } from "@aws-sdk/client-s3";

export interface IComment {
  content: string;
  createdBy: Types.ObjectId;
  postId: Types.ObjectId;
  likes?: Types.ObjectId[];
}

const CommentSchema = new mongoose.Schema<IComment>(
  {
    content: {
      type: String,
      min: 1,
      required: true,
    },
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    postId: {
      type: Types.ObjectId,
      ref: "Post",
      required: true,
    },
    likes: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

const CommentModel =
  (mongoose.models.Comment as mongoose.Model<IComment>) ||
  mongoose.model<IComment>("Comment", CommentSchema);

export default CommentModel;
