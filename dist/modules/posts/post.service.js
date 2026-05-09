"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const post_model_1 = __importDefault(require("../../DB/models/post.model"));
const mongoose_1 = require("mongoose");
const post_repository_1 = __importDefault(require("../../DB/repository/post.repository"));
const global_error_handler_1 = require("../../common/utils/global-error-handler");
const redis_service_1 = __importDefault(require("../../common/service/redis.service"));
const responce_success_1 = require("../../common/utils/responce.success");
const node_crypto_1 = require("node:crypto");
const token_service_1 = __importDefault(require("../../common/service/token.service"));
const s3_service_1 = require("../../common/service/s3.service");
const notification_service_1 = __importDefault(require("../../common/service/notification.service"));
const user_repository_1 = __importDefault(require("../../DB/repository/user.repository"));
const multer_enum_1 = require("../../common/enum/multer.enum");
const post_utils_1 = require("../../common/utils/post.utils");
class PostService {
    model = post_model_1.default;
    _postRepo = new post_repository_1.default();
    _userRepo = new user_repository_1.default();
    _s3Service = new s3_service_1.S3Service();
    _redisService = redis_service_1.default;
    _tokenService = token_service_1.default;
    _notificationService = notification_service_1.default;
    constructor() { }
    createPost = async (req, res, next) => {
        const { content, tags, availability, allowComments } = req.body;
        let mentions = [];
        let fcmTokens = [];
        if (tags?.length) {
            const mentionTags = await this._userRepo.find({
                filter: { _id: { $in: tags } },
            });
            if (tags.length != mentionTags?.length) {
                throw new global_error_handler_1.AppError("Invalid tag id");
            }
            for (const tag of mentionTags) {
                if (tag._id.toString() == req.user?._id.toString()) {
                    throw new global_error_handler_1.AppError("You cannot mention yourself");
                }
                mentions.push(tag._id);
                (await this._redisService.getFCMs(tag._id)).map((token) => fcmTokens.push(token));
            }
        }
        let urls = [];
        let folderId = (0, node_crypto_1.randomUUID)();
        if (req?.files) {
            urls = await this._s3Service.uploadFiles({
                files: req.files,
                path: `users/${req?.user?._id}/posts/${folderId}`,
                store_type: multer_enum_1.StoreEnum.memory,
            });
        }
        const post = await this._postRepo.create({
            attachments: urls,
            content: content,
            createdBy: req?.user?._id,
            tags: mentions,
            folderId,
            availability,
            allowComments,
        });
        if (!post) {
            await this._s3Service.deleteFiles(urls);
            throw new global_error_handler_1.AppError("failed to create post");
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
        (0, responce_success_1.successResponce)({ res, data: post });
    };
    getPosts = async (req, res, next) => {
        const posts = await this._postRepo.paginate({
            page: +req?.query?.page,
            limit: +req?.query?.limit,
            search: {
                ...(0, post_utils_1.AvailabilityPost)(req),
                ...(req.query?.search
                    ? {
                        $or: [{ content: { $regex: req.query.search, $options: "i" } }],
                    }
                    : {}),
            },
        });
        // const posts = await this._postRepo.find({
        //   filter: {
        //     $or: [
        //       { availability: Availability_Enum.public },
        //       { availability: Availability_Enum.only_me, createdBy: req.user?._id },
        //       {
        //         availability: Availability_Enum.friends,
        //         createdBy: { $in: [...(req.user?.friends || []), req.user?._id] },
        //       },
        //       { tags: { $in: [req.user?._id] } },
        //     ],
        //   },
        // });
        (0, responce_success_1.successResponce)({ res, data: posts });
    };
    likePost = async (req, res, next) => {
        const { postId } = req.params;
        const { flag } = req.query;
        let updateQuery = {
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
                ...(0, post_utils_1.AvailabilityPost)(req),
            },
            update: updateQuery,
        });
        if (!post) {
            throw new global_error_handler_1.AppError("Not authorized or post not found", 404);
        }
        (0, responce_success_1.successResponce)({ res, data: post });
    };
    updatePost = async (req, res, next) => {
        const { postId } = req.params;
        const { content, tags, availability, allowComments, removeFiles, removeTags, } = req.body;
        const post = await this._postRepo.findOne({
            filter: {
                _id: postId,
                createdBy: req?.user?._id,
            },
        });
        if (!post) {
            throw new global_error_handler_1.AppError("Not authorized or post not found", 404);
        }
        if (removeFiles?.length) {
            const invalidFiles = removeFiles.filter((file) => {
                return !post.attachments?.includes(file);
            });
            if (invalidFiles?.length) {
                throw new global_error_handler_1.AppError("Files you want to remove not found", 404);
            }
            await this._s3Service.deleteFiles(removeFiles);
            post.attachments = post.attachments?.filter((file) => {
                return !removeFiles.includes(file);
            });
        }
        const updateTags = new Set(post?.tags?.map((id) => id.toString()));
        removeTags?.forEach((tag) => {
            return updateTags.delete(tag);
        });
        let fcmTokens = [];
        if (tags?.length) {
            const mentionTags = await this._userRepo.find({
                filter: { _id: { $in: tags } },
            });
            if (tags.length != mentionTags?.length) {
                throw new global_error_handler_1.AppError("Invalid tag id");
            }
            for (const tag of mentionTags) {
                if (tag._id.toString() == req.user?._id.toString()) {
                    throw new global_error_handler_1.AppError("You cannot mention yourself");
                }
                updateTags.add(tag._id.toString());
                (await this._redisService.getFCMs(tag._id)).map((token) => fcmTokens.push(token));
            }
        }
        post.tags = [...updateTags].map((id) => new mongoose_1.Types.ObjectId(id));
        if (req?.files) {
            let urls = await this._s3Service.uploadFiles({
                files: req.files,
                path: `users/${req?.user?._id}/posts/${post.folderId}`,
                store_type: multer_enum_1.StoreEnum.memory,
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
        if (content)
            post.content = content;
        if (availability)
            post.availability = availability;
        if (allowComments)
            post.allowComments = allowComments;
        await post.save();
        (0, responce_success_1.successResponce)({ res, data: post });
    };
    deletePost = async (req, res, next) => {
        const { postId } = req.params;
        const post = await this._postRepo.findOneAndDelete({
            filter: {
                _id: postId,
                createdBy: req.user?._id,
            },
            options: { new: true },
        });
        if (!post) {
            throw new global_error_handler_1.AppError("Not authorized or post not found", 404);
        }
        (0, responce_success_1.successResponce)({ res, data: post });
    };
}
exports.default = new PostService();
