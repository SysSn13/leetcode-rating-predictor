const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const Redis = require("ioredis");
const client = new Redis(REDIS_URL);
const subscriber = new Redis(REDIS_URL);

const opts = {
    // redisOpts here will contain at least a property of connectionName which will identify the queue based on its name
    createClient: function (type, redisOpts) {
        switch (type) {
            case "client":
                return client;
            case "subscriber":
                return subscriber;
            case "bclient":
                return new Redis(REDIS_URL, redisOpts);
            default:
                throw new Error("Unexpected connection type: ", type);
        }
    },
};
module.exports = opts;
