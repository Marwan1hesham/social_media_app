"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserArgs = void 0;
const graphql_1 = require("graphql");
const user_types_1 = require("./user.types");
// export const getUserArgs = {
//   id: { type: new GraphQLNonNull(GraphQLInt) },
// };
exports.createUserArgs = {
    id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt) },
    age: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt) },
    name: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
    gender: { type: new graphql_1.GraphQLNonNull(user_types_1.GenderType) },
};
