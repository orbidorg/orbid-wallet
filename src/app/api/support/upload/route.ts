import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'stor-orbid-wallet';

function getSupabase() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return null;
    }
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
}

export async function POST(request: NextRequest) {
    try {
        const supabase = getSupabase();
        if (!supabase) {
            return NextResponse.json({ error: 'Storage unavailable' }, { status: 503 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const ticketId = formData.get('ticketId') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' }, { status: 400 });
        }

        // Validate file size (10MB max)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json({ error: 'File too large. Max 10MB' }, { status: 400 });
        }

        // Generate unique filename
        const ext = file.name.split('.').pop() || 'jpg';
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const folder = ticketId || 'general';
        const fileName = `${folder}/${timestamp}-${random}.${ext}`;

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (error) {
            console.error('Upload error:', error);
            return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(data.path);

        return NextResponse.json({
            success: true,
            url: urlData.publicUrl,
            path: data.path
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
