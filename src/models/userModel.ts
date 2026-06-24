import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt"
// 1. Interface (Type Safety)
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;

  avatar:string,
  role: "user" | "admin";
  isActive: boolean;
  isVerified: boolean;

  walletId?: mongoose.Types.ObjectId;

  comparePassword(candidatePassword: string): Promise<boolean>;

  createdAt: Date;
  updatedAt: Date;
}

// 2. Schema
const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      trim: true,
      minlength: 2,
    },

    email: {
      type: String,
      lowercase: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // ⚠️ hides password by default
    },

    avatar:{
      type:String
    },
    phone: {
      type: String,
      unique: true,
      required:true
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    walletId: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
    },
  },
  {
    timestamps: true,
  }
);


// 3. Password Hashing Middleware
UserSchema.pre<IUser>("save", async function (this: IUser) {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});


// 4. Compare Password Method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};


// 5. Export Model
export const UserModel =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);