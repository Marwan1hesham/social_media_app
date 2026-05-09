import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/global-error-handler.js";
import tokenService from "../service/token.service.js";
import {
  ACCESS_SECRET_KEY_ADMIN,
  ACCESS_SECRET_KEY_USER,
  PREFIX_ADMIN,
  PREFIX_USER,
} from "../../config/config.service.js";
import UserRepository from "../../DB/repository/user.repository.js";
import redisService from "../service/redis.service.js";
const userModel = new UserRepository();

export const authentication = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { authorization } = req.headers;

  if (!authorization) {
    throw new AppError("Token required", 404);
  }

  const [prefix, token]: string[] = authorization.split(" ");

  if (!token) {
    throw new AppError("Token not found", 404);
  }

  let ACCESS_SECRET_KEY = "";
  if (prefix === PREFIX_USER) {
    ACCESS_SECRET_KEY = ACCESS_SECRET_KEY_USER;
  } else if (prefix === PREFIX_ADMIN) {
    ACCESS_SECRET_KEY = ACCESS_SECRET_KEY_ADMIN;
  } else {
    throw new AppError("Invalid prefix", 401);
  }

  const decoded = tokenService.verifyToken({
    token: token,
    secret_key: ACCESS_SECRET_KEY,
  });

  if (!decoded || !decoded?.id) {
    throw new AppError("Invalid token");
  }

  const user = await userModel.findOne({
    filter: { _id: decoded.id },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!user?.confirmed) {
    throw new AppError("User not confirmed yet", 401);
  }

  if (user?.changeCredential?.getTime()! > decoded.iat! * 1000) {
    throw new AppError("Invalid token");
  }
  const revokeToken = await redisService.get(
    redisService.revoke_key({ userId: user._id, jti: decoded.jti! }),
  );
  if (revokeToken) {
    throw new AppError("Token revoked");
  }

  req.user = user;
  req.decoded = decoded;

  next();
};
