import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { fileURLToPath } from "node:url";

const app = Fastify({ logger: true });
await app.register(fastifyStatic, {
  root: fileURLToPath(new URL("../dist/", import.meta.url)),
});
app.setNotFoundHandler((request, reply) => {
  if (request.url.startsWith("/api/") || /\.[a-z0-9]+$/i.test(request.url)) {
    return reply
      .code(404)
      .send({ error: "Not found. This prototype has no API." });
  }
  return reply.sendFile("index.html");
});
await app.listen({ port: Number(process.env.PORT ?? 3000), host: "0.0.0.0" });
