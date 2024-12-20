import { MongoClient } from "mongodb";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { resolvers } from "./resolvers.ts";
import { schema } from "./schema.ts";
import { CommentModel, PostModel, UserModel } from "./types.ts";

const MONGO_URL = Deno.env.get("MONGO_URL");

if (!MONGO_URL) {
  throw new Error("No se ha encontrado la varaible de entorno MONGO_URL");
}

const mongoClient = new MongoClient(MONGO_URL);
await mongoClient.connect(); 

console.info("Conectado a MongoDB");

const mongoDB = mongoClient.db("practica5");

const UsersCollection = mongoDB.collection<UserModel>("users");
const PostsCollection = mongoDB.collection<PostModel>("posts");
const CommentsCollection = mongoDB.collection<CommentModel>("comments");

const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
});

const { url } = await startStandaloneServer(server, { context: async () => ({ UsersCollection, PostsCollection, CommentsCollection })});

console.info(`Server ready at ${url}`);