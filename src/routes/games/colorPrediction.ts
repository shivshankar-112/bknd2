import { type FastifyInstance } from "fastify";
import { getCurrentRound, getMyResult, getResult, placeBet } from "../../controllers/games/colorPrediction";

export default async function colorPredictionRoutes(fastify:FastifyInstance) {
    fastify.get("/current-round", getCurrentRound);
    fastify.get("/result/:id", getResult);
    fastify.get("/my-result/:id", {preHandler:[fastify.authenticate]}, getMyResult);
    
    fastify.post("/place-bet", {preHandler: [fastify.authenticate]}, placeBet);

}