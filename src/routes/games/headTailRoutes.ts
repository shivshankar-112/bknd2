import { FastifyInstance } from "fastify";
import { flipCoin, getCoinFlipHistory } from "../../controllers/games/headTailController";

export default function headTailRoutes(fastify:FastifyInstance){
    fastify.get("/my-history", {preHandler: [fastify.authenticate]}, getCoinFlipHistory);

    fastify.post("/flip", {preHandler: [fastify.authenticate]}, flipCoin);
}