import { NextResponse } from 'next/server';

export async function GET() {
    return new NextResponse('b38f94d0c11749219c63d59e35a90947', {
        status: 200,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=604800, immutable',
        },
    });
}
