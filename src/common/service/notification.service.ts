import admin from "firebase-admin";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

class NotificationService {
  private readonly client: admin.app.App;

  constructor() {
    const serviceAccount = JSON.parse(
      readFileSync(
        resolve(
          __dirname,
          "../../config/social-media-app-5c78e-firebase-adminsdk-fbsvc-42a887f975.json",
        ),
      ) as unknown as string,
    );

    this.client = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  async sendNotification({
    token,
    data,
  }: {
    token: string;
    data: { title: string; body: string };
  }) {
    const message = {
      token,
      data,
    };
    return await this.client.messaging().send(message);
  }

  async sendNotifications({
    tokens,
    data,
  }: {
    tokens: string[];
    data: { title: string; body: string };
  }) {
    await Promise.all(
      tokens.map((token) => {
        return this.sendNotification({ token, data });
      }),
    );
  }
}

export default new NotificationService();
