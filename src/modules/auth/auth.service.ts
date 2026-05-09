import { NextFunction, Request, Response } from "express";
import userModel, { IUser } from "../../DB/models/user.model";
import { HydratedDocument, Model } from "mongoose";
import { ConfirmEmailDto, SignInDto, SignUpDto } from "./auth.dto";
import UserRepository from "../../DB/repository/user.repository";
import { encrypt } from "../../common/utils/security/encrypt";
import { Compare, Hash } from "../../common/utils/security/hash";
import {
  ACCESS_SECRET_KEY_ADMIN,
  ACCESS_SECRET_KEY_USER,
  CLIENT_ID,
  REFRESH_SECRET_KEY_ADMIN,
  REFRESH_SECRET_KEY_USER,
  SALT_ROUNDS,
} from "../../config/config.service";
import { AppError } from "../../common/utils/global-error-handler";
import { generateOtp, sendEmail } from "../../common/utils/email/send.email";
import { emailTemplate } from "../../common/utils/email/email.template";
import RedisService from "../../common/service/redis.service";
import { eventEmitter } from "../../common/utils/email/email.events";
import { emailEnum, ProviderEnum, RoleEnum } from "../../common/enum/user.enum";
import { successResponce } from "../../common/utils/responce.success";
import { randomUUID } from "node:crypto";
import TokenService from "../../common/service/token.service";
import { OAuth2Client } from "google-auth-library";
import { JwtPayload } from "jsonwebtoken";
import { S3Service } from "../../common/service/s3.service";
import notificationService from "../../common/service/notification.service";

class AuthService {
  private readonly _userRepo = new UserRepository();
  private readonly _s3Service = new S3Service();
  private readonly _redisService = RedisService;
  private readonly _tokenService = TokenService;
  private readonly _notificationService = notificationService;

  constructor() {}

  sendEmailOtp = async ({
    email,
    subject,
  }: {
    email: string;
    subject: string;
  }) => {
    const isBlocked = await this._redisService.ttl(
      this._redisService.block_otp_key({ email, subject }),
    );
    if (isBlocked! > 0) {
      throw new AppError(
        `You are blocked, please try again after ${isBlocked} seconds`,
      );
    }

    const otpTTl = await this._redisService.ttl(
      this._redisService.otp_key({ email, subject }),
    );
    if (otpTTl! > 0) {
      throw new AppError(`You can resend otp after ${otpTTl} seconds`);
    }

    const maxOtp = await this._redisService.get(
      this._redisService.max_otp_key({ email, subject }),
    );
    if (maxOtp! >= 3) {
      await this._redisService.setValue({
        key: this._redisService.block_otp_key({ email, subject }),
        value: "1",
        ttl: 60,
      });
      await this._redisService.deleteKey(
        this._redisService.max_otp_key({ email, subject }),
      );
      throw new Error("You have exceeded the maximum number of tries");
    }

    const otp = await generateOtp();
    eventEmitter.emit(emailEnum.confirmEmail, async () => {
      await sendEmail({
        to: email,
        subject: "Welcome to Saraha App",
        html: emailTemplate(otp),
      });
    });

    await this._redisService.setValue({
      key: this._redisService.otp_key({ email, subject }),
      value: Hash({ plainText: `${otp}` }),
      ttl: 60 * 2,
    });

    await this._redisService.incr(
      this._redisService.max_otp_key({ email, subject }),
    );
  };

  signUp = async (req: Request, res: Response, next: NextFunction) => {
    let { userName, email, password, age, gender, phone, address }: SignUpDto =
      req.body;

    if (await this._userRepo.findOne({ filter: { email } })) {
      throw new AppError("Email already exists", 409);
    }

    const user: HydratedDocument<IUser> = await this._userRepo.create({
      userName,
      email,
      password: Hash({ plainText: password }),
      age,
      gender,
      phone: phone ? encrypt(phone) : null,
      address,
    } as Partial<IUser>);

    const otp = await generateOtp();

    eventEmitter.emit(emailEnum.confirmEmail, async () => {
      await sendEmail({
        to: email,
        subject: "Verify Your Email",
        html: emailTemplate(otp),
      });
      await this._redisService.setValue({
        key: this._redisService.otp_key({
          email,
          subject: emailEnum.confirmEmail,
        }),
        value: Hash({ plainText: `${otp}` }),
        ttl: 60 * 3,
      });
      await this._redisService.setValue({
        key: this._redisService.max_otp_key({
          email,
          subject: emailEnum.confirmEmail,
        }),
        value: "1",
        ttl: 60 * 3,
      });
    });

    res.status(200).json({
      message: "Signed up successfully",
      data: user,
    });
  };

