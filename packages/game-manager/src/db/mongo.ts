import { MongoClient, Collection } from "mongodb";
import type { GameState } from "@mafia/types/game";
import type { Player } from "@mafia/types/player";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/mafia";
const client = new MongoClient(MONGODB_URI);

export let gameCollection: Collection<GameState>;

export const connectToDatabase = async () => {
  try {
    console.log("\n🔌 Connecting to MongoDB...");
    await client.connect();
    console.log("✅ Connected to MongoDB\n");

    const db = client.db("mafia");
    gameCollection = db.collection<GameState>("games");

    // Create indexes
    await gameCollection.createIndex({ roomId: 1 }, { unique: true });

    console.log("✅ Database indexes created\n");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

export const disconnectFromDatabase = async () => {
  try {
    await client.close();
    console.log("\n🔌 Disconnected from MongoDB\n");
  } catch (error) {
    console.error("❌ MongoDB disconnection error:", error);
  }
};
