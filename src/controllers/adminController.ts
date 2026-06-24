import { FastifyReply, FastifyRequest } from "fastify";
import { MultipartFile } from "@fastify/multipart";
import { imagekit } from "../lib/configs/imageKit";
import { PaymentConfigModel } from "../models/paymentConfigModel";
import { successResponse } from "../utils/apiUtils";

export const getPaymentDetails = async (request:FastifyRequest, reply:FastifyReply)=>{
    const paymentDetails = await PaymentConfigModel.findOne();

    return reply.send(successResponse("fetched successfully !", paymentDetails));
}

export const uploadPaymentQR = async (
    req: FastifyRequest & { file: () => Promise<MultipartFile> },
    reply: FastifyReply
) => {
    try {
        const file = await req.file();

        if (!file) {
            return reply.status(400).send({
                success: false,
                message: "QR image is required",
            });
        }

        const upiId = (file.fields.upiId as any)?.value;
        const upiName = (file.fields.upiName as any)?.value;

        const buffer = await file.toBuffer();

        const uploaded = await imagekit.upload({
            file: buffer,
            fileName: `qr-${Date.now()}.png`,
            folder: "/payment-qr",
        });

        const paymentConfig =
            await PaymentConfigModel.findOneAndUpdate(
                {},
                {
                    $set: {
                        "upi.upiId": upiId,
                        "upi.upiName": upiName,
                        "upi.qrImage": uploaded.url,
                    },
                },
                {
                    new: true,
                    upsert: true,
                }
            );

        return reply.send({
            success: true,
            message: "QR uploaded successfully",
            data: paymentConfig,
        });
    } catch (error) {
        console.error(error);

        return reply.status(500).send({
            success: false,
            message: "Failed to upload QR",
        });
    }
};

interface UpdateBankBody {
    accountName: string;
    accountNumber: string;
    ifsc: string;
    bankName: string;
    branchName: string;
}

export const updateBankDetails = async (
    req: FastifyRequest<{
        Body: UpdateBankBody;
    }>,
    reply: FastifyReply
) => {
    try {
        const {
            accountName,
            accountNumber,
            ifsc,
            bankName,
            branchName,
        } = req.body;

        const paymentConfig =
            await PaymentConfigModel.findOneAndUpdate(
                {},
                {
                    $set: {
                        "bank.accountName": accountName,
                        "bank.accountNumber": accountNumber,
                        "bank.ifsc": ifsc.toUpperCase(),
                        "bank.bankName": bankName,
                        "bank.branchName": branchName,
                        "bank.isActive": true,
                    },
                },
                {
                    new: true,
                    upsert: true,
                }
            );

        return reply.send({
            success: true,
            message: "Bank details updated successfully",
            data: paymentConfig,
        });
    } catch (error) {
        console.error(error);

        return reply.status(500).send({
            success: false,
            message: "Failed to update bank details",
        });
    }
};