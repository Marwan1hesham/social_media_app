import { Server, Socket } from "socket.io";
import chatEvent from "../../realtime/chat.event";

class ChatGateWay {
  constructor() {}

  regesterEvent = async (socket: Socket, io: Server) => {
    chatEvent.sayHi(socket);
    chatEvent.sendMessage(socket, io);
  };
}

export default new ChatGateWay();
