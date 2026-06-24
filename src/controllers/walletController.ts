import { FastifyReply, FastifyRequest } from "fastify";
import { UserModel } from "../models/userModel";
import { ApiError, errorResponse, successResponse } from "../utils/apiUtils";
import { WalletModel } from "../models/walletModel";


export const getWallet = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const userId = (request.user as any)?.userId;

    const wallet = await WalletModel.findOne({ userId });

    if (!wallet) {
        throw new ApiError("Wallet not found", 404);
    }

    return reply.send(successResponse("Wallet fetched", wallet));
};


export async function withdraw(request: FastifyRequest, reply: FastifyReply){
    const userId = (request.user as any)?.userId;
    const { amount } = request.body as any;

    const user = await UserModel.findById(userId).populate("walletId");

    if (!user) {
        return reply.status(404).send(errorResponse("User not found"));
    }
    const wallet = user.walletId as any;
    const availableBalance = wallet.balance - wallet.lockedBalance;

    if (amount > availableBalance) {
        return reply.status(400).send(errorResponse("Insufficient available balance"));
    }

    // For simplicity, we just deduct the amount from balance.
    // In a real app, you'd create a withdrawal request and process it separately.
    wallet.balance -= amount;
    await wallet.save();
}