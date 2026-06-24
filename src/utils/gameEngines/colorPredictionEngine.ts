import mongoose from "mongoose";
import { ColorPredictionBetModel, ColorPredictionRoundModel, IColorPredictionRound } from "../../models/games/colorPrediction";
import { WalletModel } from "../../models/walletModel";

function randomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
export const createRound = async (rountNum: number) => {
    const startTime = Date.now() + 10 * 1000;
    const endTime = startTime + 60 * 1000; // 1 minute
    const round = await ColorPredictionRoundModel.create({
        roundNumber: rountNum,
        status: "betting",
        startTime,
        endTime,
    });
    return round;
}
export const declareResultFun = async (round: IColorPredictionRound, viaAdmin: boolean, options?: any) => {
    let randNumber: number;
    let size: "small" | "big" = "small";
    let color: "red" | "green" | "violet" = "red";

    if (viaAdmin) {
        randNumber = options.number;
        size = options.size;
        color = options.color;
    } else {
        randNumber = randomNumber(1, 10);

        // 🎯 Controlled randomness (house edge)
        const rand = Math.random();

        if (rand < 0.45) color = "red";
        else if (rand < 0.9) color = "green";
        else color = "violet";

        const rand2 = Math.random();
        if (rand2 < 0.5) size = "small";
        else size = "big";
    }

    try {
        // const round = await ColorPredictionRoundModel.findOne({ status: "betting" });

        if (!round) {
            throw new Error("No active round");
        }

        if (Date.now() < round.endTime.getTime()) {
            throw new Error("Invalid attempt !")
        }

        const bets = await ColorPredictionBetModel.find(
            { roundId: round._id },
            {
                amount: 1,
                userId: 1,
                color: 1,
                size: 1,
                number: 1
            }
        ).lean();
        const betsOption: any[] = []
        const walletOption: any[] = []
        for (const bet of bets) {
            let winAmount = 0;
            if (bet.color === color) {
                if (color === "violet") winAmount += bet.amount * 4.5;
                else winAmount += bet.amount * 2;
            }

            if (bet.number === randNumber) {
                winAmount += bet.amount * 3;
            }

            if (bet.size === size) {
                winAmount += bet.amount * 1.5;
            }


            betsOption.push({
                updateOne: {
                    filter: { _id: bet._id },
                    update: {
                        $set: {
                            status: winAmount > 0 ? "won" : "lost",
                            winAmount,
                        }
                    }
                }
            })


            walletOption.push({
                updateOne: {
                    filter: { userId: bet.userId },
                    update: {
                        $inc: {
                            balance: winAmount,
                            lockedBalance: -bet.amount,
                        }
                    }
                }
            })
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            await ColorPredictionRoundModel.updateOne({ _id: round._id },
                {
                    $set: {
                        status: "result",
                        result: {
                            color,
                            number: randNumber,
                            size
                        }
                    }
                },
                { session }
            );
            await WalletModel.bulkWrite(walletOption, { session });
            await ColorPredictionBetModel.bulkWrite(betsOption, { session });


            await session.commitTransaction();

        } catch (error) {
            await session.abortTransaction();
            throw error
        } finally {
            session.endSession()
        }
        await createRound(round.roundNumber + 1); // start new round immediately

    } catch (error) {
        console.log("error in declare result fun", error)
        throw error;
    }

}
export const startColorPredictionEngine = async () => {
    while (true) {
        try {

            let round = await ColorPredictionRoundModel.findOne({ status: "betting" })

            if (!round) {
                const lastRound = await ColorPredictionRoundModel
                    .findOne()
                    .sort({ roundNumber: -1 });

                const nextRound =
                    lastRound
                        ? lastRound.roundNumber + 1
                        : 100;
                round = await createRound(nextRound);
            }

            const now = Date.now();
            const waitTime = round.endTime.getTime() - now;
            if (waitTime > 0) {
                await new Promise((resolve) => setTimeout(resolve, waitTime));
            }

            const lockRound = await ColorPredictionRoundModel.findOneAndUpdate({ _id: round._id, status: "betting" }, {
                $set: {
                    status: "processing"
                }
            })
            if (!lockRound) throw new Error("round already processed")
            await declareResultFun(lockRound, false);
        } catch (error) {
            console.error("Error in game loop:", error);
            await new Promise((resolve) => setTimeout(resolve, 5000)); // wait before retrying
        }
    }
};