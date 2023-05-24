import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import { ApolloServer } from "@apollo/server";
import fastifyApollo, {
  fastifyApolloDrainPlugin,
} from "@as-integrations/fastify";

import compress from "@fastify/compress";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";

import { MyContext, createContext } from "./context";
import config from "./config";

const { env, host, port } = config;

// The GraphQL schema
const typeDefs = `#graphql
  type Query {
    hello: String
  }
`;

// A map of functions which return data for the schema.
const resolvers = {
  Query: {
    hello: () => "world",
  },
};

const envToLogger: { [key: string]: any } = {
  development: {
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  },
  production: true,
  test: false,
};

async function main() {
  const fastify = Fastify({ logger: envToLogger[env] ?? true });

  const apollo = new ApolloServer<MyContext>({
    typeDefs,
    resolvers,
    plugins: [fastifyApolloDrainPlugin(fastify)],
  });

  await apollo.start();

  await fastify.register(rateLimit);
  await fastify.register(helmet);
  await fastify.register(cors);
  await fastify.register(compress);

  await fastify.register(fastifyApollo(apollo), {
    context: createContext,
  });

  fastify.get("/", (req: FastifyRequest, res: FastifyReply) => {
    res.send({
      hello: "world",
      graphql: "http://localhost:3000/graphql",
    });
  });

  try {
    const address = await fastify.listen({ host, port });
    console.log(`\n\nServer started on ${address}\n`);
    fastify.log.info(`Server started on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
