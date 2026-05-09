import { Router } from "express";
import { validation } from "../../common/middleware/validation.js";
import * as authValidation from "./auth.validation.js";
import AuthService from "./auth.service.js";
import { authentication } from "../../common/middleware/authentication.js";
import multerCloud from "../../common/middleware/multer.cloud.js";
import { StoreEnum } from "../../common/enum/multer.enum.js";

const authRouter = Router();

authRouter.post(
  "/signin",
  validation(authValidation.singInSchema),
  AuthService.signIn,
);
authRouter.post(
  "/signup",
  validation(authValidation.singUpSchema),
  AuthService.signUp,
);
authRouter.post("/signup/gmail", AuthService.signUpWithGmail);
authRouter.post(
  "/resend-otp",
  validation(authValidation.resendOtpSchema),
  AuthService.resendOtp,
);
authRouter.patch(
  "/confirm-email",
  validation(authValidation.confirmEmailSchema),
  AuthService.confirmEmail,
);
authRouter.get("/profile", authentication, AuthService.getProfile);
authRouter.post("/logout", authentication, AuthService.logout);
authRouter.post(
  "/upload",
  authentication,
  // multerCloud({ store_type: StoreEnum.memory }).array("attachment"),
  AuthService.uploadImage,
);

export default authRouter;
