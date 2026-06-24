import { FastifyInstance, RouteHandlerMethod } from "fastify";
import { getPaymentDetails, updateBankDetails, uploadPaymentQR } from "../controllers/adminController";

export default async function adminRoutes(fastify: FastifyInstance) {
    fastify.get("/payment-details", getPaymentDetails);
    
    fastify.post("/upload-upi", { preHandler: [fastify.authenticate] }, uploadPaymentQR as RouteHandlerMethod);
    fastify.post("/update-bank-details", { preHandler: [fastify.authenticate] }, updateBankDetails as RouteHandlerMethod)
}