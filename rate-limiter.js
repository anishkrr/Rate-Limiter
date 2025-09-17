const Redis = require("ioredis");
const redisClient = new Redis({ url: "redis://localhost:6379" });

const RATELIMIT_DURATION_IN_SECONDS = 60;
const NUMBER_OF_REQUEST_ALLOWED = 5;

module.exports = {
  rateLimiter: async (req, res, next) => {
    const userId = req.headers["user_id"];
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "user_id header missing",
      });
    }

    const key = `ratelimit:${userId}`;

    const count = await redisClient.incr(key);

    if (count === 1) {
      await redisClient.expire(key, RATELIMIT_DURATION_IN_SECONDS);
    }

    if (count > NUMBER_OF_REQUEST_ALLOWED) {
      return res.status(429).json({
        success: false,
        message: "user-ratelimited",
      });
    }

    return next();
  },
};
