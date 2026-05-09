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
    const { content, likes } = req.body;
    let { postId } = req.params;

    if (!postId || Array.isArray(postId)) {
      throw new AppError("Invalid post id", 400);
    }

    const post = await this._postRepo.findOne({
      filter: {
        _id: postId,
      },
    });
    if (!post) {
      throw new AppError("Post not found");
    }

    const comment = await this._commentRepo.create({
      content,
      createdBy: req.user?._id,
      postId: new Types.ObjectId(postId),
      likes,
    });

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
