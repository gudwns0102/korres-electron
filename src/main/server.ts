import Fastify from "fastify";

const fastify = Fastify({});

fastify.get("/", async (request, reply) => {
  const { code } = request.query as any;
  reply.send(code);
});

fastify.listen({ port: 8888 });
