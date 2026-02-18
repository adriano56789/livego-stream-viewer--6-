"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const giftSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    image: { type: String, required: true },
    value: { type: Number, required: true, min: 1 },
    animation: { type: String },
    category: { type: String, default: 'default' },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});
exports.default = mongoose_1.default.model('Gift', giftSchema);
