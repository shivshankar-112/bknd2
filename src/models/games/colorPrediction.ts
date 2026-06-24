
import mongoose, {
  Document,
  Model,
  Schema,
} from "mongoose";

/* ===========================
   TYPES
=========================== */

export type ColorPredictionRoundStatus =
  | "betting"
  | "processing"
  | "result";

export type ColorPredictionBetStatus =
  | "pending"
  | "won"
  | "lost";

export type GameColor =
  | "red"
  | "green"
  | "violet";

export type GameSize =
  | "small"
  | "big";

/* ===========================
   ROUND INTERFACE
=========================== */

export interface IColorPredictionRound
  extends Document {
  roundNumber: number;

  status: ColorPredictionRoundStatus;

  result?: {
    color: GameColor;
    number: number;
    size: GameSize;
  };

  startTime: Date;
  endTime: Date;

  createdAt: Date;
  updatedAt: Date;
}

/* ===========================
   ROUND SCHEMA
=========================== */

const ColorPredictionRoundSchema =
  new Schema<IColorPredictionRound>(
    {
      roundNumber: {
        type: Number,
        required: true,
        unique: true,
        index: true,
      },

      status: {
        type: String,
        enum: [
          "betting",
          "processing",
          "result",
        ],
        default: "betting",
        index: true,
      },

      result: {
        color: {
          type: String,
          enum: [
            "red",
            "green",
            "violet",
          ],
        },

        number: {
          type: Number,
          min: 1,
          max: 10,
        },

        size: {
          type: String,
          enum: [
            "small",
            "big",
          ],
        },
      },

      startTime: {
        type: Date,
        required: true,
        index: true,
      },

      endTime: {
        type: Date,
        required: true,
        index: true,
      },
    },
    {
      timestamps: true,
    }
  );

/* ===========================
   INDEXES
=========================== */

ColorPredictionRoundSchema.index({
  status: 1,
});

ColorPredictionRoundSchema.index({
  createdAt: -1,
});

ColorPredictionRoundSchema.index({
  endTime: 1,
});

/* ===========================
   MODEL
=========================== */

export const ColorPredictionRoundModel: Model<IColorPredictionRound> =
  mongoose.models.ColorPredictionRound ||
  mongoose.model<IColorPredictionRound>(
    "ColorPredictionRound",
    ColorPredictionRoundSchema
  );


export interface IColorPredictionBet
  extends Document {
  userId: mongoose.Types.ObjectId;

  roundId: mongoose.Types.ObjectId;

  amount: number;

  color?: "red" | "green" | "violet";

  size?: "small" | "big";

  number?: number;

  status: ColorPredictionBetStatus;

  winAmount: number;

  createdAt: Date;
  updatedAt: Date;
}

const ColorPredictionBetSchema =
  new Schema<IColorPredictionBet>(
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      roundId: {
        type: Schema.Types.ObjectId,
        ref: "ColorPredictionRound",
        required: true,
        index: true,
      },

      amount: {
        type: Number,
        required: true,
        min: 1,
      },

      color: {
        type: String,
        enum: [
          "red",
          "green",
          "violet",
        ],
      },

      size: {
        type: String,
        enum: [
          "small",
          "big",
        ],
      },

      number: {
        type: Number,
        min: 1,
        max: 10,
      },

      status: {
        type: String,
        enum: [
          "pending",
          "won",
          "lost",
        ],
        default: "pending",
        index: true,
      },

      winAmount: {
        type: Number,
        default: 0,
      },
    },
    {
      timestamps: true,
    }
  );

/* ===========================
   INDEXES
=========================== */

// one bet per user per round
ColorPredictionBetSchema.index(
  {
    roundId: 1,
    userId: 1,
  },
  {
    unique: true,
  }
);

ColorPredictionBetSchema.index({
  userId: 1,
  createdAt: -1,
});

ColorPredictionBetSchema.index({
  roundId: 1,
  status: 1,
});

/* ===========================
   MODEL
=========================== */

export const ColorPredictionBetModel: Model<IColorPredictionBet> =
  mongoose.models.ColorPredictionBet ||
  mongoose.model<IColorPredictionBet>(
    "ColorPredictionBet",
    ColorPredictionBetSchema
  );

