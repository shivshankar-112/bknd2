import { FastifyInstance } from "fastify";
import { getProfile, getWallet, toggleUserStatus, updateProfile, getAllUsers } from "../controllers/userController";

export default async function userRoutes(app: FastifyInstance) {
    app.get("/profile", { preHandler: [app.authenticate] }, getProfile);

    app.put("/profile", { preHandler: [app.authenticate] }, updateProfile);

    app.get("/wallet", { preHandler: [app.authenticate] }, getWallet);

    app.get("/admin/users", { preHandler: [app.authenticate] }, getAllUsers);

    app.patch(
        "/admin/user/:userId",
        { preHandler: [app.authenticate] },
        toggleUserStatus
    );


}