"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const config_service_1 = require("../../config/config.service");
const node_crypto_1 = require("node:crypto");
const multer_enum_1 = require("../enum/multer.enum");
const fs_1 = __importDefault(require("fs"));
const global_error_handler_1 = require("../utils/global-error-handler");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
class S3Service {
    client;
    constructor() {
        this.client = new client_s3_1.S3Client({
            region: config_service_1.AWS_REGION,
            credentials: {
                accessKeyId: config_service_1.AWS_ACCESS_KEY,
                secretAccessKey: config_service_1.AWS_SECRET_ACCESS_KEY,
            },
        });
    }
    async uploadFile({ file, store_type = multer_enum_1.StoreEnum.memory, path = "General", ACL = client_s3_1.ObjectCannedACL.private, }) {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: config_service_1.AWS_BUCKET_NAME,
            ACL,
            Key: `social_media_app/${path}/${(0, node_crypto_1.randomUUID)()}__${file.originalname}`,
            Body: store_type === multer_enum_1.StoreEnum.memory
                ? file.buffer
                : fs_1.default.createReadStream(file.path),
            ContentType: file.mimetype,
        });
        if (!command.input.Key) {
            throw new global_error_handler_1.AppError("Failed to upload file");
        }
        await this.client.send(command);
        return command.input.Key;
    }
    async uploadLargeFile({ file, store_type = multer_enum_1.StoreEnum.disk, path = "General", ACL = client_s3_1.ObjectCannedACL.private, }) {
        const command = new lib_storage_1.Upload({
            client: this.client,
            params: {
                Bucket: config_service_1.AWS_BUCKET_NAME,
                ACL,
                Key: `social_media_app/${path}/${(0, node_crypto_1.randomUUID)()}__${file.originalname}`,
                Body: store_type === multer_enum_1.StoreEnum.memory
                    ? file.buffer
                    : fs_1.default.createReadStream(file.path),
                ContentType: file.mimetype,
            },
        });
        const result = await command.done();
        command.on("httpUploadProgress", (progress) => {
            console.log(progress);
        });
        return result.Key;
    }
    async uploadFiles({ files, store_type = multer_enum_1.StoreEnum.memory, path = "General", ACL = client_s3_1.ObjectCannedACL.private, isLarge = false, }) {
        let urls = [];
        if (isLarge) {
            urls = await Promise.all(files.map((file) => {
                return this.uploadLargeFile({ file, store_type, path, ACL });
            }));
        }
        else {
            urls = await Promise.all(files.map((file) => {
                return this.uploadFile({ file, store_type, path, ACL });
            }));
        }
        return urls;
    }
    async createPreSignUrl({ path, fileName, ContentType, expiresIn = 60, }) {
        const Key = `social_media_app/${path}/${(0, node_crypto_1.randomUUID)()}__${fileName}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: config_service_1.AWS_BUCKET_NAME,
            Key,
            ContentType,
        });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn });
        return { url, Key };
    }
    async getFile(Key) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: config_service_1.AWS_BUCKET_NAME,
            Key,
        });
        await this.client.send(command);
    }
    async deleteFile(Key) {
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket: config_service_1.AWS_BUCKET_NAME,
            Key,
        });
        return await this.client.send(command);
    }
    async deleteFiles(Keys) {
        const keyMapped = Keys.map((k) => {
            return { Key: k };
        });
        const command = new client_s3_1.DeleteObjectsCommand({
            Bucket: config_service_1.AWS_BUCKET_NAME,
            Delete: {
                Objects: keyMapped,
                Quiet: false,
            },
        });
        return await this.client.send(command);
    }
}
exports.S3Service = S3Service;
