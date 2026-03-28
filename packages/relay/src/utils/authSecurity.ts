import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import type { Request, Response } from 'express';

export type UserRole = 'Admin' | 'Developer' | 'Viewer';

export interface AccessTokenPayload {
    sub: string;
    teamId: string | null;
    role: UserRole;
    type: 'access';
    iat: number;
    exp: number;
    jti: string;
}

export interface RefreshTokenRecord {
    token: string;
    hash: string;
    expiresAt: string;
    id: string;
}

interface CookieOptions {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Lax' | 'Strict' | 'None';
    path?: string;
    maxAge?: number;
    expires?: Date;
}

const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const ACCESS_COOKIE_NAME = 'code_shepherd_at';
export const REFRESH_COOKIE_NAME = 'code_shepherd_rt';

function base64UrlEncode(input: string | Buffer): string {
    return Buffer.from(input)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
}

function base64UrlDecode(input: string): Buffer {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
    return Buffer.from(normalized + padding, 'base64');
}

export function getAuthSecret(): string {
    return process.env.AUTH_SECRET || 'dev-only-change-me-before-production';
}

export function hashOpaqueToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

export function createPasswordHash(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const derived = scryptSync(password, salt, 64).toString('hex');
    return `scrypt$${salt}$${derived}`;
}

function verifyScryptPassword(password: string, storedHash: string): boolean {
    const parts = storedHash.split('$');
    if (parts.length !== 3) {
        return false;
    }

    const [, salt, expectedHash] = parts;
    const derived = scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHash, 'hex');
    return expected.length === derived.length && timingSafeEqual(expected, derived);
}

function verifyLegacySha256Password(password: string, storedHash: string): boolean {
    const digest = createHash('sha256').update(password).digest('hex');
    const expected = Buffer.from(storedHash, 'hex');
    const provided = Buffer.from(digest, 'hex');
    return expected.length === provided.length && timingSafeEqual(expected, provided);
}

export function verifyPassword(password: string, storedHash: string): { valid: boolean; needsUpgrade: boolean } {
    if (storedHash.startsWith('scrypt$')) {
        return { valid: verifyScryptPassword(password, storedHash), needsUpgrade: false };
    }

    const valid = /^[a-f0-9]{64}$/i.test(storedHash) && verifyLegacySha256Password(password, storedHash);
    return { valid, needsUpgrade: valid };
}

export function createAccessToken(input: { userId: string; teamId: string | null; role: UserRole; jti?: string }): string {
    const now = Date.now();
    const payload: AccessTokenPayload = {
        sub: input.userId,
        teamId: input.teamId,
        role: input.role,
        type: 'access',
        iat: Math.floor(now / 1000),
        exp: Math.floor((now + ACCESS_TOKEN_TTL_MS) / 1000),
        jti: input.jti || randomBytes(12).toString('hex'),
    };

    const header = { alg: 'HS256', typ: 'JWT' };
    const unsigned = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;
    const signature = createHmac('sha256', getAuthSecret()).update(unsigned).digest();
    return `${unsigned}.${base64UrlEncode(signature)}`;
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
    const [headerPart, payloadPart, signaturePart] = token.split('.');
    if (!headerPart || !payloadPart || !signaturePart) {
        return null;
    }

    const unsigned = `${headerPart}.${payloadPart}`;
    const expectedSignature = createHmac('sha256', getAuthSecret()).update(unsigned).digest();
    const providedSignature = base64UrlDecode(signaturePart);

    if (expectedSignature.length !== providedSignature.length || !timingSafeEqual(expectedSignature, providedSignature)) {
        return null;
    }

    try {
        const payload = JSON.parse(base64UrlDecode(payloadPart).toString('utf8')) as AccessTokenPayload;
        const now = Math.floor(Date.now() / 1000);
        if (payload.type !== 'access' || payload.exp <= now) {
            return null;
        }
        return payload;
    } catch {
        return null;
    }
}

export function createRefreshTokenRecord(): RefreshTokenRecord {
    const token = randomBytes(48).toString('hex');
    return {
        id: randomBytes(12).toString('hex'),
        token,
        hash: hashOpaqueToken(token),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS).toISOString(),
    };
}

export function parseCookies(cookieHeader?: string): Record<string, string> {
    if (!cookieHeader) {
        return {};
    }

    return cookieHeader.split(';').reduce<Record<string, string>>((cookies, chunk) => {
        const [rawKey, ...valueParts] = chunk.trim().split('=');
        if (!rawKey) {
            return cookies;
        }

        cookies[rawKey] = decodeURIComponent(valueParts.join('='));
        return cookies;
    }, {});
}

function serializeCookie(name: string, value: string, options: CookieOptions): string {
    const parts = [`${name}=${encodeURIComponent(value)}`];

    if (options.maxAge !== undefined) {
        parts.push(`Max-Age=${Math.floor(options.maxAge / 1000)}`);
    }

    if (options.expires) {
        parts.push(`Expires=${options.expires.toUTCString()}`);
    }

    parts.push(`Path=${options.path || '/'}`);

    if (options.httpOnly) {
        parts.push('HttpOnly');
    }

    if (options.secure) {
        parts.push('Secure');
    }

    if (options.sameSite) {
        parts.push(`SameSite=${options.sameSite}`);
    }

    return parts.join('; ');
}

function appendCookie(res: Response, cookie: string): void {
    const existing = res.getHeader('Set-Cookie');

    if (!existing) {
        res.setHeader('Set-Cookie', [cookie]);
        return;
    }

    const cookies = Array.isArray(existing) ? existing.map(String) : [String(existing)];
    res.setHeader('Set-Cookie', [...cookies, cookie]);
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string, secure: boolean): void {
    appendCookie(res, serializeCookie(ACCESS_COOKIE_NAME, accessToken, {
        httpOnly: true,
        secure,
        sameSite: 'Lax',
        path: '/',
        maxAge: ACCESS_TOKEN_TTL_MS,
    }));

    appendCookie(res, serializeCookie(REFRESH_COOKIE_NAME, refreshToken, {
        httpOnly: true,
        secure,
        sameSite: 'Lax',
        path: '/',
        maxAge: REFRESH_TOKEN_TTL_MS,
    }));
}

export function clearAuthCookies(res: Response, secure: boolean): void {
    const expired = new Date(0);

    appendCookie(res, serializeCookie(ACCESS_COOKIE_NAME, '', {
        httpOnly: true,
        secure,
        sameSite: 'Lax',
        path: '/',
        expires: expired,
    }));

    appendCookie(res, serializeCookie(REFRESH_COOKIE_NAME, '', {
        httpOnly: true,
        secure,
        sameSite: 'Lax',
        path: '/',
        expires: expired,
    }));
}

export function extractBearerToken(req: Request): string | null {
    const authHeader = req.header('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }

    return authHeader.slice('Bearer '.length).trim();
}

export function extractClientIp(req: Request): string {
    const forwarded = req.header('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    }

    return req.socket.remoteAddress || 'unknown';
}

export function isSecureRequest(req: Request): boolean {
    return process.env.NODE_ENV === 'production' || req.secure || req.header('x-forwarded-proto') === 'https';
}
