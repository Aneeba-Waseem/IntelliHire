// redisClient.js
import { createClient } from "redis";

export const redisClient = createClient({ url: "redis://default:GjNDbETRCMcajwkcYkkAMsvdCiJFPFWu@tramway.proxy.rlwy.net:40887" });

redisClient.on("error", (err) => console.log("Redis Client Error", err));

(async () => {
  await redisClient.connect();
  console.log("✅ Redis connected");
})();

