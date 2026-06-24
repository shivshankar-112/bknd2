import "fastify";

declare module "fastify" {
    interface FastifyRequest {
        user?: {
            userId: string;
            role: string;
        };
    }

    interface FastifyInstance {
        authenticate: (
            request: FastifyRequest,
            reply: FastifyReply
        ) => Promise<void>;
    }
}