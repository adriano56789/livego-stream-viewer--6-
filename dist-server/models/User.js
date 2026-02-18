"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: '' },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    diamonds: { type: Number, default: 0 },
    followers: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User' }],
    blockedUsers: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User' }],
    notifications: [{
            type: { type: String, required: true },
            message: { type: String, required: true },
            read: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now }
        }],
    lastSeen: { type: Date, default: Date.now },
    isOnline: { type: Boolean, default: false },
    settings: {
        notifications: { type: Object, default: {} },
        privacy: { type: Object, default: {} },
        chat: { type: Object, default: {} }
    }
}, {
    timestamps: true
});
// Add methods to schema
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcryptjs_1.default.compare(candidatePassword, this.password);
};
userSchema.methods.generateAuthToken = function () {
    const token = jsonwebtoken_1.default.sign({ userId: this._id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1d' });
    return token;
};
exports.default = mongoose_1.default.model('User', userSchema);
