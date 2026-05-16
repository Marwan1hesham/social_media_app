import { NextFunction, Request, Response } from "express";
import userModel, { IUser } from "../../DB/models/user.model";
import { HydratedDocument, Model, Types } from "mongoose";
import UserRepository from "../../DB/repository/user.repository";
import { encrypt } from "../../common/utils/security/encrypt";
import { Compare, Hash } from "../../common/utils/security/hash";
import {
  ACCESS_SECRET_KEY_ADMIN,
  ACCESS_SECRET_KEY_USER,
  CLIENT_ID,
  REFRESH_SECRET_KEY_ADMIN,
  REFRESH_SECRET_KEY_USER,
  SALT_ROUNDS,
} from "../../config/config.service";
import { AppError } from "../../common/utils/global-error-handler";
import { generateOtp, sendEmail } from "../../common/utils/email/send.email";
import { emailTemplate } from "../../common/utils/email/email.template";
import RedisService from "../../common/service/redis.service";
import { eventEmitter } from "../../common/utils/email/email.events";
import { emailEnum, ProviderEnum, RoleEnum } from "../../common/enum/user.enum";
import { successResponce } from "../../common/utils/responce.success";
import { randomUUID } from "node:crypto";
import TokenService from "../../common/service/token.service";
import { OAuth2Client } from "google-auth-library";
import { JwtPayload } from "jsonwebtoken";
import { S3Service } from "../../common/service/s3.service";
import notificationService from "../../common/service/notification.service";
import CommentRepository from "../../DB/repository/comment.repository";
import PostRepository from "../../DB/repository/post.repository";
import { AvailabilityPost } from "../../common/utils/post.utils";
import { Allow_Comment_Enum, On_Model_Enum } from "../../common/enum/post.enum";
import { StoreEnum } from "../../common/enum/multer.enum";
import { populate } from "dotenv";
import { createCommentDto } from "./comment.dto";
import { IPost } from "../../DB/models/post.model";
import { IComment } from "../../DB/models/comment.model";

class AuthService {
  private readonly _userRepo = new UserRepository();
  private readonly _commentRepo = new CommentRepository();
  private readonly _postRepo = new PostRepository();
  private readonly _s3Service = new S3Service();
  private readonly _redisService = RedisService;
  private readonly _tokenService = TokenService;
  private readonly _notificationService = notificationService;

  constructor() {}

  createComment = async (req: Request, res: Response, next: NextFunction) => {
    const { content, tags, onModel }: createCommentDto = req.body;
    let { postId, commentId } = req.params;

    let doc: HydratedDocument<IPost | IComment> | null = null;
    if (onModel === On_Model_Enum.post && !commentId) {
      doc = await this._postRepo.findOne({
        filter: {
          _id: postId,
          ...AvailabilityPost(req),
          allowComments: Allow_Comment_Enum.allow,
        },
      });
      if (!doc) {
        throw new AppError("Post not found", 404);
      }
    } else if (onModel === On_Model_Enum.comment && commentId) {
      const comment = await this._commentRepo.findOne({
        filter: {
          _id: commentId,
          refId: postId!,
        },
        options: {
          populate: [
            {
              path: "refId",
              match: {
                ...AvailabilityPost,
                allowComments: Allow_Comment_Enum.allow,
              },
            },
          ],
        },
      });
      if (!comment?.refId) {
        throw new AppError("comment not found", 404);
      }

      doc = comment;
    }

    if (!doc) {
      throw new AppError("Invalid onModel value");
    }

    let mentions: Types.ObjectId[] = [];
    let fcmTokens: string[] = [];

    if (tags?.length) {
      const mentionTags = await this._userRepo.find({
        filter: { _id: { $in: tags } },
      });

      if (tags.length != mentionTags?.length) {
        throw new AppError("Invalid tag id");
      }

      for (const tag of mentionTags!) {
        if (tag._id.toString() == req.user?._id.toString()) {
          throw new AppError("You cannot mention yourself");
        }

        mentions.push(tag._id);
        (await this._redisService.getFCMs(tag._id)).map((token) =>
          fcmTokens.push(token),
        );
      }
    }

    let urls: string[] = [];
    let folderId = randomUUID();
    if (req?.files) {
      urls = await this._s3Service.uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${req?.user?._id}/posts/${doc?.folderId}/comments`,
        store_type: StoreEnum.memory,
      });
    }

    const comment = await this._commentRepo.create({
      content: content || "",
      attachments: urls,
      createdBy: req.user?._id,
      folderId,
      tags: mentions,
      refId: doc?._id!,
    });

    if (!comment) {
      await this._s3Service.deleteFiles(urls);
      throw new AppError("Failed to create comment");
    }

    if (fcmTokens?.length) {
      await this._notificationService.sendNotifications({
        tokens: fcmTokens,
        data: {
          title: "You are mentioned on new post",
          body: content || "new post",
        },
      });
    }

    successResponce({ res, data: comment });
  };

  likeComment = async (req: Request, res: Response, next: NextFunction) => {
    const { commentId } = req.params;
    const { flag } = req.query;

    let updateQuery: any = {
      $addToSet: { likes: req.user?._id },
    };

    if (flag && flag === "disLike") {
      updateQuery = {
        $pull: { likes: req.user?._id },
      };
    }

    const comment = await this._commentRepo.findOneAndUpdate({
      filter: {
        _id: commentId,
      },
      update: updateQuery,
    });

    if (!comment) {
      throw new AppError("Not authorized or comment not found", 404);
    }

    successResponce({ res, data: comment });
  };

  deleteComment = async (req: Request, res: Response, next: NextFunction) => {
    const { commentId } = req.params;

    const comment = await this._commentRepo.findOneAndDelete({
      filter: {
        _id: commentId,
        createdBy: req.user?._id,
      },
    });

    if (!comment) {
      throw new AppError("Not authorized or comment not found");
    }

    successResponce({ res });
  };

  updateComment = async (req: Request, res: Response, next: NextFunction) => {
    const { likes, content } = req.body;
    const { commentId } = req.params;

    const comment = await this._commentRepo.findOneAndUpdate({
      filter: {
        _id: commentId,
        createdBy: req.user?._id,
      },
      update: {
        content,
        likes,
      },
    });

    if (!comment) {
      throw new AppError("Not authorized or comment not found");
    }

    successResponce({ res, data: comment });
  };
}

export default new AuthService();
