"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
class NotificationService {
    client;
    constructor() {
        const serviceAccount = JSON.parse((0, node_fs_1.readFileSync)((0, node_path_1.resolve)(__dirname, "../../config/social-media-app-5c78e-firebase-adminsdk-fbsvc-42a887f975.json")));
        this.client = firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert(serviceAccount),
        });
    }
    async sendNotification({ token, data, }) {
        const message = {
            token,
            data,
        };
        return await this.client.messaging().send(message);
    }
    async sendNotifications({ tokens, data, }) {
        await Promise.all(tokens.map((token) => {
            return this.sendNotification({ token, data });
        }));
    }
}
exports.default = new NotificationService();
