"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authentication_gql = exports.authentication = exports.decodeToken_and_fetchUser = void 0;
const global_error_handler_js_1 = require("../utils/global-error-handler.js");
const token_service_js_1 = __importDefault(require("../service/token.service.js"));
const config_service_js_1 = require("../../config/config.service.js");
const user_repository_js_1 = __importDefault(require("../../DB/repository/user.repository.js"));
const redis_service_js_1 = __importDefault(require("../service/redis.service.js"));
const userModel = new user_repository_js_1.default();
const decodeToken_and_fetchUser = async (authorization) => {
    if (!authorization) {
        throw new global_error_handler_js_1.AppError("Token required", 404);
    }
    const [prefix, token] = authorization.split(" ");
    if (!token) {
        throw new global_error_handler_js_1.AppError("Token not found", 404);
    }
    let ACCESS_SECRET_KEY = "";
    if (prefix === config_service_js_1.PREFIX_USER) {
        ACCESS_SECRET_KEY = config_service_js_1.ACCESS_SECRET_KEY_USER;
    }
    else if (prefix === config_service_js_1.PREFIX_ADMIN) {
        ACCESS_SECRET_KEY = config_service_js_1.ACCESS_SECRET_KEY_ADMIN;
    }
    else {
        throw new global_error_handler_js_1.AppError("Invalid prefix", 401);
    }
    const decoded = token_service_js_1.default.verifyToken({
        token: token,
        secret_key: ACCESS_SECRET_KEY,
    });
    if (!decoded || !decoded?.id) {
        throw new global_error_handler_js_1.AppError("Invalid token");
    }
    const user = await userModel.findOne({
        filter: { _id: decoded.id },
    });
    if (!user) {
        throw new global_error_handler_js_1.AppError("User not found", 404);
    }
    if (!user?.confirmed) {
        throw new global_error_handler_js_1.AppError("User not confirmed yet", 401);
    }
    if (user?.changeCredential?.getTime() > decoded.iat * 1000) {
        throw new global_error_handler_js_1.AppError("Invalid token");
    }
    const revokeToken = await redis_service_js_1.default.get(redis_service_js_1.default.revoke_key({ userId: user._id, jti: decoded.jti }));
    if (revokeToken) {
        throw new global_error_handler_js_1.AppError("Token revoked");
    }
    return { user, decoded };
};
exports.decodeToken_and_fetchUser = decodeToken_and_fetchUser;
const authentication = async (req, res, next) => {
    const { authorization } = req.headers;
    const { user, decoded } = await (0, exports.decodeToken_and_fetchUser)(authorization);
    req.user = user;
    req.decoded = decoded;
    next();
};
exports.authentication = authentication;
const authentication_gql = async (authorization) => {
    if (!authorization) {
        throw new global_error_handler_js_1.AppError("Token required", 404);
    }
    const [prefix, token] = authorization.split(" ");
    if (!token) {
        throw new global_error_handler_js_1.AppError("Token not found", 404);
    }
    let ACCESS_SECRET_KEY = "";
    if (prefix === config_service_js_1.PREFIX_USER) {
        ACCESS_SECRET_KEY = config_service_js_1.ACCESS_SECRET_KEY_USER;
    }
    else if (prefix === config_service_js_1.PREFIX_ADMIN) {
        ACCESS_SECRET_KEY = config_service_js_1.ACCESS_SECRET_KEY_ADMIN;
    }
    else {
        throw new global_error_handler_js_1.AppError("Invalid prefix", 401);
    }
    const decoded = token_service_js_1.default.verifyToken({
        token: token,
        secret_key: ACCESS_SECRET_KEY,
    });
    if (!decoded || !decoded?.id) {
        throw new global_error_handler_js_1.AppError("Invalid token");
    }
    const user = await userModel.findOne({
        filter: { _id: decoded.id },
    });
    return { user, decoded };
};
exports.authentication_gql = authentication_gql;
