import { FastifyInstance } from "fastify";
import { cashout, placeAviatorBet } from "../../controllers/games/aviatorController";

export default async function aviatorRoutes(fastify:FastifyInstance) {
    fastify.post("/place-bet", {preHandler:[fastify.authenticate]},placeAviatorBet );

    fastify.post("/cashout",{preHandler:[fastify.authenticate]}, cashout);
}1