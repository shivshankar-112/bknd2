import { type FastifyInstance } from "fastify";
import { login, registerNumber, registerUser, verifyMe, verifyOtp } from "../controllers/authController";

export default async function authRoutes(fastify: FastifyInstance) {
    fastify.post("/register-number", registerNumber);
    fastify.post("/verify-otp", verifyOtp);
    fastify.post("/register-user", registerUser);

    fastify.post("/verify-me", { preHandler: [fastify.authenticate] }, verifyMe)

    fastify.post("/login", login);

    fastify.post("/register", async (request, reply) => {
        // Implement registration logic here
        return { message: "Registration successful" };
    });

}