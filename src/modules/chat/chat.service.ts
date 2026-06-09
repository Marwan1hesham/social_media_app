import { Request, Response } from "express";
import UserRepository from "../../DB/repository/user.repository";
import { AppError } from "../../common/utils/global-error-handler";
import ChatRepository from "../../DB/repository/chat.repository";
import { successResponce } from "../../common/utils/responce.success";
import { Server, Socket } from "socket.io";
import redisService from "../../common/service/redis.service";

class ChatService {
  private readonly _userRepo = new UserRepository();
  private readonly _chatRepo = new ChatRepository();

  constructor() {}

  //rest apis
  getChat = async (req: Request, res: Response) => {
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
      throw new AppError("Chat not found", 400);
    }

    successResponce({ res, message: "Done", data: chat });
  };

  //socket.io

  sayHi = async (data: any) => {
    console.log(data);
  };

  sendMessage = async (data: any, socket: Socket, io: Server) => {
    const { sendTo, content } = data;
    const createdBy = socket.data.user._id;

    const user = await this._userRepo.findOne({ filter: { _id: sendTo } });
    if (!user) throw new AppError("User not found");

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

    io.to(await redisService.getSockets(createdBy)).emit("successMessage", {
      content,
    });
    io.to(await redisService.getSockets(sendTo)).emit("newMessage", {
      content,
      from: socket.data.user,
    });
  };
}

export default new ChatService();
