import mongoose, { Document, Schema } from "mongoose";

export type DepositStatus =
    | "pending"
    | "approved"
    | "rejected"
    | "processing"
    | "completed";

export interface IDeposit extends Document {
    userId: mongoose.Types.ObjectId;
    walletId: mongoose.Types.ObjectId;

    amount: number;

    status: DepositStatus;

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
const DepositSchema = new Schema<IDeposit>(
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
DepositSchema.index({ userId: 1, status: 1 });


// Model
export const DepositModel =
    mongoose.models.Deposit ||
    mongoose.model<IDeposit>("Deposit", DepositSchema);