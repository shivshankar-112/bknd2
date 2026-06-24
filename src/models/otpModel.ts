import mongoose, { Schema, Document, Model } from "mongoose";

export type OtpPurpose = "registration" | "forgot-password";

export interface IOtp extends Document {
  phone: string;
  otp: string;
  purpose: OtpPurpose;
  expiresIn: number;
  isUsed: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;

  isExpired(): boolean;
}

const otpSchema = new Schema<IOtp>(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
    },

    otp: {
      type: String,
      required: true,
    },

    purpose: {
      type: String,
      enum: ["registration", "forgot-password"],
      default: "registration",
    },

    expiresIn: {
      type: Number,
      required: true,
      default: 5 * 60 * 1000, // 5 minutes in ms
    },

    isUsed: {
      type: Boolean,
      default: false,
    },
    isVerified:{
        type:Boolean,
        default:false
    }
  },
  {
    timestamps: true,
  }
);

/**
 * Check if OTP is expired
 */
otpSchema.methods.isExpired = function (): boolean {
  const now = Date.now();
  const createdAt = new Date(this.createdAt).getTime();

  return now > createdAt + this.expiresIn;
};

/**
 * Automatically delete expired OTPs
 * MongoDB TTL index
 */
otpSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 300, // 5 minutes
  }
);

export const OtpModel: Model<IOtp> =
  mongoose.models.Otp || mongoose.model<IOtp>("Otp", otpSchema);