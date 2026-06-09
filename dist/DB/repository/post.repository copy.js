"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const post_model_1 = __importDefault(require("../models/post.model"));
const base_repository_1 = __importDefault(require("./base.repository"));
class PostRepository extends base_repository_1.default {
    model;
    constructor(model = post_model_1.default) {
        super(model);
        this.model = model;
    }
}
exports.default = PostRepository;
