"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_repository_1 = __importDefault(require("../../DB/repository/user.repository"));
const global_error_handler_1 = require("../../common/utils/global-error-handler");
const chat_repository_1 = __importDefault(require("../../DB/repository/chat.repository"));
const responce_success_1 = require("../../common/utils/responce.success");
const redis_service_1 = __importDefault(require("../../common/service/redis.service"));
class ChatService {
    _userRepo = new user_repository_1.default();
    _chatRepo = new chat_repository_1.default();
    constructor() { }
    //rest apis
    getChat = async (req, res) => {
        const { userId } = req.params;
        const chat = await this._chatRepo.findOne({
            filter: {
                participants: {
                    $all: [req.user._id, userId],
                },
                group: { $exists: false },
            },
            options: {
                populate: [
                    {
                        path: "participants",
                    },
                ],
            },
        });
        // console.log({chat});
        if (!chat) {
            throw new global_error_handler_1.AppError("Chat not found", 400);
        }
        (0, responce_success_1.successResponce)({ res, message: "Done", data: chat });
    };
    //socket.io
    sayHi = async (data) => {
        console.log(data);
    };
    sendMessage = async (data, socket, io) => {
        const { sendTo, content } = data;
        const createdBy = socket.data.user._id;
        const user = await this._userRepo.findOne({ filter: { _id: sendTo } });
        if (!user)
            throw new global_error_handler_1.AppError("User not found");
        const chat = await this._chatRepo.findOneAndUpdate({
            filter: {
                participants: { $all: [sendTo, createdBy] },
                group: { $exists: false },
            },
            update: {
                $push: {
                    messages: {
                        content,
                        createdBy,
                    },
                },
            },
        });
        if (!chat) {
            await this._chatRepo.create({
                createdBy,
                messages: [
                    {
                        content,
                        createdBy,
                    },
                ],
                participants: [sendTo, createdBy],
            });
        }
        io.to(await redis_service_1.default.getSockets(createdBy)).emit("successMessage", {
            content,
        });
        io.to(await redis_service_1.default.getSockets(sendTo)).emit("newMessage", {
            content,
            from: socket.data.user,
        });
    };
}
exports.default = new ChatService();
