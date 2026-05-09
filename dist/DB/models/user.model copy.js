"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const user_enum_1 = require("../../common/enum/user.enum");
const userSchema = new mongoose_1.default.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 50,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 50,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    provider: {
        type: String,
        enum: user_enum_1.ProviderEnum,
        default: user_enum_1.ProviderEnum.local,
    },
    password: {
        type: String,
        trim: true,
        minlength: 3,
        required: function () {
            return this.provider !== user_enum_1.ProviderEnum.google;
        },
    },
    age: {
        type: Number,
        min: 18,
        max: 100,
    },
    phone: {
        type: String,
        trim: true,
    },
    address: {
        type: String,
        trim: true,
    },
    gender: {
        type: String,
        enum: user_enum_1.GenderEnum,
        default: user_enum_1.GenderEnum.male,
    },
    role: {
        type: String,
        enum: user_enum_1.RoleEnum,
        default: user_enum_1.RoleEnum.user,
    },
    deletedAt: Date,
    confirmed: Boolean,
    profilePicture: String,
    changeCredential: Date,
}, {
    timestamps: true,
    strict: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
userSchema
    .virtual("userName")
    .get(function () {
    return this.firstName + " " + this.lastName;
})
    .set(function (value) {
    this.set({ firstName: value.split(" ")[0], lastName: value.split(" ")[1] });
});
userSchema.pre("findOne", function () {
    const { paranoid, ...rest } = this.getQuery();
    if (paranoid == false) {
        this.setQuery({ ...rest });
    }
    else {
        this.setQuery({ ...rest, deletedAt: { $exists: false } });
    }
});
const userModel = mongoose_1.default.models.User || mongoose_1.default.model("User", userSchema);
exports.default = userModel;
