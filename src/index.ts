import fastify from "fastify";
import authRoutes from "./routes/authRoutes";
import { ApiError } from "./utils/apiUtils";
import fastifyCors from "@fastify/cors";
import { OtpModel } from "./models/otpModel";
import { connectDb } from "./utils/dbConnect";
import userRoutes from "./routes/userRoutes";
import authPlugin from "./plugins/validate"
import cookie from "@fastify/cookie";
import walletRoutes from "./routes/walletRoutes";
import colorPredictionRoutes from "./routes/games/colorPrediction";
import headTailRoutes from "./routes/games/headTailRoutes";
import { startAviatorEngine } from "./utils/gameEngines/aviatorEngine";
import { initSocket } from "./socket";
import aviatorRoutes from "./routes/games/aviatorRoutes";
import { startColorPredictionEngine } from "./utils/gameEngines/colorPredictionEngine";
import adminRoutes from "./routes/adminRoutes";

import multipart from "@fastify/multipart";


const PORT = parseInt(process.env.PORT || '3000', 10);
const app = fastify({ logger: true });


app.register(cookie);
app.register(fastifyCors, {
    origin: true,
    credentials: true
});
app.get("/", async (request, reply) => {
    try {

        await OtpModel.deleteMany({});
    } catch (error) {
        console.log(error)
    }
    return { hello: "world" };
});

app.register(multipart);

app.register(authPlugin)
app.register(authRoutes, { prefix: "/auth" });
app.register(userRoutes, { prefix: "/user" });
app.register(adminRoutes, {prefix: "/admin"})
app.register(walletRoutes, { prefix: "/wallet" });
app.register(headTailRoutes, { prefix: "/coin" });
app.register(colorPredictionRoutes, { prefix: "/color-game" })
app.register(aviatorRoutes, { prefix: "/aviator" })


app.setErrorHandler((error: any, request, reply) => {
    let statusCode = 500;
    let message = "Internal Server Error";

    console.error("error from error handler:", error);
    // Custom error
    if (error instanceof ApiError) {
        statusCode = error.statusCode;
        message = error.message;
    }

    // Mongoose errors
    if (error.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(error.errors)
            .map((val: any) => val.message)
            .join(", ");
    }

    if (error.code === 11000) {
        statusCode = 400;
        message = "Duplicate field value entered";
    }

    // JWT errors
    if (error.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid token";
    }

    reply.status(statusCode).send({
        success: false,
        message,
    });
});

const start = async () => {
    try {
        await connectDb();

        await app.listen({ port: PORT });

        // Fastify's underlying HTTP server
        initSocket(app.server);

        app.log.info(
            `Server running on port ${PORT}`
        );

        
        startColorPredictionEngine();
        startAviatorEngine();

    } catch (error) {
        app.log.error(error);
        process.exit(1);
    }
};

start();
