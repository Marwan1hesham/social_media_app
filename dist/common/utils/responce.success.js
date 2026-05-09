"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponce = void 0;
const successResponce = ({ res, message = "done", status = 200, data = undefined, }) => {
    return res.status(status).json({ message, data });
};
exports.successResponce = successResponce;
