"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderEnum = exports.emailEnum = exports.RoleEnum = exports.GenderEnum = void 0;
var GenderEnum;
(function (GenderEnum) {
    GenderEnum["male"] = "male";
    GenderEnum["female"] = "female";
})(GenderEnum || (exports.GenderEnum = GenderEnum = {}));
var RoleEnum;
(function (RoleEnum) {
    RoleEnum["user"] = "user";
    RoleEnum["admin"] = "admin";
    RoleEnum["superAdmin"] = "superAdmin";
})(RoleEnum || (exports.RoleEnum = RoleEnum = {}));
var emailEnum;
(function (emailEnum) {
    emailEnum["confirmEmail"] = "confirmEmail";
    emailEnum["resetPassword"] = "resetPassword";
})(emailEnum || (exports.emailEnum = emailEnum = {}));
var ProviderEnum;
(function (ProviderEnum) {
    ProviderEnum["google"] = "google";
    ProviderEnum["local"] = "local";
})(ProviderEnum || (exports.ProviderEnum = ProviderEnum = {}));
