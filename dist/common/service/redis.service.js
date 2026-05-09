"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const config_service_1 = require("../../config/config.service");
class RedisService {
    client;
    constructor() {
        this.client = (0, redis_1.createClient)({
            url: config_service_1.REDIS_URL,
        });
    }
    async connect() {
        await this.client.connect();
        console.log("Connected to Redis successfully");
        this.client.on("error", (error) => {
            console.log("==========================", error);
        });
    }
    handleEvent() {
        this.client.on("error", (error) => {
            console.log("Connection to Redis failed", error);
        });
    }
    revoke_key = ({ userId, jti }) => {
        return `revoke_token::${userId}::${jti}`;
    };
    get_key = ({ userId }) => {
        return `revoke_token::${userId}`;
    };
    otp_key = ({ email, subject }) => {
        return `otp::${email}::${subject}`;
    };
    max_otp_key = ({ email, subject }) => {
        return `${this.otp_key({ email, subject })}::max_tries`;
    };
    block_otp_key = ({ email, subject }) => {
        return `${this.otp_key({ email, subject })}::block`;
    };
    setValue = async ({ key, value, ttl, }) => {
        try {
            const data = typeof value == "string" ? value : JSON.stringify(value);
            return ttl
                ? await this.client.set(key, data, { EX: ttl })
                : await this.client.set(key, data);
        }
        catch (error) {
            console.log("fail to set operation", error);
        }
    };
    update = async ({ key, value, ttl, }) => {
        try {
            if (!(await this.client.exists(key)))
                return 0;
            return await this.setValue({ key, value, ttl });
        }
        catch (error) {
            console.log(error, "fail to update operation");
        }
    };
    get = async (key) => {
        try {
            try {
                return JSON.parse((await this.client.get(key)) || "");
            }
            catch (error) {
                return await this.client.get(key);
            }
        }
        catch (error) {
            console.log(error, "fail to get operation");
        }
    };
    ttl = async (key) => {
        try {
            return await this.client.ttl(key);
        }
        catch (error) {
            console.log(error, "fail to TTL operation");
        }
    };
    exists = async (key) => {
        try {
            return await this.client.exists(key);
        }
        catch (error) {
            console.log(error, "fail to exists operation");
        }
    };
    keys = async (pattern) => {
        try {
            return this.client.keys(`${pattern}*`);
        }
        catch (error) {
            console.log(error, "fail to keys operation");
        }
    };
    incr = async (key) => {
        try {
            return this.client.incr(key);
        }
        catch (error) {
            console.log(error, "fail to increment operation");
        }
    };
    deleteKey = async (key) => {
        try {
            if (!key.length)
                return 0;
            return await this.client.del(key);
        }
        catch (error) {
            console.log(error, "fail to keys operation");
        }
    };
    key(userId) {
        return `user:FCM:${userId}`;
    }
    async addFCM({ userId, FCMToken, }) {
        return await this.client.sAdd(this.key(userId), FCMToken);
    }
    async removeFCM({ userId, FCMToken, }) {
        return await this.client.sRem(this.key(userId), FCMToken);
    }
    async getFCMs(userId) {
        return await this.client.sMembers(this.key(userId));
    }
    async hasFCMs(userId) {
        return await this.client.sCard(this.key(userId));
    }
    async removeFCMUser(userId) {
        return await this.client.del(this.key(userId));
    }
}
exports.default = new RedisService();
