"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const user_repository_1 = __importDefault(require("../../DB/repository/user.repository"));
const global_error_handler_1 = require("../../common/utils/global-error-handler");
const redis_service_1 = __importDefault(require("../../common/service/redis.service"));
const responce_success_1 = require("../../common/utils/responce.success");
const token_service_1 = __importDefault(require("../../common/service/token.service"));
const s3_service_1 = require("../../common/service/s3.service");
const notification_service_1 = __importDefault(require("../../common/service/notification.service"));
const comment_repository_1 = __importDefault(require("../../DB/repository/comment.repository"));
const post_repository_1 = __importDefault(require("../../DB/repository/post.repository"));
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
        const { content, likes } = req.body;
        let { postId } = req.params;
        if (!postId || Array.isArray(postId)) {
            throw new global_error_handler_1.AppError("Invalid post id", 400);
        }
        const post = await this._postRepo.findOne({
            filter: {
                _id: postId,
            },
        });
        if (!post) {
            throw new global_error_handler_1.AppError("Post not found");
        }
        const comment = await this._commentRepo.create({
            content,
            createdBy: req.user?._id,
            postId: new mongoose_1.Types.ObjectId(postId),
            likes,
        });
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
