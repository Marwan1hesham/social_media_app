"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_repository_1 = __importDefault(require("../../DB/repository/user.repository"));
const encrypt_1 = require("../../common/utils/security/encrypt");
const hash_1 = require("../../common/utils/security/hash");
const config_service_1 = require("../../config/config.service");
const global_error_handler_1 = require("../../common/utils/global-error-handler");
const send_email_1 = require("../../common/utils/email/send.email");
const email_template_1 = require("../../common/utils/email/email.template");
const redis_service_1 = __importDefault(require("../../common/service/redis.service"));
const email_events_1 = require("../../common/utils/email/email.events");
const user_enum_1 = require("../../common/enum/user.enum");
const responce_success_1 = require("../../common/utils/responce.success");
const node_crypto_1 = require("node:crypto");
const token_service_1 = __importDefault(require("../../common/service/token.service"));
const google_auth_library_1 = require("google-auth-library");
const s3_service_1 = require("../../common/service/s3.service");
const notification_service_1 = __importDefault(require("../../common/service/notification.service"));
class AuthService {
    _userRepo = new user_repository_1.default();
    _s3Service = new s3_service_1.S3Service();
    _redisService = redis_service_1.default;
    _tokenService = token_service_1.default;
    _notificationService = notification_service_1.default;
    constructor() { }
    sendEmailOtp = async ({ email, subject, }) => {
        const isBlocked = await this._redisService.ttl(this._redisService.block_otp_key({ email, subject }));
        if (isBlocked > 0) {
            throw new global_error_handler_1.AppError(`You are blocked, please try again after ${isBlocked} seconds`);
        }
        const otpTTl = await this._redisService.ttl(this._redisService.otp_key({ email, subject }));
        if (otpTTl > 0) {
            throw new global_error_handler_1.AppError(`You can resend otp after ${otpTTl} seconds`);
        }
        const maxOtp = await this._redisService.get(this._redisService.max_otp_key({ email, subject }));
        if (maxOtp >= 3) {
            await this._redisService.setValue({
                key: this._redisService.block_otp_key({ email, subject }),
                value: "1",
                ttl: 60,
            });
            await this._redisService.deleteKey(this._redisService.max_otp_key({ email, subject }));
            throw new Error("You have exceeded the maximum number of tries");
        }
        const otp = await (0, send_email_1.generateOtp)();
        email_events_1.eventEmitter.emit(user_enum_1.emailEnum.confirmEmail, async () => {
            await (0, send_email_1.sendEmail)({
                to: email,
                subject: "Welcome to Saraha App",
                html: (0, email_template_1.emailTemplate)(otp),
            });
        });
        await this._redisService.setValue({
            key: this._redisService.otp_key({ email, subject }),
            value: (0, hash_1.Hash)({ plainText: `${otp}` }),
            ttl: 60 * 2,
        });
        await this._redisService.incr(this._redisService.max_otp_key({ email, subject }));
    };
    signUp = async (req, res, next) => {
        let { userName, email, password, age, gender, phone, address } = req.body;
        if (await this._userRepo.findOne({ filter: { email } })) {
            throw new global_error_handler_1.AppError("Email already exists", 409);
        }
        const user = await this._userRepo.create({
            userName,
            email,
            password: (0, hash_1.Hash)({ plainText: password }),
            age,
            gender,
            phone: phone ? (0, encrypt_1.encrypt)(phone) : null,
            address,
        });
        const otp = await (0, send_email_1.generateOtp)();
        email_events_1.eventEmitter.emit(user_enum_1.emailEnum.confirmEmail, async () => {
            await (0, send_email_1.sendEmail)({
                to: email,
                subject: "Verify Your Email",
                html: (0, email_template_1.emailTemplate)(otp),
            });
            await this._redisService.setValue({
                key: this._redisService.otp_key({
                    email,
                    subject: user_enum_1.emailEnum.confirmEmail,
                }),
                value: (0, hash_1.Hash)({ plainText: `${otp}` }),
                ttl: 60 * 3,
            });
            await this._redisService.setValue({
                key: this._redisService.max_otp_key({
                    email,
                    subject: user_enum_1.emailEnum.confirmEmail,
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
    signUpWithGmail = async (req, res, next) => {
        const { idToken } = req.body;
        const client = new google_auth_library_1.OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken,
            audience: config_service_1.CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, email_verified, name, picture } = payload;
        let user = await this._userRepo.findOne({ filter: { email } });
        if (!user) {
            user = await this._userRepo.create({
                email,
                confirmed: email_verified,
                userName: name,
                provider: user_enum_1.ProviderEnum.google,
                profilePicture: picture,
            });
        }
        if (user.provider == user_enum_1.ProviderEnum.local) {
            throw new Error("please log in on system", { cause: 400 });
        }
        const uuid = (0, node_crypto_1.randomUUID)();
        const access_token = this._tokenService.generateToken({
            payload: { id: user._id, email: user.email },
            secret_key: config_service_1.ACCESS_SECRET_KEY_USER,
            options: {
                expiresIn: 60 * 10,
                jwtid: uuid,
            },
        });
        (0, responce_success_1.successResponce)({
            res,
            message: "Logged in successfully",
            data: access_token,
        });
    };
    resendOtp = async (req, res, next) => {
        const { email } = req.body;
        const user = await this._userRepo.findOne({
            filter: {
                email,
                confirmed: { $exists: false },
                provider: user_enum_1.ProviderEnum.local,
            },
        });
        if (!user) {
            throw new global_error_handler_1.AppError("User not found or already confirmed", 404);
        }
        await this.sendEmailOtp({ email, subject: user_enum_1.emailEnum.confirmEmail });
        (0, responce_success_1.successResponce)({
            res,
            message: "Otp sent successfully",
        });
    };
    confirmEmail = async (req, res, next) => {
        const { email, code } = req.body;
        const otpValue = await this._redisService.get(this._redisService.otp_key({ email, subject: user_enum_1.emailEnum.confirmEmail }));
        if (!otpValue) {
            throw new global_error_handler_1.AppError("Otp expired", 400);
        }
        if (!(0, hash_1.Compare)({ plainText: code, cipherText: otpValue })) {
            throw new global_error_handler_1.AppError("Invalid otp", 400);
        }
        const user = this._userRepo.findOneAndUpdate({
            filter: {
                email,
                confirmed: { $exists: false },
                provider: user_enum_1.ProviderEnum.local,
            },
            update: { confirmed: true },
        });
        if (!user) {
            throw new global_error_handler_1.AppError("User not found", 404);
        }
        await this._redisService.deleteKey(this._redisService.otp_key({ email, subject: user_enum_1.emailEnum.confirmEmail }));
        (0, responce_success_1.successResponce)({ res, message: "Email confirmed successfully" });
    };
    signIn = async (req, res, next) => {
        const { email, password, fcm } = req.body;
        const user = await this._userRepo.findOne({ filter: { email } });
        if (!user) {
            throw new global_error_handler_1.AppError("invalid email or password", 400);
        }
        if (!(0, hash_1.Compare)({ plainText: password, cipherText: user.password })) {
            throw new global_error_handler_1.AppError("invalid email or password", 400);
        }
        const uuid = (0, node_crypto_1.randomUUID)();
        const access_token = this._tokenService.generateToken({
            payload: { id: user._id, email: user.email },
            secret_key: user?.role == user_enum_1.RoleEnum.user
                ? config_service_1.ACCESS_SECRET_KEY_USER
                : config_service_1.ACCESS_SECRET_KEY_ADMIN,
            options: {
                expiresIn: 60 * 10,
                jwtid: uuid,
            },
        });
        const refresh_token = this._tokenService.generateToken({
            payload: { id: user._id, email: user.email },
            secret_key: user?.role == user_enum_1.RoleEnum.user
                ? config_service_1.REFRESH_SECRET_KEY_USER
                : config_service_1.REFRESH_SECRET_KEY_ADMIN,
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
        (0, responce_success_1.successResponce)({
            res,
            message: "Logged in successfully",
            data: {
                access_token,
                refresh_token,
            },
        });
    };
    getProfile = async (req, res, next) => {
        (0, responce_success_1.successResponce)({ res, message: "Done", data: req.user });
    };
    logout = async (req, res, next) => {
        if (req.query.flag == "all") {
            req.user.changeCredential = new Date();
            await req.user.save();
            await this._redisService.keys(this._redisService.get_key({ userId: req.user._id }));
        }
        else {
            await this._redisService.setValue({
                key: this._redisService.revoke_key({
                    userId: req.user._id,
                    jti: req.decoded.jti,
                }),
                value: `${req.decoded.jti}`,
                ttl: req.decoded.exp - Math.floor(Date.now() / 1000),
            });
        }
        (0, responce_success_1.successResponce)({ res, message: "Logged out successfully" });
    };
    uploadImage = async (req, res, next) => {
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
        (0, responce_success_1.successResponce)({ res, data: { url, Key } });
    };
}
exports.default = new AuthService();
