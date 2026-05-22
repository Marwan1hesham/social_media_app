import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";
import { AppError } from "../utils/global-error-handler";
import { GraphQLError } from "graphql";

type reqType = keyof Request;
type schemaType = Partial<Record<reqType, ZodType>>;

export const validation = (schema: schemaType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const errorValidation = [];
    for (const key of Object.keys(schema) as reqType[]) {
      if (!schema[key]) continue;

      if (req?.file) {
        req.body.attachment = req.file;
      }
      if (req?.files) {
        req.body.attachments = req.files;
      }

      const result = await schema[key].safeParseAsync(req[key]);

      if (!result?.success) {
        errorValidation.push(result?.error.message);
      }
    }

    if (errorValidation.length) {
      throw new AppError(JSON.parse(errorValidation as unknown as string), 400);
    }

    next();
  };
};

export const validation_gql = async (schema: ZodType, data: any) => {
  const errorValidation = [];

  const result = await schema.safeParseAsync(data);

  if (!result?.success) {
    const errors = result.error.issues.map((err: any) => {
      return {
        path: err.path[0],
        message: err.message,
      };
    });
    errorValidation.push(result?.error.message);
  }

  if (errorValidation.length) {
    throw new GraphQLError("Validation Error", {
      extensions: {
        code: "BAD_REQUEST",
        status: 400,
        errors: errorValidation
      }
    })
  }
};
