import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import crypto from 'crypto';

// In-memory rate limiter per IP / token
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 60; // Máximo 60 requisições por minuto por chave externa
const MAX_BATCH_TAGS = 100; // Máximo 100 tags por requisição em lote

// Comparação segura contra ataques de temporização (Timing Attacks)
function timingSafeCompare(candidate: string, expected: string): boolean {
    if (typeof candidate !== 'string' || typeof expected !== 'string') {
        return false;
    }
    const bufA = Buffer.from(candidate, 'utf8');
    const bufB = Buffer.from(expected, 'utf8');
    if (bufA.length !== bufB.length) {
        return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
}

// Suporte a múltiplos segredos ativos para rotação sem downtime (via REVALIDATE_SECRET_NEXT dedicado ou lista separada por vírgula)
function getActiveSecrets(): string[] {
    const primary = process.env.REVALIDATE_SECRET || '';
    const nextRotation = process.env.REVALIDATE_SECRET_NEXT || '';
    return [primary, nextRotation]
        .join(',')
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
}

function isTokenAuthorized(candidateToken: string, activeSecrets: string[]): boolean {
    if (!candidateToken || activeSecrets.length === 0) {
        return false;
    }
    for (const secret of activeSecrets) {
        if (timingSafeCompare(candidateToken, secret)) {
            return true;
        }
    }
    return false;
}

function checkRateLimit(key: string, isInternal: boolean): { allowed: boolean; remaining: number } {
    // Requisições originadas do próprio servidor (loopback/backend Laravel) não sofrem limitação agressiva
    if (isInternal) {
        return { allowed: true, remaining: 9999 };
    }

    const now = Date.now();
    const entry = rateLimitMap.get(key);

    // Limpeza de entradas antigas se o mapa crescer
    if (rateLimitMap.size > 1000) {
        for (const [k, v] of rateLimitMap.entries()) {
            if (v.resetTime < now) {
                rateLimitMap.delete(k);
            }
        }
    }

    if (!entry || entry.resetTime < now) {
        rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
    }

    if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
        return { allowed: false, remaining: 0 };
    }

    entry.count++;
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - entry.count };
}

// Whitelist e validação estrita de tags
function isValidTag(tag: unknown): boolean {
    if (typeof tag !== 'string' || tag.length < 3 || tag.length > 100) {
        return false;
    }

    // Tags estáticas do sistema
    if (['sitemap-combinations', 'sitemap-companies', 'category-search'].includes(tag)) {
        return true;
    }

    // Padrões de tags dinâmicas autorizadas
    if (/^client-[a-zA-Z0-9_\-]+$/.test(tag)) return true;
    if (/^city-[0-9]+$/.test(tag)) return true;
    if (/^segment-[0-9]+$/.test(tag)) return true;
    if (/^search-[0-9]+-[0-9]+$/.test(tag)) return true;

    return false;
}

// Validação estrita de caminhos relativos para revalidatePath
function isValidPath(path: unknown): boolean {
    if (typeof path !== 'string' || path.length < 1 || path.length > 200) {
        return false;
    }
    if (!path.startsWith('/')) {
        return false;
    }
    if (path.includes('..') || path.includes('//') || path.includes('\\') || path.includes('?') || path.includes('#')) {
        return false;
    }
    return /^\/[a-zA-Z0-9_\-\/]*$/.test(path);
}

