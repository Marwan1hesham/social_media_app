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
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmEmailSchema = exports.singUpSchema = exports.singInSchema = exports.resendOtpSchema = void 0;
const z = __importStar(require("zod"));
const user_enum_1 = require("../../common/enum/user.enum");
exports.resendOtpSchema = {
    body: z.object({
        email: z.email("Invalid email address"),
    }),
};
exports.singInSchema = {
    body: z.object({
        email: z.email("Invalid email address"),
        password: z.string().min(6),
        fcm: z.string(),
    }),
};
exports.singUpSchema = {
    body: z
        .object({
        userName: z.string({ error: "userName is required" }).min(3).max(25),
        email: z.email("Invalid email address"),
        password: z.string().min(6),
        cPassword: z.string().min(6),
        age: z.number({ error: "age is required" }).min(18).max(100),
        gender: z.enum(user_enum_1.GenderEnum).optional(),
        phone: z.string().min(11).max(15).optional(),
        address: z.string().min(3).max(100).optional(),
    })
        .refine((data) => {
        return data.password === data.cPassword;
    }, {
        message: "Passwords do not match",
        path: ["cPassword"],
    }),
};
exports.confirmEmailSchema = {
    body: z.object({
        email: z.email("Invalid email address"),
        code: z.string().regex(/^\d{6}$/),
    }),
};
