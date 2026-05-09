"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validation_js_1 = require("../../common/middleware/validation.js");
const authValidation = __importStar(require("./auth.validation.js"));
const auth_service_js_1 = __importDefault(require("./auth.service.js"));
const authentication_js_1 = require("../../common/middleware/authentication.js");
const authRouter = (0, express_1.Router)();
authRouter.post("/signin", (0, validation_js_1.validation)(authValidation.singInSchema), auth_service_js_1.default.signIn);
authRouter.post("/signup", (0, validation_js_1.validation)(authValidation.singUpSchema), auth_service_js_1.default.signUp);
authRouter.post("/signup/gmail", auth_service_js_1.default.signUpWithGmail);
authRouter.post("/resend-otp", (0, validation_js_1.validation)(authValidation.resendOtpSchema), auth_service_js_1.default.resendOtp);
authRouter.patch("/confirm-email", (0, validation_js_1.validation)(authValidation.confirmEmailSchema), auth_service_js_1.default.confirmEmail);
authRouter.get("/profile", authentication_js_1.authentication, auth_service_js_1.default.getProfile);
authRouter.post("/logout", authentication_js_1.authentication, auth_service_js_1.default.logout);
authRouter.post("/upload", authentication_js_1.authentication, 
// multerCloud({ store_type: StoreEnum.memory }).array("attachment"),
auth_service_js_1.default.uploadImage);
exports.default = authRouter;
