import Redis from 'ioredis';

// Redis connection to aaPanel Docker instance
const getRedisClient = () => {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
        console.warn('REDIS_URL not set, using in-memory fallback');
        return null;
    }

    try {
        const client = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        });

        client.on('error', (err) => {
            console.error('Redis connection error:', err.message);
        });

        return client;
    } catch (error) {
        console.error('Failed to create Redis client:', error);
        return null;
    }
};

const redis = getRedisClient();

// In-memory fallback for when Redis is not available
const memoryStore = new Map<string, { data: string; expiresAt: number }>();

export const sessionStore = {
    async set(key: string, value: unknown, ttlSeconds: number = 3600): Promise<void> {
        const stringValue = JSON.stringify(value);

        if (redis) {
            await redis.setex(key, ttlSeconds, stringValue);
        } else {
            memoryStore.set(key, {
                data: stringValue,
                expiresAt: Date.now() + ttlSeconds * 1000,
            });
        }
    },

    async get<T>(key: string): Promise<T | null> {
        if (redis) {
            const value = await redis.get(key);
            return value ? JSON.parse(value) : null;
        } else {
            const item = memoryStore.get(key);
            if (!item) return null;
            if (Date.now() > item.expiresAt) {
                memoryStore.delete(key);
                return null;
            }
            return JSON.parse(item.data) as T;
        }
    },

    async delete(key: string): Promise<void> {
        if (redis) {
            await redis.del(key);
        } else {
            memoryStore.delete(key);
        }
    },

    async exists(key: string): Promise<boolean> {
        if (redis) {
            return (await redis.exists(key)) === 1;
        } else {
            const item = memoryStore.get(key);
            if (!item) return false;
            if (Date.now() > item.expiresAt) {
                memoryStore.delete(key);
                return false;
            }
            return true;
        }
    },
};

export default redis;
