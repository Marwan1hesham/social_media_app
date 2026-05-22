import {
  GraphQLEnumType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from "graphql";
import { AppError } from "../../../common/utils/global-error-handler";
import { GenderType, UserType } from "./user.types";
import { createUserArgs } from "./user.args";
import authService from "../auth.service";
import { authentication_gql } from "../../../common/middleware/authentication";
import { authorization } from "../../../common/middleware/authorization";
import { validation_gql } from "../../../common/middleware/validation";
import { getUserSchema } from "../auth.validation";

const users = [
  { id: 1, name: "ahmed", age: 20, gender: "male" },
  { id: 2, name: "omar", age: 25, gender: "male" },
  { id: 3, name: "ali", age: 40, gender: "male" },
];

class UserFields {
  constructor() {}

  query = () => {
    return {
      listUsers: {
        type: new GraphQLList(UserType),
        resolve: (parent: any, args: any, context: any) => {
          return authService.getUsers();
        },
      },
      getUser: {
        type: UserType,
        args: { token: { type: new GraphQLNonNull(GraphQLString) } },
        resolve: async (parent: any, args: any, context: any) => {
          await validation_gql(getUserSchema, args);
          const { user, decoded } = await authentication_gql(args.token);
          await authorization(["user", "admin"], user?.role!);

          return authService.getUser(user?._id!);
        },
      },
    };
  };

  mutation = () => {
    return {};
  };
}

export default new UserFields();
