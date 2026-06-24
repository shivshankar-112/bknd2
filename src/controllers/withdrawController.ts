import mongoose from "mongoose";
import { WalletModel } from "../models/walletModel";
import { WithdrawModel } from "../models/withdrawModel";
import { ApiError } from "../utils/apiUtils";
import { FastifyReply, FastifyRequest } from "fastify";
import { successResponse } from "../utils/apiUtils";


export const requestWithdraw = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const user = request.user as any;
    const { amount, method, accountDetails } = request.body as any;

    if (!amount || amount <= 0) {
        throw new ApiError("Invalid amount", 400);
    }

    if (!method) {
        throw new ApiError("Withdraw method required", 400);
    }

    // Basic validation for account details
    if (method === "upi" && !accountDetails?.upiId) {
        throw new ApiError("UPI ID required", 400);
    }

    if (method === "bank" && !accountDetails?.bankAccountNumber) {
        throw new ApiError("Bank details required", 400);
    }

    console.log("Initiating withdraw request");
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 🔐 Atomic balance deduction + lock
        const wallet = await WalletModel.findOneAndUpdate(
            {
                userId: user.userId,
                balance: { $gte: amount },
            },
            {
                $inc: {
                    balance: -amount,
                    lockedBalance: amount,
                },
            },
            { new: true, session }
        );

        console.log(wallet, "wallet after update ------------------- ");
        if (!wallet) {
            throw new ApiError("Insufficient balance", 400);
        }

        // Create withdraw request
        const withdraw = await WithdrawModel.create([
            {
                userId: user.userId,
                walletId: wallet._id,
                amount,
                method,
                accountDetails,
                status: "pending",
            }],
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        return reply.send(
            successResponse("Withdraw request created", withdraw[0])
        );
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

export const getMyWithdraws = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const user = request.user as any;

    const withdraws = await WithdrawModel.find({
        userId: user.userId,
    }).sort({ createdAt: -1 });

    return reply.send(successResponse("Withdraw history", withdraws));
};

export const getAllWithdraws = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const user = request.user as any;

    if (user.role !== "admin") {
        throw new ApiError("Forbidden", 403);
    }

    const withdraws = await WithdrawModel.find()
        .populate("userId", "name email phone avatar")
        .sort({ createdAt: -1 });

    return reply.send(successResponse("All withdraws", withdraws));
};

export const approveWithdraw = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const admin = request.user as any;
    const { withdrawId } = request.params as any;

    if (admin.role !== "admin") {
        throw new ApiError("Forbidden", 403);
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const withdraw = await WithdrawModel.findOneAndUpdate(
            { _id: withdrawId, status: "pending" },
            { $set: { status: "approved", processedBy: admin.userId } },
            { new: true, session }
        );

        if (!withdraw) {
            throw new ApiError("Withdraw not found or already processed", 400);
        };

        const wallet = await WalletModel.findOneAndUpdate(
            { _id: withdraw.walletId, lockedBalance: { $gte: withdraw.amount } },
            { $inc: { lockedBalance: -withdraw.amount, totalWithdrawn: +withdraw.amount } },
            { session }
        );
        if (!wallet) {
            throw new ApiError("Wallet update failed", 500);
        }

        await session.commitTransaction();
        session.endSession();

        return reply.send(successResponse("Withdraw approved", withdraw));

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw new ApiError("Failed to approve withdraw", 500);
    }


};

export const rejectWithdraw = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const admin = request.user as any;
    const { withdrawId } = request.params as any;

    if (admin.role !== "admin") {
        throw new ApiError("Forbidden", 403);
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {

        const withdraw = await WithdrawModel.findOneAndUpdate(
            { _id: withdrawId, status: "pending" },
            { $set: { status: "rejected", processedBy: admin.userId } },
            { new: true, session }
        );

        if (!withdraw) {
            throw new ApiError("Withdraw not found or already processed", 400);
        }

        // 💰 Refund balance safely
        const wallet = await WalletModel.updateOne(
            { userId: withdraw.userId, lockedBalance: { $gte: withdraw.amount } },
            {
                $inc: { balance: withdraw.amount, lockedBalance: -withdraw.amount },
            },
            { session }
        );


        if (wallet.modifiedCount === 0) {
            throw new ApiError("Wallet refund failed", 500);
        }

        await session.commitTransaction();
        session.endSession();

        return reply.send(successResponse("Withdraw rejected & refunded", withdraw));

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw new ApiError("Failed to reject withdraw", 500);
    }

};