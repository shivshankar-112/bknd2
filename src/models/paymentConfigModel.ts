import { Schema, model, InferSchemaType } from "mongoose";

const paymentConfigSchema = new Schema(
    {
        upi: {
            upiId: {
                type: String,
                trim: true,
                default: "",
            },

            upiName: {
                type: String,
                trim: true,
                default: "",
            },

            qrImage: {
                type: String,
                default: "",
            },

            isActive: {
                type: Boolean,
                default: true,
            },
        },

        bank: {
            accountName: {
                type: String,
                trim: true,
                default: "",
            },

            accountNumber: {
                type: String,
                trim: true,
                default: "",
            },

            ifsc: {
                type: String,
                uppercase: true,
                trim: true,
                default: "",
            },

            bankName: {
                type: String,
                trim: true,
                default: "",
            },

            branchName: {
                type: String,
                trim: true,
                default: "",
            },

            isActive: {
                type: Boolean,
                default: false,
            },
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export type PaymentConfig = InferSchemaType<
    typeof paymentConfigSchema
>;

export const PaymentConfigModel = model<PaymentConfig>(
    "PaymentConfig",
    paymentConfigSchema
);