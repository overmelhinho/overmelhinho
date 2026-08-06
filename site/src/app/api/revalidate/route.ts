import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
    const secret = request.nextUrl.searchParams.get('secret');
    const mySecret = process.env.REVALIDATE_SECRET || 'overmelhinho_revalidate_2026';

    if (secret !== mySecret) {
        return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { tag, path, type } = body;

        let revalidated = false;

        if (tag) {
            revalidateTag(tag);
            revalidated = true;
        }

        if (path) {
            if (type === 'page') {
                revalidatePath(path, 'page');
            } else if (type === 'layout') {
                revalidatePath(path, 'layout');
            } else {
                revalidatePath(path);
            }
            revalidated = true;
        }

        if (!revalidated) {
            return NextResponse.json({ message: 'Missing tag or path' }, { status: 400 });
        }

        return NextResponse.json({ revalidated: true, now: Date.now(), tag, path });
    } catch (err) {
        return NextResponse.json({ message: 'Error parsing request body' }, { status: 500 });
    }
}
