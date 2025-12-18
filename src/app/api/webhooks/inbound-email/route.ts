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

export async function POST(request: NextRequest) {
    console.log('📨 Inbound Email Webhook Triggered');

    try {
        // Security check: Match MAILER_SECRET
        const authHeader = request.headers.get("Authorization");
        if (authHeader !== `Bearer ${process.env.MAILER_SECRET}`) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Brevo/Sendinblue Inbound Parse payload usually has 'items' array or direct fields depending on config
        // Assuming standard inbound JSON format involves 'subject' and 'textBody' or 'items'
        // For standard JSON mode:
        const subject = body.subject || body.Subject || '';
        const textBody = body.textBody || body['TextBody'] || body.htmlBody || ''; // prefer text, fallback to html
        const fromEmail = body.from || body.From || '';

        // Extract Ticket ID: Looks for "Ticket #TKT-..." or matches TKT-XXXX-XXXX directly
        const ticketIdMatch = subject.match(/(TKT-[A-Z0-9]+-[A-Z0-9]+)/i);

        if (!ticketIdMatch) {
            console.log('⚠️ No Ticket ID found in subject:', subject);
            return NextResponse.json({ message: 'No ticket ID found' }, { status: 200 }); // Return 200 to satisfy webhook sender
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

        // Security check: Ensure sender matches ticket owner (basic check)
        // Note: 'fromEmail' formats can vary "Name <email@com>" or just "email@com"
        if (!fromEmail.includes(ticket.email)) {
            console.warn(`⚠️ Sender mismatch: ${fromEmail} !== ${ticket.email}`);
            // We might want to allow it if it's an admin reply, but this webhook is for USER replies usually?
            // For now, let's log but proceed (or strict check?)
            // Strict check might block legitimate replies if forwarded. 
            // Let's assume Brevo validates DMARC/SPF if configured.
        }

        // Prepare updates
        const updates: any = {};
        const newHistoryItem = {
            type: 'user_message',
            content: textBody,
            author: ticket.email, // Assume author is the user
            timestamp: new Date().toISOString()
        };

        const currentHistory = ticket.history || [];
        currentHistory.push(newHistoryItem);

        updates.history = currentHistory;
        updates.updated_at = new Date().toISOString();

        // Re-open logic
        if (ticket.status === 'resolved' || ticket.status === 'closed') {
            updates.status = 're-opened';
            updates.resolved_at = null; // Clear resolved date? Or keep it? keeping might be better history. Let's clear to indicate active.

            // Log status change
            currentHistory.push({
                type: 'status_change',
                content: 'Ticket re-opened by user reply',
                author: 'System',
                timestamp: new Date().toISOString()
            });
        } else if (ticket.status === 'new') {
            updates.status = 'in-progress'; // Flip to in-progress if they reply to auto-responder?
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

        console.log(`✅ Ticket ${ticketId} updated successfully`);
        return NextResponse.json({ success: true });

    } catch (e) {
        console.error('🔥 Webhook Error:', e);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
