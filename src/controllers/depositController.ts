import mongoose from "mongoose";
import { WalletModel } from "../models/walletModel";
import { DepositModel } from "../models/depositModel";
import { ApiError } from "../utils/apiUtils";
import { FastifyReply, FastifyRequest } from "fastify";
import { successResponse } from "../utils/apiUtils";


export const requestDeposit = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const user = request.user as any;
    const { amount, method, accountDetails } = request.body as any;

    const walletData = await WalletModel.findOne({userId: user.userId});

    if(!walletData){
        throw new ApiError("Wallet not found", 404);
    }

    if (!amount || amount <= 0) {
        throw new ApiError("Invalid amount", 400);
    }

    if (!method) {
        throw new ApiError("Deposit method required", 400);
    }

    // Basic validation for account details
    if (method === "upi" && !accountDetails?.upiId) {
        throw new ApiError("UPI ID required", 400);
    }

    if (method === "bank" && !accountDetails?.bankAccountNumber) {
        throw new ApiError("Bank details required", 400);
    }

    console.log(user, "user info ------------------- ");
    // Create deposit request
    const deposit = await DepositModel.create(
        {
            userId: user.userId,
            walletId: walletData?._id,
            amount,
            method,
            accountDetails,
            status: "pending",
        }
    );

    return reply.send(
        successResponse("Deposit request created", deposit)
    );

};

export const getMyDeposit = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const user = request.user as any;

    const deposits = await DepositModel.find({
        userId: user.userId,
    }).sort({ createdAt: -1 });

    return reply.send(successResponse("Deposit history", deposits));
};

export const getAllDeposits = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const user = request.user as any;

    console.log(user, "user info ------------------- ");
    if (user.role !== "admin") {
        throw new ApiError("Forbidden", 403);
    }

    const deposits = await DepositModel.find()
        .populate("userId", "name email phone")
        .sort({ createdAt: -1 });

    return reply.send(successResponse("All deposits", deposits));
};

export const approveDeposit = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const admin = request.user as any;
    const { depositId } = request.params as any;

    if (admin.role !== "admin") {
        throw new ApiError("Forbidden", 403);
    }

    console.log("Approving deposit", depositId);

    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const deposit = await DepositModel.findOneAndUpdate(
            { _id: depositId, status: "pending" },
            { $set: { status: "approved", processedBy: admin.userId } },
            { new: true, session }
        );

        if (!deposit) {
            throw new ApiError("Deposit not found or already processed", 400);
        };

        console.log("Deposit found and updated to approved", deposit);

        const wallet = await WalletModel.findOneAndUpdate(
            { _id: deposit.walletId },
            { $inc: { balance: +deposit.amount, totalDeposited: +deposit.amount } },
            { session }
        );
        if (!wallet) {
            throw new ApiError("Wallet update failed", 500);
        }

        await session.commitTransaction();
        session.endSession();

        return reply.send(successResponse("Deposit approved", deposit));

    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        console.error("Error approving deposit:", error);
        throw new ApiError("Failed to approve deposit", 500);
    }


};

export const rejectDeposit = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const admin = request.user as any;
    const { depositId } = request.params as any;

    if (admin.role !== "admin") {
        throw new ApiError("Forbidden", 403);
    }

    const deposit = await DepositModel.findOneAndUpdate(
        { _id: depositId, status: "pending" },
        { $set: { status: "rejected", processedBy: admin.userId } },
        { new: true }
    );

    if (!deposit) {
        throw new ApiError("Deposit not found or already processed", 400);
    }

    return reply.send(successResponse("Deposit rejected & refunded", deposit));
};