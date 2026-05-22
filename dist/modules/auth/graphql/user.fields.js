"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const user_types_1 = require("./user.types");
const auth_service_1 = __importDefault(require("../auth.service"));
const authentication_1 = require("../../../common/middleware/authentication");
const authorization_1 = require("../../../common/middleware/authorization");
const validation_1 = require("../../../common/middleware/validation");
const auth_validation_1 = require("../auth.validation");
const users = [
    { id: 1, name: "ahmed", age: 20, gender: "male" },
    { id: 2, name: "omar", age: 25, gender: "male" },
    { id: 3, name: "ali", age: 40, gender: "male" },
];
class UserFields {
    constructor() { }
    query = () => {
        return {
            listUsers: {
                type: new graphql_1.GraphQLList(user_types_1.UserType),
                resolve: (parent, args, context) => {
                    return auth_service_1.default.getUsers();
                },
            },
            getUser: {
                type: user_types_1.UserType,
                args: { token: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) } },
                resolve: async (parent, args, context) => {
                    await (0, validation_1.validation_gql)(auth_validation_1.getUserSchema, args);
                    const { user, decoded } = await (0, authentication_1.authentication_gql)(args.token);
                    await (0, authorization_1.authorization)(["user", "admin"], user?.role);
                    return auth_service_1.default.getUser(user?._id);
                },
            },
        };
    };
    mutation = () => {
        return {};
    };
}
exports.default = new UserFields();
