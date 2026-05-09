"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventEmitter = void 0;
const node_events_1 = require("node:events");
const user_enum_1 = require("../../enum/user.enum");
exports.eventEmitter = new node_events_1.EventEmitter();
exports.eventEmitter.on(user_enum_1.emailEnum.confirmEmail, async (fn) => {
    await fn();
});
