// Redis configuration for caching (optional but recommended for 200+ users)
// Install: npm install ioredis
// Note: Redis is OPTIONAL - app works without it

type Redis = any;

let redis: Redis | null = null;

// Redis is disabled by default - uncomment to enable
// Only initialize Redis if REDIS_URL is provided AND ioredis is installed
const REDIS_ENABLED = false; // Set to true after installing ioredis

if (REDIS_ENABLED && process.env.REDIS_URL) {
  try {
    // This will only run if REDIS_ENABLED is true
    const Redis = require('ioredis');
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redis.on('error', (err: Error) => {
      console.error('Redis Client Error:', err);
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });
  } catch (error) {
    console.log('⚠️ Redis not available, caching disabled');
    redis = null;
  }
}

// Cache helper functions
export const cache = {
  // Get cached data
  async get<T>(key: string): Promise<T | null> {
    if (!redis) return null;
    
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  },

  // Set cache with TTL (Time To Live in seconds)
  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    if (!redis) return;
    
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Redis SET error:', error);
    }
  },

  // Delete cache
  async del(key: string): Promise<void> {
    if (!redis) return;
    
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Redis DEL error:', error);
    }
  },

  // Delete multiple keys by pattern
  async delPattern(pattern: string): Promise<void> {
    if (!redis) return;
    
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Redis DEL PATTERN error:', error);
    }
  },

  // Check if Redis is available
  isAvailable(): boolean {
    return redis !== null;
  },
};

export default redis;
