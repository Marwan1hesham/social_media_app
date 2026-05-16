import mongoose, { Types } from "mongoose";
import { Type } from "@aws-sdk/client-s3";
import { string } from "zod";
import { On_Model_Enum } from "../../common/enum/post.enum";

export interface IComment {
  content?: string;
  folderId: string;
  attachments?: string[];
  createdBy: Types.ObjectId;
  tags?: Types.ObjectId[];
  likes?: Types.ObjectId[];
  refId: Types.ObjectId;
  onModel: On_Model_Enum;
}

const CommentSchema = new mongoose.Schema<IComment>(
  {
    content: {
      type: String,
      min: 1,
      required: true,
    },
    folderId: String,
    attachments: [String],
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    likes: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    tags: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    refId: {
      type: Types.ObjectId,
      refPath: "onModel",
      required: true,
    },
    onModel: {
      type: String,
      enum: On_Model_Enum,
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

CommentSchema.virtual("replies", {
  ref: "Comment",
  localField: "_id",
  foreignField: "refId",
});

const CommentModel =
  (mongoose.models.Comment as mongoose.Model<IComment>) ||
  mongoose.model<IComment>("Comment", CommentSchema);

export default CommentModel;
