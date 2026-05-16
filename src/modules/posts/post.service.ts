import { NextFunction, Request, Response } from "express";
import PostModel, { IPost } from "../../DB/models/post.model";
import { HydratedDocument, Model, QueryFilter, Types } from "mongoose";
import { createPostDto, PostIdDto, updatePostDto } from "./post.dto";
import PostRepository from "../../DB/repository/post.repository";
import {
  ACCESS_SECRET_KEY_ADMIN,
  ACCESS_SECRET_KEY_USER,
  CLIENT_ID,
  REFRESH_SECRET_KEY_ADMIN,
  REFRESH_SECRET_KEY_USER,
  SALT_ROUNDS,
} from "../../config/config.service";
import { AppError } from "../../common/utils/global-error-handler";
import RedisService from "../../common/service/redis.service";
import { successResponce } from "../../common/utils/responce.success";
import { randomUUID } from "node:crypto";
import TokenService from "../../common/service/token.service";
import { JwtPayload } from "jsonwebtoken";
import { S3Service } from "../../common/service/s3.service";
import notificationService from "../../common/service/notification.service";
import UserRepository from "../../DB/repository/user.repository";
import { StoreEnum } from "../../common/enum/multer.enum";
import { Availability_Enum } from "../../common/enum/post.enum";
import { AvailabilityPost } from "../../common/utils/post.utils";
import CommentRepository from "../../DB/repository/comment.repository";

class PostService {
  private readonly model = PostModel;
  private readonly _postRepo = new PostRepository();
  private readonly _userRepo = new UserRepository();
  private readonly _commentRepo = new CommentRepository();
  private readonly _s3Service = new S3Service();
  private readonly _redisService = RedisService;
  private readonly _tokenService = TokenService;
  private readonly _notificationService = notificationService;

  constructor() {}

  createPost = async (req: Request, res: Response, next: NextFunction) => {
    const { content, tags, availability, allowComments }: createPostDto =
      req.body;

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
        path: `users/${req?.user?._id}/posts/${folderId}`,
        store_type: StoreEnum.memory,
      });
    }

    const post = await this._postRepo.create({
      attachments: urls,
      content: content!,
      createdBy: req?.user?._id!,
      tags: mentions,
      folderId,
      availability,
      allowComments,
    });

    if (!post) {
      await this._s3Service.deleteFiles(urls);
      throw new AppError("failed to create post");
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

    successResponce({ res, data: post });
  };

  getPosts = async (req: Request, res: Response, next: NextFunction) => {
    // const posts = await this._postRepo.paginate({
    //   page: +req?.query?.page!,
    //   limit: +req?.query?.limit!,
    //   search: {
    //     ...AvailabilityPost(req),
    //     ...(req.query?.search
    //       ? {
    //           $or: [{ content: { $regex: req.query.search, $options: "i" } }],
    //         }
    //       : {}),
    //   },
    // });
    const posts = await this._postRepo.find({
      filter: {
        ...AvailabilityPost,
      },
      options: {
        populate: [
          {
            path: "comments",
            match: {
              commentId: { $exists: false },
            },
            populate: [
              {
                path: "replies",
              },
            ],
          },
        ],
      },
    });

    successResponce({ res, data: posts });
  };

  likePost = async (req: Request, res: Response, next: NextFunction) => {
    const { postId } = req.params;
    const { flag } = req.query;

    let updateQuery: any = {
      $addToSet: { likes: req.user?._id },
    };

    if (flag && flag === "disLike") {
      updateQuery = {
        $pull: { likes: req.user?._id },
      };
    }

    const post = await this._postRepo.findOneAndUpdate({
      filter: {
        _id: postId,
        ...AvailabilityPost(req),
      },
      update: updateQuery,
    });

    if (!post) {
      throw new AppError("Not authorized or post not found", 404);
    }

    successResponce({ res, data: post });
  };

  updatePost = async (req: Request, res: Response, next: NextFunction) => {
    const { postId }: PostIdDto = req.params;

    const {
      content,
      tags,
      availability,
      allowComments,
      removeFiles,
      removeTags,
    }: updatePostDto = req.body;

    const post = await this._postRepo.findOne({
      filter: {
        _id: postId,
        createdBy: req?.user?._id,
      },
    });

    if (!post) {
      throw new AppError("Not authorized or post not found", 404);
    }

    if (removeFiles?.length) {
      const invalidFiles = removeFiles.filter((file: string) => {
        return !post.attachments?.includes(file);
      });
      if (invalidFiles?.length) {
        throw new AppError("Files you want to remove not found", 404);
      }
      await this._s3Service.deleteFiles(removeFiles);

      post.attachments = post.attachments?.filter((file: string) => {
        return !removeFiles.includes(file);
      }) as string[];
    }

    const updateTags = new Set(post?.tags?.map((id) => id.toString()));

    removeTags?.forEach((tag: string) => {
      return updateTags.delete(tag);
    });

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
        updateTags.add(tag._id.toString());
        (await this._redisService.getFCMs(tag._id)).map((token) =>
          fcmTokens.push(token),
        );
      }
    }
    post.tags = [...updateTags].map((id: string) => new Types.ObjectId(id));

    if (req?.files) {
      let urls = await this._s3Service.uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${req?.user?._id}/posts/${post.folderId}`,
        store_type: StoreEnum.memory,
      });
      post.attachments?.push(...urls);
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

    if (content) post.content = content;
    if (availability) post.availability = availability;
    if (allowComments) post.allowComments = allowComments;

    await post.save();

    successResponce({ res, data: post });
  };

  deletePost = async (req: Request, res: Response, next: NextFunction) => {
    const { postId } = req.params;

    const post = await this._postRepo.findOneAndDelete({
      filter: {
        _id: postId,
        createdBy: req.user?._id,
      },
      options: { new: true },
    });

    if (!post) {
      throw new AppError("Not authorized or post not found", 404);
    }

    successResponce({ res, data: post });
  };
}

export default new PostService();
