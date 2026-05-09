import { EventEmitter } from "node:events";
import { emailEnum } from "../../enum/user.enum";

export const eventEmitter = new EventEmitter();

eventEmitter.on(emailEnum.confirmEmail, async (fn) => {
  await fn();
});
