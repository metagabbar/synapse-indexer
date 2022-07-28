import dotenv  from "dotenv"
dotenv.config()

import mongoose from "mongoose";
await mongoose.connect(process.env.MONGO_URI).catch((err) => console.error(err));
console.log('Connected to MongoDB!')

import {RedisConnection} from "./db/redis.js";
let redisClient = await RedisConnection.getClient();

import {indexForward} from "./indexer/indexForward.js";
import {indexBackward} from "./indexer/indexBackward.js";
import {indexOlderTransactions} from "./indexer/indexOlderTransactions.js"
import {ChainConfig} from "./config/chainConfig.js";

let indexingInterval = 5000; // ideally 15 seconds

// Schedule indexing for all chains inside ChainConfig
for (let key of Object.keys(ChainConfig)) {
    // Reset indexing status
    await redisClient.set(`${ChainConfig[key].name}_IS_INDEXING_FORWARD`, "false")
    await redisClient.set(`${ChainConfig[key].name}_IS_INDEXING_BACKWARD`, "false")

    setInterval(indexForward, indexingInterval, ChainConfig[key])
    setInterval(indexBackward, indexingInterval, ChainConfig[key])

    // Index older transactions
    if (ChainConfig[key].oldestBlock) {
        indexOlderTransactions(ChainConfig[key]).then(() => console.log(`Finished backindexing ${ChainConfig[key].name}`))
    }
}
