import { FastifyRequest, FastifyReply } from "fastify";
import mongoose from "mongoose";

import { ColorPredictionRoundModel, ColorPredictionBetModel, IColorPredictionRound } from "../../models/games/colorPrediction";
import { WalletModel } from "../../models/walletModel";

import { ApiError, errorResponse, successResponse } from "../../utils/apiUtils";


export const placeBet = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const user = request.user as any;
    const { amount, choice: { color, number, size } } = request.body as any;

    if (!amount || amount <= 0) {
        throw new ApiError("Invalid amount", 400);
    }

    if (color && !["red", "green", "violet"].includes(color)) {
        throw new ApiError("Invalid color", 400);
    }
    if (number && ![1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(number)) {
        throw new ApiError("Invalid number", 400);
    }
    if (size && !["small", "big"].includes(size)) {
        throw new ApiError("Invalid size", 400);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Get active round
        const round = await ColorPredictionRoundModel.findOne({
            status: "betting",
        }).session(session);

        if (!round) {
            throw new ApiError("No active round", 400);
        }

        // Deduct + lock money
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

        if (!wallet) {
            throw new ApiError("Insufficient balance", 400);
        }

        // Save bet
        const bet = await ColorPredictionBetModel.create(
            [
                {
                    userId: user.userId,
                    roundId: round._id,
                    amount,
                    color,
                    number,
                    size,
                    status: "pending",
                },
            ],
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        return reply.send(successResponse("Bet placed", bet[0]));
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
};
// export const cancelBet = async (request:FastifyRequest, reply:FastifyReply)=>{
//     const user = request.user as any;
//     const {betId} = request.params as any;

//  }

export const getCurrentRound = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const round = await ColorPredictionRoundModel.findOne({
        status: "betting",
    }).sort({ createdAt: -1 });

    return reply.send(successResponse("Current round", round));
};
export const getResult = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const { id } = request.params as any;

    const round = await ColorPredictionRoundModel.findById(id).lean();
    // const bet = await ColorPredictionBetModel.findOne({userId})
    if (!round || round.status == "result") {
        return reply.send(successResponse("result declared", { round }));
    }

    throw new ApiError("Result not declared yet !", 400)
}

export const getMyResult = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const { userId } = request.user as any;
    const { id } = request.params as any;

    const round = await ColorPredictionRoundModel.findById(id).lean();
    const bet = await ColorPredictionBetModel.findOne({ userId, roundId: id }).lean();

    if (!round || round.status == "result") {
        return reply.send(successResponse("result declared", { round, bet }));
    }

    throw new ApiError("Result not declared yet !", 400)
}

export const getHistory = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const rounds = await ColorPredictionRoundModel.find({
        status: "result",
    })
        .sort({ createdAt: -1 })
        .limit(20);

    return reply.send(successResponse("History", rounds));
};



export const startRound = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const admin = request.user as any;

    if (admin.role !== "admin") {
        throw new ApiError("Forbidden", 403);
    }

    const round = await ColorPredictionRoundModel.create({
        status: "betting",
    });

    return reply.send(successResponse("Round started", round));
};
export const declareResult = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const admin = request.user as any;
    const { roundId, color, size, number } = request.body as any;

    if (admin.role !== "admin") {
        throw new ApiError("Forbidden", 403);
    }

    try {
        // const round = await declareResultFun(true, { color, size, number });

        // return reply.send(successResponse("Result declared", round));
    } catch (err) {
        console.error("Error declaring result:", err);
        throw new ApiError("Failed to declare result", 500);
    }
};


