import mongoose, { Document, Model, Schema } from "mongoose";

export type CoinSide = "heads" | "tails";

export interface ICoinFlip extends Document {
  userId: mongoose.Types.ObjectId;
  choice: CoinSide;
  result: CoinSide;
  betAmount: number;
  won: boolean;
  payout: number;
  createdAt: Date;
  updatedAt: Date;
}

const coinFlipSchema = new Schema<ICoinFlip>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    choice: {
      type: String,
      enum: ["heads", "tails"],
      required: true,
    },

    result: {
      type: String,
      enum: ["heads", "tails"],
      required: true,
    },

    betAmount: {
      type: Number,
      required: true,
      min: 1,
    },

    won: {
      type: Boolean,
      required: true,
    },

    payout: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const CoinFlipModel: Model<ICoinFlip> =
  mongoose.models.CoinFlip ||
  mongoose.model<ICoinFlip>("CoinFlip", coinFlipSchema);