"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = require("express-rate-limit");
const config_service_js_1 = require("./config/config.service.js");
const global_error_handler_js_1 = require("./common/utils/global-error-handler.js");
const auth_controller_js_1 = __importDefault(require("./modules/auth/auth.controller.js"));
const connectionDB_js_1 = require("./DB/connectionDB.js");
const redis_service_js_1 = __importDefault(require("./common/service/redis.service.js"));
const notification_service_js_1 = __importDefault(require("./common/service/notification.service.js"));
const post_controller_js_1 = __importDefault(require("./modules/posts/post.controller.js"));
const app = (0, express_1.default)();
const port = Number(config_service_js_1.PORT);
const bootstrap = () => {
    const limiter = (0, express_rate_limit_1.rateLimit)({
        windowMs: 15 * 60 * 1000,
        max: 100,
        handler: (req, res) => {
            throw new global_error_handler_js_1.AppError("Too many requests from this IP, please try again after 15 minutes", 429);
        },
    });
    app.use(express_1.default.json());
    app.use((0, cors_1.default)(), (0, helmet_1.default)(), limiter);
    app.get("/", (req, res, next) => {
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
    app.post("send-notification", (req, res, next) => {
        notification_service_js_1.default.sendNotification({
            token: req.body.token,
            data: {
                title: "Hiiiiiiiii",
                body: "Hiiiiii",
            },
        });
        console.log({ token: req.body.token });
    });
    (0, connectionDB_js_1.checkConnectionDB)();
    redis_service_js_1.default.connect();
    app.use("/auth", auth_controller_js_1.default);
    app.use("/posts", post_controller_js_1.default);
    app.use("/{*demo}", (req, res, next) => {
        throw new global_error_handler_js_1.AppError(`Url ${req.method} ${req.originalUrl} is not found`, 404);
    });
    app.use(global_error_handler_js_1.globalErrorHandler);
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
};
exports.default = bootstrap;
