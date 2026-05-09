import mongoose, { Types } from "mongoose";
import {
  Allow_Comment_Enum,
  Availability_Enum,
} from "../../common/enum/post.enum";
import { Type } from "@aws-sdk/client-s3";

export interface IPost {
  content?: string;
  attachments?: string[];

  createdBy: Types.ObjectId;

  tags: Types.ObjectId[];
  likes: Types.ObjectId[];

  allowComments?: Allow_Comment_Enum;
  availability?: Availability_Enum;

  folderId: string;
}

const PostSchema = new mongoose.Schema<IPost>(
  {
    content: {
      type: String,
      min: 1,
      required: function (this) {
        return !this.attachments?.length;
      },
    },
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

    allowComments: {
      type: String,
      enum: Allow_Comment_Enum,
      default: Allow_Comment_Enum.allow,
    },

    availability: {
      type: String,
      enum: Availability_Enum,
      default: Availability_Enum.public,
    },

    folderId: String,
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

const PostModel =
  (mongoose.models.Post as mongoose.Model<IPost>) ||
  mongoose.model<IPost>("Post", PostSchema);

export default PostModel;

// PostSchema.pre("findOne", function () {
//   const { paranoid, ...rest } = this.getQuery();
//   if (paranoid == false) {
//     this.setQuery({ ...rest });
//   } else {
//     this.setQuery({ ...rest, deletedAt: { $exists: false } });
//   }
// });
