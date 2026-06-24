import { FastifyReply, FastifyRequest } from "fastify";
import { UserModel } from "../models/userModel";
import { ApiError, successResponse } from "../utils/apiUtils";
import { WalletModel } from "../models/walletModel";

export const getProfile = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const userId = (request.user as any)?.userId;

    if (!userId) {
        throw new ApiError("Unauthorized", 401);
    }

    const user = await UserModel.findById(userId).select("-password");
    console.log(userId , "adnabo", user)

    if (!user) {
        throw new ApiError("User not found", 404);
    }

    return reply.send(successResponse("Profile fetched", user));
};

export const updateProfile = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const userId = (request.user as any)?.userId;
    const { name, phone } = request.body as any;

    if (!userId) {
        throw new ApiError("Unauthorized", 401);
    }

    const user = await UserModel.findByIdAndUpdate(
        userId,
        {
            $set: {
                name,
                phone,
            },
        },
        { new: true, runValidators: true }
    ).select("-password");

    return reply.send(successResponse("Profile updated", user));
};

export const getWallet = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const userId = (request.user as any)?.userId;

    const wallet = await WalletModel.findOne({ userId });

    if (!wallet) {
        throw new ApiError("Wallet not found", 404);
    }

    return reply.send(successResponse("Wallet fetched", wallet));
};

export const getAllUsers = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const role = (request.user as any)?.role;

    if (role !== "admin") {
        throw new ApiError("Forbidden", 403);
    }

    const users = await UserModel.find().select("-password");

    return reply.send(successResponse("Users fetched", users));
};

export const toggleUserStatus = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const adminRole = (request.user as any)?.role;
    const { userId } = request.params as any;

    if (adminRole !== "admin") {
        throw new ApiError("Forbidden", 403);
    }

    const user = await UserModel.findById(userId);

    if (!user) {
        throw new ApiError("User not found", 404);
    }

    user.isActive = !user.isActive;
    await user.save();

    return reply.send(
        successResponse(
            `User ${user.isActive ? "activated" : "blocked"}`,
            user
        )
    );
};