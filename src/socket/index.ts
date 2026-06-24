import { Server } from "socket.io";
import { Server as HttpServer } from "http";

let io: Server | null = null;

export const initSocket = (
    server: HttpServer
): Server => {
    io = new Server(server, {
        cors: {
            origin: true,
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log(
            "Client connected:",
            socket.id
        );

        socket.on("disconnect", () => {
            console.log(
                "Client disconnected:",
                socket.id
            );
        });
    });

    return io;
};

export const getIO = (): Server => {
    if (!io) {
        throw new Error(
            "Socket.IO not initialized"
        );
    }

    return io;
};