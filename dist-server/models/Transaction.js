"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionType = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
var TransactionType;
(function (TransactionType) {
    TransactionType["DIAMOND_PURCHASE"] = "diamond_purchase";
    TransactionType["GIFT_SENT"] = "gift_sent";
    TransactionType["GIFT_RECEIVED"] = "gift_received";
    TransactionType["WITHDRAWAL"] = "withdrawal";
    TransactionType["REFERRAL_BONUS"] = "referral_bonus";
    TransactionType["OTHER"] = "other";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
const transactionSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: Object.values(TransactionType),
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    referenceId: {
        type: String
    },
    metadata: {
        type: mongoose_1.default.Schema.Types.Mixed
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// Index for faster queries on user and type
transactionSchema.index({ user: 1, type: 1 });
exports.default = mongoose_1.default.model('Transaction', transactionSchema);
