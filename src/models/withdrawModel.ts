import mongoose, { Document, Schema } from "mongoose";

export type WithdrawStatus =
    | "pending"
    | "approved"
    | "rejected"
    | "processing"
    | "completed";

export interface IWithdraw extends Document {
    userId: mongoose.Types.ObjectId;
    walletId: mongoose.Types.ObjectId;

    amount: number;

    status: WithdrawStatus;

    method: "upi" | "bank" | "crypto";

    accountDetails: {
        upiId?: string;
        bankAccountNumber?: string;
        ifscCode?: string;
        accountHolderName?: string;
    };

    transactionId?: string; // external payment reference

    remark?: string; // admin note

    processedBy?: mongoose.Types.ObjectId; // admin id

    createdAt: Date;
    updatedAt: Date;
}


// Schema
const WithdrawSchema = new Schema<IWithdraw>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        walletId: {
            type: Schema.Types.ObjectId,
            ref: "Wallet",
            required: true,
        },

        amount: {
            type: Number,
            required: true,
            min: 1,
        },

        status: {
            type: String,
            enum: ["pending", "approved", "rejected", "processing", "completed"],
            default: "pending",
            index: true,
        },

        method: {
            type: String,
            enum: ["upi", "bank", "crypto"],
            required: true,
        },

        accountDetails: {
            upiId: { type: String },
            bankAccountNumber: { type: String },
            ifscCode: { type: String },
            accountHolderName: { type: String },
        },

        transactionId: {
            type: String,
        },

        remark: {
            type: String,
        },

        processedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);


// Index for faster queries
WithdrawSchema.index({ userId: 1, status: 1 });


// Model
export const WithdrawModel =
    mongoose.models.Withdraw ||
    mongoose.model<IWithdraw>("Withdraw", WithdrawSchema);