  signUpWithGmail = async (req: Request, res: Response, next: NextFunction) => {
    const { idToken } = req.body;

    const client = new OAuth2Client();

    const ticket = await client.verifyIdToken({
      idToken,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, email_verified, name, picture } = payload as JwtPayload;

    let user = await this._userRepo.findOne({ filter: { email } });

    if (!user) {
      user = await this._userRepo.create({
        email,
        confirmed: email_verified,
        userName: name,
        provider: ProviderEnum.google,
        profilePicture: picture,
      } as Partial<IUser>);
    }

    if (user.provider == ProviderEnum.local) {
      throw new Error("please log in on system", { cause: 400 });
    }

    const uuid = randomUUID();

    const access_token = this._tokenService.generateToken({
      payload: { id: user._id, email: user.email },
      secret_key: ACCESS_SECRET_KEY_USER,
      options: {
        expiresIn: 60 * 10,
        jwtid: uuid,
      },
    });

    successResponce({
      res,
      message: "Logged in successfully",
      data: access_token,
    });
  };

  resendOtp = async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    const user = await this._userRepo.findOne({
      filter: {
        email,
        confirmed: { $exists: false },
        provider: ProviderEnum.local,
      },
    });
    if (!user) {
      throw new AppError("User not found or already confirmed", 404);
    }

    await this.sendEmailOtp({ email, subject: emailEnum.confirmEmail });

    successResponce({
      res,
      message: "Otp sent successfully",
    });
  };

  confirmEmail = async (req: Request, res: Response, next: NextFunction) => {
    const { email, code }: ConfirmEmailDto = req.body;

    const otpValue = await this._redisService.get(
      this._redisService.otp_key({ email, subject: emailEnum.confirmEmail }),
    );
    if (!otpValue) {
      throw new AppError("Otp expired", 400);
    }

    if (!Compare({ plainText: code, cipherText: otpValue })) {
      throw new AppError("Invalid otp", 400);
    }

    const user = this._userRepo.findOneAndUpdate({
      filter: {
        email,
        confirmed: { $exists: false },
        provider: ProviderEnum.local,
      },
      update: { confirmed: true },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    await this._redisService.deleteKey(
      this._redisService.otp_key({ email, subject: emailEnum.confirmEmail }),
    );

    successResponce({ res, message: "Email confirmed successfully" });
  };

  signIn = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, fcm }: SignInDto = req.body;

    const user = await this._userRepo.findOne({ filter: { email } });

    if (!user) {
      throw new AppError("invalid email or password", 400);
    }

    if (!Compare({ plainText: password, cipherText: user.password })) {
      throw new AppError("invalid email or password", 400);
    }

    const uuid = randomUUID();

    const access_token = this._tokenService.generateToken({
      payload: { id: user._id, email: user.email },
      secret_key:
        user?.role == RoleEnum.user
          ? ACCESS_SECRET_KEY_USER
          : ACCESS_SECRET_KEY_ADMIN,
      options: {
        expiresIn: 60 * 10,
        jwtid: uuid,
      },
    });

    const refresh_token = this._tokenService.generateToken({
      payload: { id: user._id, email: user.email },
      secret_key:
        user?.role == RoleEnum.user
          ? REFRESH_SECRET_KEY_USER
          : REFRESH_SECRET_KEY_ADMIN,
      options: {
        expiresIn: "1y",
        jwtid: uuid,
      },
    });

    if (fcm) {
      await this._redisService.addFCM({ userId: user._id, FCMToken: fcm });
      const tokens = await this._redisService.getFCMs(user._id);

      await this._notificationService.sendNotifications({
        tokens,
        data: {
          title: `hi ${user.firstName}`,
          body: `new login at ${new Date()}`,
        },
      });
    }

    successResponce({
      res,
      message: "Logged in successfully",
      data: {
        access_token,
        refresh_token,
      },
    });
  };

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    successResponce({ res, message: "Done", data: req.user });
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    if (req.query.flag == "all") {
      req.user.changeCredential = new Date();
      await req.user.save();

      await this._redisService.keys(
        this._redisService.get_key({ userId: req.user._id }),
      );
    } else {
      await this._redisService.setValue({
        key: this._redisService.revoke_key({
          userId: req.user._id,
          jti: req.decoded.jti!,
        }),
        value: `${req.decoded.jti}`,
        ttl: req.decoded.exp! - Math.floor(Date.now() / 1000),
      });
    }

    successResponce({ res, message: "Logged out successfully" });
  };

  uploadImage = async (req: Request, res: Response, next: NextFunction) => {
    const { fileName, ContentType } = req.body;

    const { url, Key } = await this._s3Service.createPreSignUrl({
      path: `users/${req?.user?._id}`,
      fileName,
      ContentType,
    });

    await this._userRepo.findOneAndUpdate({
      filter: { _id: req?.user?._id },
      update: { profilePicture: Key },
    });

    successResponce({ res, data: { url, Key } });
  };
}

export default new AuthService();
