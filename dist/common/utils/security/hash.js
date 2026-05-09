"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Compare = exports.Hash = void 0;
const bcrypt_1 = require("bcrypt");
const config_service_js_1 = require("../../../config/config.service.js");
const Hash = ({ plainText, salt_rounds = config_service_js_1.SALT_ROUNDS, }) => {
    return (0, bcrypt_1.hashSync)(plainText, salt_rounds);
};
exports.Hash = Hash;
const Compare = ({ plainText, cipherText, }) => {
    return (0, bcrypt_1.compareSync)(plainText, cipherText);
};
exports.Compare = Compare;
