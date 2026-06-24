import { type FastifyReply, type FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/userModel";
import { WalletModel } from "../models/walletModel";
import { ApiError, ApiResponse, errorResponse, successResponse } from "../utils/apiUtils";
import { OtpModel } from "../models/otpModel";
import { generateOtp } from "../utils/otpUtils";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export const registerNumber = async (request: FastifyRequest, reply: FastifyReply) => {
    const { phone } = request.body as any;
    if (!phone) {
        return reply.status(400).send(errorResponse("Mobile no. is required !"))
    }
    const user = await UserModel.findOne({ phone });
    if (user) {
        return reply.status(400).send(successResponse("User exists !", user))
    }

    const isOtpExist = await OtpModel.deleteMany({ phone });

    const newOtp = new OtpModel({
        phone,
        otp: generateOtp()
    })

    await newOtp.save();

    return reply.send(successResponse("Otp sent !", newOtp));
}
export const verifyOtp = async (request: FastifyRequest, reply: FastifyReply) => {
    const { phone, otp } = request.body as any;
    if (!phone || !otp) {
        return reply.status(400).send(errorResponse("Mobile no. and OTP are required !"))
    }
    const otpDoc = await OtpModel.findOne({ phone });
    if (!otpDoc) {
        return reply.status(400).send(errorResponse("Otp expired !"))
    }
    if (otpDoc.otp !== otp) {
        return reply.status(400).send(errorResponse("Incorrect Otp !"))
    }

    otpDoc.isUsed = true;
    otpDoc.isVerified = true;
    await otpDoc.save()
    return reply.send(successResponse("Otp verified !", otpDoc));
}

export const registerUser = async (request: FastifyRequest, reply: FastifyReply) => {
    const { phone, name, password } = request.body as any;


    console.log("pass is --- ", password);
    const otpDoc = await OtpModel.findOne({ phone });
    if (!otpDoc || !otpDoc.isVerified) {
        return reply.status(400).send(errorResponse("Invalid attempt !"))
    }

    // 1. Check existing user
    const existingUser = await UserModel.findOne({ phone });
    if (existingUser) {
        return reply.status(400).send({
            message: "User already exists",
        });
    }

    // 2. Create user
    const user = await UserModel.create({
        name,
        phone,
        avatar: ["🎲", "🎰", "🃏", "♠️", "🏆"][Math.floor(Math.random() * 5)],
        password,
    });

    // 3. Create wallet
    const wallet = await WalletModel.create({
        userId: user._id,
        balance: 0,
    });

    // 4. Link wallet to user
    user.walletId = wallet._id;
    await user.save();

    // 5. Generate token
    const token = jwt.sign(
        { userId: user._id, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
    );

    reply.setCookie("jwt", token, {
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24
    });

    return reply.send(successResponse("User registered successfully", { token, user, wallet }));

}

// ================= LOGIN =================
export const login = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const { phone, password } = request.body as any;

    // 1. Find user (include password)
    const user = await UserModel.findOne({ phone }).select("+password");
    console.log(phone, user);

    if (!user) {
        return reply.status(400).send({
            message: "Invalid credentials",
        });
    }

    // 2. Check if active
    if (!user.isActive) {
        return reply.status(403).send({
            message: "Account is disabled",
        });
    }

    // 3. Compare password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
        return reply.status(400).send({
            message: "Incorrect password",
        });
    }

    // 4. Generate token
    const token = jwt.sign(
        { userId: user._id, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
    );

    reply.setCookie("jwt", token, {
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24
    });

    return reply.send(successResponse("Login successful", { token, user }));

};



export const verifyMe = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const userId = (request.user as any)?.userId;
    if(!userId){
        throw new ApiError("Not verified", 400)
    }

    reply.send(successResponse("user verified", null))

}





// ================= REGISTER =================
export const register = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const { phone, name, email, password } = request.body as any;

    // 1. Check existing user
    const existingUser = await UserModel.findOne({ $or: [phone, email] });
    if (existingUser) {
        return reply.status(400).send({
            message: "User already exists",
        });
    }

    // 2. Create user
    const user = await UserModel.create({
        name,
        email,
        password,
    });

    // 3. Create wallet
    const wallet = await WalletModel.create({
        userId: user._id,
        balance: 0,
    });

    // 4. Link wallet to user
    user.walletId = wallet._id;
    await user.save();

    // 5. Generate token
    const token = jwt.sign(
        { userId: user._id, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
    );

    return reply.send({
        message: "User registered successfully",
        token,
    });

};

