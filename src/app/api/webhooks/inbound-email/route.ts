import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
// Initialize Supabase Client
function getSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) return null;
    return createClient(supabaseUrl, supabaseServiceKey);
}

/** 
 * Strips quoted history from email body.
 * Handles common markers like "On ... wrote:" or "--- Reply above ---"
 */
function stripEmailThread(text: string): string {
    if (!text) return "";

    // Common thread markers
    const markers = [
        /^On .+, .+, .+ wrote:$/m,
        /^De: .+/m,
        /^From: .+/m,
        /^-+ Original Message -+$/m,
        /^-+ Mensaje original -+$/m,
        /^> .+/m,
        /--\nReply above this line/i,
    ];

    let cleanText = text;

    for (const marker of markers) {
        const match = cleanText.match(marker);
        if (match && match.index !== undefined) {
            cleanText = cleanText.substring(0, match.index);
        }
    }

    return cleanText.trim();
}

export async function POST(request: NextRequest) {
    console.log('📨 Inbound Email Webhook Triggered');

    try {
        // Security check: Match MAILER_SECRET
        const authHeader = request.headers.get("Authorization");
        const expectedSecret = process.env.MAILER_SECRET;
        const expectedHeader = `Bearer ${expectedSecret}`;

        if (!authHeader || authHeader.trim() !== expectedHeader.trim()) {
            console.error('❌ Unauthorized webhook attempt');
            console.log(`Diagnostic - Header present: ${!!authHeader}`);
            console.log(`Diagnostic - Received length: ${authHeader?.length}`);
            console.log(`Diagnostic - Expected length: ${expectedHeader.length}`);
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Cloudflare Worker sends: { from, subject, raw }
        const subject = body.subject || '';
        const rawBody = body.raw || '';
        const fromEmail = body.from || '';

        // Extract clean body from raw (if it's a raw email string)
        // Cloudflare Worker currently sends the raw text, which includes headers.
        // We need a simple extraction of the body or assuming the Worker sends textBody in the future.
        // For now, let's treat the payload as having a 'text' field if we update the worker,
        // or just take the body part of raw.

        let messageContent = body.text || rawBody;

        // If it's the raw multi-part email, this is complex. 
        // Let's assume the user's worker sends the text part or we parse it simply.
        if (rawBody.includes('\r\n\r\n')) {
            // Very basic extraction of the first text block if we have the raw email
            const parts = rawBody.split('\r\n\r\n');
            if (parts.length > 1) {
                // Heuristic: The body is usually after the headers
                // This is a naive fallback. Ideally the worker sends the text.
                messageContent = parts.slice(1).join('\r\n\r\n');
            }
        }

        const cleanMessage = stripEmailThread(messageContent);

        if (!cleanMessage) {
            console.log('⚠️ Empty message content after stripping');
            return NextResponse.json({ message: 'Empty message' }, { status: 200 });
        }

        // Extract Ticket ID: Looks for "Ticket #TKT-..." or matches TKT-XXXX-XXXX directly
        const ticketIdMatch = subject.match(/(TKT-[A-Z0-9]+-[A-Z0-9]+)/i);

        if (!ticketIdMatch) {
            console.log('⚠️ No Ticket ID found in subject:', subject);
            return NextResponse.json({ message: 'No ticket ID found' }, { status: 200 });
        }

        const ticketId = ticketIdMatch[1].toUpperCase();
        console.log(`🎫 Found Ticket ID: ${ticketId}`);

        const supabase = getSupabase();
        if (!supabase) {
            console.error('❌ Server configuration error: Supabase env vars missing');
            return NextResponse.json({ error: 'Server error' }, { status: 500 });
        }

        // Fetch existing ticket
        const { data: ticket, error: fetchError } = await supabase
            .from('support_tickets')
            .select('id, status, history, email')
            .eq('ticket_id', ticketId)
            .single();

        if (fetchError || !ticket) {
            console.error('❌ Ticket not found or DB error:', fetchError);
            return NextResponse.json({ message: 'Ticket not found' }, { status: 200 });
        }

        // Prepare updates
        const updates: any = {};
        const newHistoryItem = {
            type: 'user_message',
            content: cleanMessage,
            author: ticket.email,
            timestamp: new Date().toISOString()
        };

        const currentHistory = ticket.history || [];
        currentHistory.push(newHistoryItem);

        updates.history = currentHistory;
        updates.updated_at = new Date().toISOString();

        // Re-open logic
        if (ticket.status === 'resolved' || ticket.status === 'closed') {
            updates.status = 're-opened';
            updates.resolved_at = null;

            currentHistory.push({
                type: 'status_change',
                content: 'Ticket re-opened by user email reply',
                author: 'System',
                timestamp: new Date().toISOString()
            });
        } else if (ticket.status === 'new') {
            updates.status = 'in-progress';
        }

        // Update DB
        const { error: updateError } = await supabase
            .from('support_tickets')
            .update(updates)
            .eq('ticket_id', ticketId);

        if (updateError) {
            console.error('❌ Failed to update ticket:', updateError);
            return NextResponse.json({ error: 'Update failed' }, { status: 500 });
        }

        console.log(`✅ Ticket ${ticketId} updated successfully from email`);
        return NextResponse.json({ success: true });

    } catch (e) {
        console.error('🔥 Webhook Error:', e);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
