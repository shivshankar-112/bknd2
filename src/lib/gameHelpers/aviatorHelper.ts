import { AviatorBetModel } from "../../models/games/aviatorModel";
import { randomInt } from "crypto"

export function generateCrashMultiplier(amount: number, chance?: number): number {
    const r = randomInt(0, 1000000) / 1000000;

    console.log(r, '--- r');
    let lowChance = 0.50;

    if (amount > 50000) lowChance = 0.60;
    if (amount > 100000) lowChance = 0.70;

    if (r < lowChance) {
        return Number(1 + Math.random().toFixed(2));
    }

    return Number((2 + Math.random() * 8).toFixed(2));
}

console.log(generateCrashMultiplier(1000));

export async function calculateResult({ userId, amount }: { userId: string, amount: number }, docScan?: number): Promise<{ multiplier: number }> {
    if (userId || amount) throw new Error("UserId or amount is not provided !");

    const oldBets = await AviatorBetModel.find({ userId }).sort({ createdAt: -1 }).limit(docScan || 5).lean();

    const crashMultiplier = generateCrashMultiplier(amount, 0.89);

    return {
        multiplier: crashMultiplier,
    }
}