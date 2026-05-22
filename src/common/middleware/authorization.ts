import { AppError } from "../utils/global-error-handler";

export const authorization = async (roles: string[], role: string) => {
  if (!roles.includes(role)) {
    throw new AppError("Unauthorized");
  }
};
