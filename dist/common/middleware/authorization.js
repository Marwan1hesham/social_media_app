"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorization = void 0;
const global_error_handler_1 = require("../utils/global-error-handler");
const authorization = async (roles, role) => {
    if (!roles.includes(role)) {
        throw new global_error_handler_1.AppError("Unauthorized");
    }
};
exports.authorization = authorization;
