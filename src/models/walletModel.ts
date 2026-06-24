import mongoose, { Document, Schema } from "mongoose";

// 1. Interface
export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId;

  balance: number;        // Available money
  lockedBalance: number;  // Money locked in active bets


  totalDeposited: number;
  totalWithdrawn: number;
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  currency: string;

  createdAt: Date;
  updatedAt: Date;
}


// 2. Schema
const WalletSchema = new Schema<IWallet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one wallet per user
      index: true,
    },

    balance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },


    totalDeposited: {
      type: Number,
      default: 0
    },
    totalWithdrawn: {
      type: Number,
      default: 0
    },
    totalBets: {
      type: Number,
      default: 0
    },
    totalWins: {
      type: Number,
      default: 0
    },
    totalLosses: {
      type: Number,
      default: 0
    },
    lockedBalance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },
  },
  {
    timestamps: true,
  }
);


// 3. Export
export const WalletModel =
  mongoose.models.Wallet ||
  mongoose.model<IWallet>("Wallet", WalletSchema);