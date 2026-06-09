"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const authentication_1 = require("../../common/middleware/authentication");
const redis_service_1 = __importDefault(require("../../common/service/redis.service"));
const chat_gateway_1 = __importDefault(require("../chat/realtime/chat.gateway"));
class SocketGateWay {
    constructor() { }
    initIo = async (httpServer) => {
        const io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: "*",
            },
        });
        io.use(async (socket, next) => {
            try {
                // console.log(socket);
                const { user } = await (0, authentication_1.decodeToken_and_fetchUser)(socket.handshake.auth.authorization);
                socket.data.user = user;
                next();
            }
            catch (error) {
                next(error);
            }
        });
        io.on("connection", async (socket) => {
            redis_service_1.default.addSocket({
                userId: socket.data.user._id,
                SocketId: socket.id,
            });
            await chat_gateway_1.default.regesterEvent(socket, io);
            // console.log({
            //   userSocketId: await redisService.getSockets(socket.data.user._id),
            // });
            socket.on("disconnect", async () => {
                await redis_service_1.default.removeSocket({
                    userId: socket.data.user._id,
                    socketId: socket.id,
                });
                // console.log({
                //   userSocketIdAfterDisconnect: await redisService.getSockets(
                //     socket.data.user._id,
                //   ),
                // });
            });
        });
    };
}
exports.default = new SocketGateWay();
