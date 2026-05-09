"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreEnum = exports.multer_enum = void 0;
exports.multer_enum = {
    image: ["image/png", "image/jpg", "image/jpeg", "image/webp"],
    video: ["video/mp4"],
    pdf: ["applcation/pdf"],
};
var StoreEnum;
(function (StoreEnum) {
    StoreEnum["memory"] = "memory";
    StoreEnum["disk"] = "disk";
})(StoreEnum || (exports.StoreEnum = StoreEnum = {}));
