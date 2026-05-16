"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_repository_1 = __importDefault(require("../../DB/repository/user.repository"));
const global_error_handler_1 = require("../../common/utils/global-error-handler");
const redis_service_1 = __importDefault(require("../../common/service/redis.service"));
const responce_success_1 = require("../../common/utils/responce.success");
const node_crypto_1 = require("node:crypto");
const token_service_1 = __importDefault(require("../../common/service/token.service"));
const s3_service_1 = require("../../common/service/s3.service");
const notification_service_1 = __importDefault(require("../../common/service/notification.service"));
const comment_repository_1 = __importDefault(require("../../DB/repository/comment.repository"));
const post_repository_1 = __importDefault(require("../../DB/repository/post.repository"));
const post_utils_1 = require("../../common/utils/post.utils");
const post_enum_1 = require("../../common/enum/post.enum");
const multer_enum_1 = require("../../common/enum/multer.enum");
class AuthService {
    _userRepo = new user_repository_1.default();
    _commentRepo = new comment_repository_1.default();
    _postRepo = new post_repository_1.default();
    _s3Service = new s3_service_1.S3Service();
    _redisService = redis_service_1.default;
    _tokenService = token_service_1.default;
    _notificationService = notification_service_1.default;
    constructor() { }
    createComment = async (req, res, next) => {
        const { content, tags, onModel } = req.body;
        let { postId, commentId } = req.params;
        let doc = null;
        if (onModel === post_enum_1.On_Model_Enum.post && !commentId) {
            doc = await this._postRepo.findOne({
                filter: {
                    _id: postId,
                    ...(0, post_utils_1.AvailabilityPost)(req),
                    allowComments: post_enum_1.Allow_Comment_Enum.allow,
                },
            });
            if (!doc) {
                throw new global_error_handler_1.AppError("Post not found", 404);
            }
        }
        else if (onModel === post_enum_1.On_Model_Enum.comment && commentId) {
            const comment = await this._commentRepo.findOne({
                filter: {
                    _id: commentId,
                    refId: postId,
                },
                options: {
                    populate: [
                        {
                            path: "refId",
                            match: {
                                ...post_utils_1.AvailabilityPost,
                                allowComments: post_enum_1.Allow_Comment_Enum.allow,
                            },
                        },
                    ],
                },
            });
            if (!comment?.refId) {
                throw new global_error_handler_1.AppError("comment not found", 404);
            }
            doc = comment;
        }
        if (!doc) {
            throw new global_error_handler_1.AppError("Invalid onModel value");
        }
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
                path: `users/${req?.user?._id}/posts/${doc?.folderId}/comments`,
                store_type: multer_enum_1.StoreEnum.memory,
            });
        }
        const comment = await this._commentRepo.create({
            content: content || "",
            attachments: urls,
            createdBy: req.user?._id,
            folderId,
            tags: mentions,
            refId: doc?._id,
        });
        if (!comment) {
            await this._s3Service.deleteFiles(urls);
            throw new global_error_handler_1.AppError("Failed to create comment");
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
        (0, responce_success_1.successResponce)({ res, data: comment });
    };
    likeComment = async (req, res, next) => {
        const { commentId } = req.params;
        const { flag } = req.query;
        let updateQuery = {
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
            throw new global_error_handler_1.AppError("Not authorized or comment not found", 404);
        }
        (0, responce_success_1.successResponce)({ res, data: comment });
    };
    deleteComment = async (req, res, next) => {
        const { commentId } = req.params;
        const comment = await this._commentRepo.findOneAndDelete({
            filter: {
                _id: commentId,
                createdBy: req.user?._id,
            },
        });
        if (!comment) {
            throw new global_error_handler_1.AppError("Not authorized or comment not found");
        }
        (0, responce_success_1.successResponce)({ res });
    };
    updateComment = async (req, res, next) => {
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
            throw new global_error_handler_1.AppError("Not authorized or comment not found");
        }
        (0, responce_success_1.successResponce)({ res, data: comment });
    };
}
exports.default = new AuthService();
