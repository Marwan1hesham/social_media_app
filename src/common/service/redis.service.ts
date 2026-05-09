import { createClient, RedisClientType } from "redis";
import { REDIS_URL } from "../../config/config.service";
import { Types } from "mongoose";

class RedisService {
  private readonly client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: REDIS_URL,
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

  revoke_key = ({ userId, jti }: { userId: Types.ObjectId; jti: string }) => {
    return `revoke_token::${userId}::${jti}`;
  };

  get_key = ({ userId }: { userId: Types.ObjectId }) => {
    return `revoke_token::${userId}`;
  };

  otp_key = ({ email, subject }: { email: string; subject: string }) => {
    return `otp::${email}::${subject}`;
  };

  max_otp_key = ({ email, subject }: { email: string; subject: string }) => {
    return `${this.otp_key({ email, subject })}::max_tries`;
  };

  block_otp_key = ({ email, subject }: { email: string; subject: string }) => {
    return `${this.otp_key({ email, subject })}::block`;
  };

  setValue = async ({
    key,
    value,
    ttl,
  }: {
    key: string;
    value: string | object;
    ttl: number;
  }) => {
    try {
      const data = typeof value == "string" ? value : JSON.stringify(value);
      return ttl
        ? await this.client.set(key, data, { EX: ttl })
        : await this.client.set(key, data);
    } catch (error) {
      console.log("fail to set operation", error);
    }
  };

  update = async ({
    key,
    value,
    ttl,
  }: {
    key: string;
    value: string | object;
    ttl: number;
  }) => {
    try {
      if (!(await this.client.exists(key))) return 0;
      return await this.setValue({ key, value, ttl });
    } catch (error) {
      console.log(error, "fail to update operation");
    }
  };

  get = async (key: string) => {
    try {
      try {
        return JSON.parse((await this.client.get(key)) || "");
      } catch (error) {
        return await this.client.get(key);
      }
    } catch (error) {
      console.log(error, "fail to get operation");
    }
  };

  ttl = async (key: string) => {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.log(error, "fail to TTL operation");
    }
  };

  exists = async (key: string) => {
    try {
      return await this.client.exists(key);
    } catch (error) {
      console.log(error, "fail to exists operation");
    }
  };

  keys = async (pattern: string) => {
    try {
      return this.client.keys(`${pattern}*`);
    } catch (error) {
      console.log(error, "fail to keys operation");
    }
  };

  incr = async (key: string) => {
    try {
      return this.client.incr(key);
    } catch (error) {
      console.log(error, "fail to increment operation");
    }
  };

  deleteKey = async (key: string) => {
    try {
      if (!key.length) return 0;
      return await this.client.del(key);
    } catch (error) {
      console.log(error, "fail to keys operation");
    }
  };

  key(userId: Types.ObjectId) {
    return `user:FCM:${userId}`;
  }

  async addFCM({
    userId,
    FCMToken,
  }: {
    userId: Types.ObjectId;
    FCMToken: string;
  }) {
    return await this.client.sAdd(this.key(userId), FCMToken);
  }

  async removeFCM({
    userId,
    FCMToken,
  }: {
    userId: Types.ObjectId;
    FCMToken: string;
  }) {
    return await this.client.sRem(this.key(userId), FCMToken);
  }

  async getFCMs(userId: Types.ObjectId) {
    return await this.client.sMembers(this.key(userId));
  }

  async hasFCMs(userId: Types.ObjectId) {
    return await this.client.sCard(this.key(userId));
  }

  async removeFCMUser(userId: Types.ObjectId) {
    return await this.client.del(this.key(userId));
  }
}

export default new RedisService();
