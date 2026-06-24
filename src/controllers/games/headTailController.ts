import mongoose from "mongoose";
import { FastifyReply, FastifyRequest } from "fastify";

import { ApiError, successResponse } from "../../utils/apiUtils";
import { CoinFlipModel } from "../../models/games/headTailModel";
import { WalletModel } from "../../models/walletModel";

export const flipCoin = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const user = request.user as any;

  const {
    choice,
    betAmount,
  }: {
    choice: "heads" | "tails";
    betAmount: number;
  } = request.body as any;

  console.log(choice, betAmount, "hula  huuu");
  if (!["heads", "tails"].includes(choice)) {
    throw new ApiError("Invalid choice", 400);
  }

  if (!betAmount || betAmount <= 0) {
    throw new ApiError("Invalid bet amount", 400);
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const wallet = await WalletModel.findOneAndUpdate(
      {
        userId: user.userId,
        balance: { $gte: betAmount },
      },
      {
        $inc: {
          balance: -betAmount,
        },
      },
      {
        returnDocument: "after",
        session,
      }
    );

    if (!wallet) {
      throw new ApiError("Insufficient balance", 400);
    }

    const result: "heads" | "tails" =
      Math.random() < 0.5 ? "heads" : "tails";

    const won = result === choice;

    const payout = won ? betAmount * 2 : 0;

    if (won) {
      await WalletModel.updateOne(
        {
          userId: user.userId,
        },
        {
          $inc: {
            balance: payout,
          },
        },
        {
          session,
        }
      );
    }

    const game = await CoinFlipModel.create(
      [
        {
          userId: user.userId,
          choice,
          result,
          betAmount,
          won,
          payout,
        },
      ],
      {
        session,
      }
    );

    await session.commitTransaction();

    return reply.send(
      successResponse("Coin flipped", game[0])
    );
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

export const getCoinFlipHistory = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const user = request.user as any;

  const history = await CoinFlipModel.find({
    userId: user.userId,
  })
    .sort({ createdAt: -1 })
    .limit(50);

  return reply.send(
    successResponse(
      "Coin flip history",
      history
    )
  );
};