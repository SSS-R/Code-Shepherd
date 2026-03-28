import type { Request, Response } from 'express';
import { extractClientIp } from '../utils/authSecurity';

interface RateLimitOptions {
    windowMs: number;
    max: number;
    message: string;
    keyGenerator?: (req: Request) => string;
}

interface Bucket {
    count: number;
    resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function createRateLimiter(options: RateLimitOptions) {
    return (req: Request, res: Response, next: Function) => {
        const now = Date.now();
        const key = options.keyGenerator ? options.keyGenerator(req) : extractClientIp(req);
        const bucketKey = `${req.method}:${req.path}:${key}`;
        const current = buckets.get(bucketKey);

        if (!current || current.resetAt <= now) {
            buckets.set(bucketKey, { count: 1, resetAt: now + options.windowMs });
            return next();
        }

        if (current.count >= options.max) {
            res.setHeader('Retry-After', String(Math.ceil((current.resetAt - now) / 1000)));
            return res.status(429).json({ error: options.message });
        }

        current.count += 1;
        buckets.set(bucketKey, current);
        return next();
    };
}
