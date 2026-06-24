import { FastifyReply, FastifyRequest } from "fastify";
import { AviatorBetModel, AviatorRoundModel } from "../../models/games/aviatorModel";
import { ApiError, successResponse } from "../../utils/apiUtils";
import { WalletModel } from "../../models/walletModel";
import { aviatorState } from "../../utils/gameEngines/aviatorEngine";

export const placeAviatorBet = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const user = request.user as any;

  const { amount } = request.body as any;

  const round = await AviatorRoundModel.findOne({
    status: "betting",
  }).sort({ createdAt: -1 });
  
  if (!round) {
    throw new ApiError("No active round", 400);
  }

  const wallet = await WalletModel.findOneAndUpdate(
    {
      userId: user.userId,
      balance: { $gte: amount },
    },
    {
      $inc: {
        balance: -amount,
      },
    },
    {
      returnDocument: "after",
    }
  );

  if (!wallet) {
    throw new ApiError("Insufficient balance", 400);
  }

  const bet = await AviatorBetModel.create({
    userId: user.userId,
    roundId: round._id,
    betAmount: amount,
  });

  return reply.send(
    successResponse("Bet placed", bet)
  );
};

export const cashout = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const user = request.user as any;

  const { roundId } = request.body as any;

  const currentMultiplier =
    aviatorState.currentMultiplier;

  console.log(user, roundId, "usala ---")
  const bet =
    await AviatorBetModel.findOne({
      userId: user.userId,
      roundId,
      status: "pending",
      cashedOut: false,
    });

  if (!bet) {
    throw new ApiError(
      "Bet not found",
      404
    );
  }

  const payout =
    bet.betAmount * currentMultiplier;

  bet.cashedOut = true;
  bet.cashoutMultiplier =
    currentMultiplier;
  bet.payout = payout;
  bet.status = "won";

  await bet.save();

  await WalletModel.updateOne(
    {
      userId: user.userId,
    },
    {
      $inc: {
        balance: payout,
      },
    }
  );

  return reply.send(
    successResponse("Cashed out", bet)
  );
};

