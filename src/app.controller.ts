import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { PORT } from "./config/config.service.js";
import {
  AppError,
  globalErrorHandler,
} from "./common/utils/global-error-handler.js";
import authRouter from "./modules/auth/auth.controller.js";
import { checkConnectionDB } from "./DB/connectionDB.js";
import redisService from "./common/service/redis.service.js";
import notificationService from "./common/service/notification.service.js";
import postRouter from "./modules/posts/post.controller.js";
import commentRouter from "./modules/comments/comment.controller.js";
import { createHandler } from "graphql-http/lib/use/express";
import {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from "graphql";
const app: express.Application = express();
const port: number = Number(PORT);

const bootstrap = () => {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    handler: (req: Request, res: Response) => {
      throw new AppError(
        "Too many requests from this IP, please try again after 15 minutes",
        429,
      );
    },
  });
  app.use(express.json());
  app.use(cors(), helmet(), limiter);

  app.get("/", (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({ message: "Welcome to the Social Media App" });
  });

  // const users = [
  //   { id: 1, name: "ahmed", age: 20 },
  //   { id: 2, name: "omar", age: 25 },
  //   { id: 3, name: "ali", age: 40 },
  // ];

  // const userType = new GraphQLObjectType({
  //   name: "getUser",
  //   fields: {
  //     id: { type: GraphQLInt },
  //     name: { type: GraphQLString },
  //     age: { type: GraphQLInt },
  //   },
  // });

  // const schema = new GraphQLSchema({
  //   query: new GraphQLObjectType({
  //     name: "RootQueryType",
  //     fields: {
  //       getUser: {
  //         type: userType,
  //         args: {
  //           name: { type: new GraphQLNonNull(GraphQLString) },
  //         },
  //         resolve: (parent, args) => {
  //           return users.find((user) => user.name == args.name);
  //         },
  //       },
  //       listUsers: {
  //         type: new GraphQLList(userType),
  //         resolve: () => {
  //           return users;
  //         },
  //       },
  //     },
  //   }),
  // });

  // app.use("/graphql", createHandler({ schema }));

  app.post(
    "send-notification",
    (req: Request, res: Response, next: NextFunction) => {
      notificationService.sendNotification({
        token: req.body.token,
        data: {
          title: "Hiiiiiiiii",
          body: "Hiiiiii",
        },
      });
      console.log({ token: req.body.token });
    },
  );

  checkConnectionDB();
  redisService.connect();

  app.use("/auth", authRouter);
  app.use("/posts", postRouter);

  app.use("/{*demo}", (req: Request, res: Response, next: NextFunction) => {
    throw new AppError(
      `Url ${req.method} ${req.originalUrl} is not found`,
      404,
    );
  });

  app.use(globalErrorHandler);

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

export default bootstrap;