export async function POST(request: NextRequest) {
    // 1. Verificação de segurança da variável de ambiente (sem fallback hardcoded)
    const activeSecrets = getActiveSecrets();
    if (activeSecrets.length === 0) {
        console.error('[SECURITY ERROR] REVALIDATE_SECRET is not configured in environment variables.');
        return NextResponse.json(
            { message: 'Server configuration error' },
            { status: 500, headers: { 'Cache-Control': 'no-store' } }
        );
    }

    // 2. Extração de credencial (prioridade: Header HTTP x-revalidate-token / Bearer)
    let token = request.headers.get('x-revalidate-token');

    if (!token) {
        const authHeader = request.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7).trim();
        }
    }

    // Compatibilidade temporária durante transição (estritamente desativada por padrão; permitida SOMENTE se ALLOW_QUERY_REVALIDATE === 'true')
    const allowQueryParam = process.env.ALLOW_QUERY_REVALIDATE === 'true';
    const querySecret = request.nextUrl.searchParams.get('secret');

    if (!token && querySecret) {
        if (!allowQueryParam) {
            console.warn('[SECURITY NOTICE] Webhook query parameter authentication is disabled by default.');
            return NextResponse.json(
                { message: 'Query string authentication is disabled. Use HTTP header x-revalidate-token.' },
                { status: 401, headers: { 'Cache-Control': 'no-store' } }
            );
        }
        console.warn('[SECURITY WARNING] Webhook revalidation accessed via query string secret parameter. Please migrate to HTTP header x-revalidate-token.');
        token = querySecret;
    }

    // 3. Validação de autenticidade da credencial com timing-safe comparison
    if (!token || !isTokenAuthorized(token, activeSecrets)) {
        return NextResponse.json(
            { message: 'Unauthorized' },
            { status: 401, headers: { 'Cache-Control': 'no-store' } }
        );
    }

    // 4. Rate Limiting com detecção de origem legítima interna
    const clientIp = request.headers.get('cf-connecting-ip') ||
                     request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     'unknown-client';
    const isInternal = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === 'localhost' || clientIp === 'unknown-client';
    const rateLimit = checkRateLimit(clientIp, isInternal);

    if (!rateLimit.allowed) {
        return NextResponse.json(
            { message: 'Too many requests' },
            {
                status: 429,
                headers: {
                    'Retry-After': '60',
                    'Cache-Control': 'no-store'
                }
            }
        );
    }

    // 5. Processamento e validação estrita de payload
    try {
        const body = await request.json().catch(() => ({}));
        const { tag, tags, path, type } = body;

        const tagsToRevalidate: string[] = [];

        if (tag) {
            if (!isValidTag(tag)) {
                return NextResponse.json(
                    { message: `Invalid tag format: ${String(tag).slice(0, 30)}` },
                    { status: 400, headers: { 'Cache-Control': 'no-store' } }
                );
            }
            tagsToRevalidate.push(tag);
        }

        if (Array.isArray(tags)) {
            if (tags.length > MAX_BATCH_TAGS) {
                return NextResponse.json(
                    { message: `Batch exceeds maximum limit of ${MAX_BATCH_TAGS} tags` },
                    { status: 400, headers: { 'Cache-Control': 'no-store' } }
                );
            }
            for (const t of tags) {
                if (!isValidTag(t)) {
                    return NextResponse.json(
                        { message: `Invalid tag format in batch: ${String(t).slice(0, 30)}` },
                        { status: 400, headers: { 'Cache-Control': 'no-store' } }
                    );
                }
                tagsToRevalidate.push(t);
            }
        }

        let pathRevalidated = false;
        if (path) {
            if (!isValidPath(path)) {
                return NextResponse.json(
                    { message: 'Invalid path format' },
                    { status: 400, headers: { 'Cache-Control': 'no-store' } }
                );
            }
            if (type === 'page') {
                revalidatePath(path, 'page');
            } else if (type === 'layout') {
                revalidatePath(path, 'layout');
            } else {
                revalidatePath(path);
            }
            pathRevalidated = true;
        }

        if (tagsToRevalidate.length === 0 && !pathRevalidated) {
            return NextResponse.json(
                { message: 'Missing valid tag, tags array or path' },
                { status: 400, headers: { 'Cache-Control': 'no-store' } }
            );
        }

        // Executa revalidação para todas as tags validadas
        for (const t of tagsToRevalidate) {
            // @ts-ignore - Next.js typings compatibility
            revalidateTag(t);
        }

        return NextResponse.json(
            {
                revalidated: true,
                now: Date.now(),
                tags: tagsToRevalidate,
                path: pathRevalidated ? path : null
            },
            {
                status: 200,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate',
                    'X-RateLimit-Remaining': String(rateLimit.remaining)
                }
            }
        );
    } catch (err) {
        return NextResponse.json(
            { message: 'Error processing revalidation request' },
            { status: 500, headers: { 'Cache-Control': 'no-store' } }
        );
    }
}
