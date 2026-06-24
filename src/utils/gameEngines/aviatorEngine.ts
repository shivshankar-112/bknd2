import mongoose from "mongoose";
import { AviatorBetModel, AviatorRoundModel, IAviatorRound } from "../../models/games/aviatorModel";
import { getIO } from "../../socket";

export const aviatorState = {
  currentRoundId: null as string | null,
  currentMultiplier: 1,
  crashed: false,
};

export function generateCrashMultiplier() {
  const r = Math.random();

  if (r < 0.50) return 1 + Math.random(); // 1x - 2x
  // if (r < 0.80) return 2 + Math.random() * 3; // 2x - 5x
  // if (r < 0.95) return 5 + Math.random() * 5; 1 // 5x - 10x

  return 2 + Math.random();
  // return 10 + Math.random() * 90; // 10x - 100x
}

export async function createAviatorRound(
  roundNumber: number
) {
  const crashMultiplier =
    generateCrashMultiplier();

  const round = await AviatorRoundModel.create({
    roundNumber,
    status: "betting",
    crashMultiplier,
    startedAt: new Date(),
  });

  return round;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function startAviatorEngine() {
  const io = getIO();

  while (true) {
    try {
      const lastRound =
        await AviatorRoundModel.findOne()
          .sort({ roundNumber: -1 });

      const round = await createAviatorRound(
        lastRound
          ? lastRound.roundNumber + 1
          : 100
      );

      aviatorState.currentRoundId =
        round._id.toString();

      aviatorState.currentMultiplier = 1;
      aviatorState.crashed = false;

      io.emit("aviator:new-round", round)
      // Betting phase
      await sleep(10000);

      await AviatorRoundModel.updateOne(
        { _id: round._id },
        {
          $set: {
            status: "running",
          },
        }
      );

      await runRound(round);

      await sleep(1000)
    } catch (err) {
      console.error(err);
      await sleep(5000);
    }
  }
}

async function runRound(round: IAviatorRound) {
  const io = getIO();

  const crashAt = round.crashMultiplier;

  let multiplier = 1;

  while (multiplier < crashAt) {
    multiplier += 0.01;

    aviatorState.currentMultiplier =
      Number(multiplier.toFixed(2));

    // emit websocket event here

    io.emit("aviator:update", {
      multiplier,
    });

    await sleep(100);
  }

  aviatorState.crashed = true;

  // emit crash event
  io.emit("aviator:crash", {
    multiplier: crashAt,
  });

  await crashRound(round);
}

async function crashRound(
  round: IAviatorRound
) {
  const session =
    await mongoose.startSession();

  try {
    session.startTransaction();

    await AviatorBetModel.updateMany(
      {
        roundId: round._id,
        status: "pending",
      },
      {
        $set: {
          status: "lost",
          payout: 0,
        },
      },
      { session }
    );

    await AviatorRoundModel.updateOne(
      {
        _id: round._id,
      },
      {
        $set: {
          status: "crashed",
          endedAt: new Date(),
        },
      },
      { session }
    );

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    await session.endSession();
  }
}