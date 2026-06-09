import { Server } from "socket.io";
import { Server as httpServer } from "http";
import { decodeToken_and_fetchUser } from "../../common/middleware/authentication";
import redisService from "../../common/service/redis.service";
import chatGateway from "../chat/realtime/chat.gateway";

class SocketGateWay {
  constructor() {}

  initIo = async (httpServer: httpServer) => {
    const io = new Server(httpServer, {
      cors: {
        origin: "*",
      },
    });

    io.use(async (socket, next) => {
      try {
        // console.log(socket);
        const { user } = await decodeToken_and_fetchUser(
          socket.handshake.auth.authorization,
        );
        socket.data.user = user;
        next();
      } catch (error: any) {
        next(error);
      }
    });

    io.on("connection", async (socket) => {
      redisService.addSocket({
        userId: socket.data.user._id,
        SocketId: socket.id,
      });

      await chatGateway.regesterEvent(socket, io);

      // console.log({
      //   userSocketId: await redisService.getSockets(socket.data.user._id),
      // });

      socket.on("disconnect", async () => {
        await redisService.removeSocket({
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

export default new SocketGateWay();
