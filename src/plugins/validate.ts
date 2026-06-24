import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/userModel";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

async function authPlugin(app: FastifyInstance) {
  
  app.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const token = request.cookies.jwt || request.headers.authorization?.split(" ")[1];

        if (!token) {
          throw new Error("No token provided");
        }

        const decoded = jwt.verify(token, JWT_SECRET) as unknown as { userId: string; role: string };

        const user = await UserModel.findById(decoded.userId);

        if (!user) {
          throw new Error("User not found");
        }
        request.user = {...decoded, role: user.role }; // attach user to request
        
      } catch (err) {
        console.log("error in authorization plugin", err)
        reply.status(401).send({
          success: false,
          message: "Unauthorized",
        });
      }
    }
  );
}

export default fp(authPlugin);