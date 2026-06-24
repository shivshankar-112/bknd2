import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAviatorRound extends Document {
    roundNumber: number;

    status: "betting" | "running" | "crashed";

    crashMultiplier: number;

    startedAt: Date;
    endedAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

const aviatorRoundSchema = new Schema<IAviatorRound>(
    {
        roundNumber: {
            type: Number,
            required: true,
            unique: true,
            index: true,
        },

        status: {
            type: String,
            enum: ["betting", "running", "crashed"],
            default: "betting",
            index: true,
        },

        crashMultiplier: {
            type: Number,
            required: true,
        },

        startedAt: {
            type: Date,
            required: true,
        },

        endedAt: Date,
    },
    {
        timestamps: true,
    }
);

export interface IAviatorBet extends Document {
    userId: mongoose.Types.ObjectId;

    roundId: mongoose.Types.ObjectId;

    betAmount: number;

    cashedOut: boolean;

    cashoutMultiplier?: number;

    payout: number;

    status: "pending" | "won" | "lost";

    createdAt: Date;
    updatedAt: Date;
}

const aviatorBetSchema = new Schema<IAviatorBet>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        roundId: {
            type: Schema.Types.ObjectId,
            ref: "AviatorRound",
            required: true,
            index: true,
        },

        betAmount: {
            type: Number,
            required: true,
            min: 1,
        },

        cashedOut: {
            type: Boolean,
            default: false,
        },

        cashoutMultiplier: Number,

        payout: {
            type: Number,
            default: 0,
        },

        status: {
            type: String,
            enum: ["pending", "won", "lost"],
            default: "pending",
        },
    },
    {
        timestamps: true,
    }
);
// aviatorBetSchema.index(
//   {
//     roundId: 1,
//     userId: 1,
//   },
//   {
//     unique: true,
//   }
// );

export const AviatorBetModel: Model<IAviatorBet> =
    mongoose.models.AviatorBet ||
    mongoose.model<IAviatorBet>(
        "AviatorBet",
        aviatorBetSchema
    );

export const AviatorRoundModel: Model<IAviatorRound> =
    mongoose.models.AviatorRound ||
    mongoose.model<IAviatorRound>(
        "AviatorRound",
        aviatorRoundSchema
    );