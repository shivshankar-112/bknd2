import { FastifyInstance } from "fastify";
import { getWallet, withdraw } from "../controllers/walletController";
import { approveWithdraw, getAllWithdraws, getMyWithdraws, rejectWithdraw, requestWithdraw } from "../controllers/withdrawController";
import { approveDeposit, getAllDeposits, getMyDeposit, rejectDeposit, requestDeposit } from "../controllers/depositController";

async function walletRoutes(fastify:FastifyInstance){
    fastify.get("/my", {preHandler:[fastify.authenticate]}, getWallet);

    fastify.post("/withdraw", {preHandler:[fastify.authenticate]}, requestWithdraw)
    fastify.get("/my-withdraws", {preHandler:[fastify.authenticate]}, getMyWithdraws)
    fastify.get("/all-withdraws", {preHandler:[fastify.authenticate]}, getAllWithdraws)
    fastify.post("/approve-withdraw/:withdrawId", {preHandler:[fastify.authenticate]}, approveWithdraw)
    fastify.post("/reject-withdraw/:withdrawId", {preHandler:[fastify.authenticate]}, rejectWithdraw)
    

    fastify.post("/deposit", {preHandler:[fastify.authenticate]}, requestDeposit)
    fastify.get("/my-deposits", {preHandler:[fastify.authenticate]}, getMyDeposit)
    fastify.get("/all-deposits", {preHandler:[fastify.authenticate]}, getAllDeposits)
    fastify.post("/deposit/approve/:depositId", {preHandler:[fastify.authenticate]}, approveDeposit)
    fastify.post("/deposit/reject/:depositId", {preHandler:[fastify.authenticate]}, rejectDeposit)

}

export default walletRoutes;