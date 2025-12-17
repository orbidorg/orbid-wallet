import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy-init Supabase client
let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient | null {
    if (!_supabase && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        _supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
    }
    return _supabase;
}

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export interface SupportTicket {
    id: string;
    ticket_id: string;
    email: string;
    topic: string;
    message: string;
    status: 'new' | 'in-progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high';
    wallet_address?: string;
    language: string;
    internal_notes?: string;
    admin_reply?: string;
    created_at: string;
    updated_at: string;
    resolved_at?: string;
}

/** Generate ticket ID */
function generateTicketId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `TKT-${timestamp}-${random}`.toUpperCase();
}

/** Get language from Accept-Language header */
function getLanguage(request: NextRequest): string {
    const acceptLang = request.headers.get('Accept-Language') || 'en';
    return acceptLang.startsWith('es') ? 'es' : 'en';
}

/** Send confirmation email */
async function sendConfirmationEmail(email: string, ticketId: string, topic: string, lang: string) {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    if (!apiKey || !senderEmail) return;

    const t = lang === 'es' ? {
        title: 'Ticket Recibido',
        subtitle: 'Hemos recibido tu solicitud de soporte',
        ticketLabel: 'ID del Ticket',
        categoryLabel: 'Categoría',
        responseTitle: '⏱️ Tiempo de Respuesta',
        responseText: 'Responderemos en <strong>24-72 horas</strong>',
        responseNote: 'Nuestro equipo revisa tickets en horario laboral (Lun-Vie, 9am-6pm UTC)',
        urgentText: 'Para asuntos urgentes, contáctanos en'
    } : {
        title: 'Ticket Received',
        subtitle: "We've received your support request",
        ticketLabel: 'Ticket ID',
        categoryLabel: 'Category',
        responseTitle: '⏱️ Response Time',
        responseText: "We'll respond within <strong>24-72 hours</strong>",
        responseNote: 'Our team reviews tickets during business hours (Mon-Fri, 9am-6pm UTC)',
        urgentText: 'For urgent issues, contact us at'
    };

    const topicLabels: Record<string, Record<string, string>> = {
        en: { general: 'General Question', transactions: 'Transaction Issue', account: 'Account Help', security: 'Security Concern', other: 'Other' },
        es: { general: 'Pregunta General', transactions: 'Problema de Transacción', account: 'Ayuda con Cuenta', security: 'Seguridad', other: 'Otro' }
    };

    const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0a;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
<tr><td align="center">
<table width="100%" style="max-width:400px;" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding-bottom:30px;">
        <table><tr>
            <td style="vertical-align:middle;padding-right:12px;">
                <img src="https://app.orbidwallet.com/logo.png" alt="OrbId" width="50" height="50" style="border-radius:50%;">
            </td>
            <td style="vertical-align:middle;">
                <span style="color:#fff;font-size:22px;font-weight:700;">OrbId Wallet</span>
            </td>
        </tr></table>
    </td></tr>
    <tr><td align="center" style="padding-bottom:10px;">
        <h1 style="margin:0;color:#fff;font-size:24px;">${t.title}</h1>
    </td></tr>
    <tr><td align="center" style="padding-bottom:30px;">
        <p style="margin:0;color:#a1a1aa;font-size:14px;">${t.subtitle}</p>
    </td></tr>
    <tr><td style="background:#27272a;border-radius:12px;padding:20px;margin-bottom:16px;">
        <p style="color:#a1a1aa;font-size:12px;margin:0 0 8px;">${t.ticketLabel}</p>
        <p style="color:#fff;font-size:18px;font-weight:600;margin:0;font-family:monospace;">${ticketId}</p>
    </td></tr>
    <tr><td height="16"></td></tr>
    <tr><td style="background:#27272a;border-radius:12px;padding:20px;">
        <p style="color:#a1a1aa;font-size:12px;margin:0 0 8px;">${t.categoryLabel}</p>
        <p style="color:#fff;font-size:16px;margin:0;">${topicLabels[lang][topic] || topic}</p>
    </td></tr>
    <tr><td height="16"></td></tr>
    <tr><td style="background:linear-gradient(135deg,rgba(236,72,153,0.1),rgba(168,85,247,0.1));border-radius:12px;padding:20px;border:1px solid rgba(236,72,153,0.2);">
        <p style="color:#f472b6;font-size:14px;font-weight:600;margin:0 0 8px;">${t.responseTitle}</p>
        <p style="color:#fff;font-size:16px;margin:0;">${t.responseText}</p>
        <p style="color:#a1a1aa;font-size:12px;margin:8px 0 0;">${t.responseNote}</p>
    </td></tr>
    <tr><td style="padding-top:24px;text-align:center;">
        <p style="color:#71717a;font-size:12px;margin:0;">${t.urgentText} <a href="mailto:support@orbidwallet.com" style="color:#ec4899;">support@orbidwallet.com</a></p>
    </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

    try {
        await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'accept': 'application/json', 'api-key': apiKey, 'content-type': 'application/json' },
            body: JSON.stringify({
                sender: { name: 'OrbId Support', email: senderEmail },
                to: [{ email }],
                subject: lang === 'es' ? `Ticket #${ticketId} - Hemos recibido tu solicitud` : `Ticket #${ticketId} - We've received your request`,
                htmlContent: html
            })
        });
    } catch (e) { console.error('Email error:', e); }
}

/** Send resolved email */
async function sendResolvedEmail(email: string, ticketId: string, adminReply: string | null, lang: string) {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    if (!apiKey || !senderEmail) return;

    const t = lang === 'es' ? {
        title: 'Ticket Resuelto',
        subtitle: 'Tu solicitud ha sido atendida',
        replyLabel: 'Respuesta del equipo',
        noReply: 'Tu problema ha sido resuelto.',
        footer: 'Si aún tienes problemas, responde a este email o crea un nuevo ticket.'
    } : {
        title: 'Ticket Resolved',
        subtitle: 'Your request has been addressed',
        replyLabel: 'Team Response',
        noReply: 'Your issue has been resolved.',
        footer: 'If you still have issues, reply to this email or create a new ticket.'
    };

    const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0a;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
<tr><td align="center">
<table width="100%" style="max-width:400px;" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding-bottom:30px;">
        <table><tr>
            <td style="vertical-align:middle;padding-right:12px;">
                <img src="https://app.orbidwallet.com/logo.png" alt="OrbId" width="50" height="50" style="border-radius:50%;">
            </td>
            <td style="vertical-align:middle;">
                <span style="color:#fff;font-size:22px;font-weight:700;">OrbId Wallet</span>
            </td>
        </tr></table>
    </td></tr>
    <tr><td align="center" style="padding-bottom:10px;">
        <h1 style="margin:0;color:#10b981;font-size:24px;">✅ ${t.title}</h1>
    </td></tr>
    <tr><td align="center" style="padding-bottom:20px;">
        <p style="margin:0;color:#a1a1aa;font-size:14px;">${t.subtitle}</p>
    </td></tr>
    <tr><td style="background:#27272a;border-radius:12px;padding:20px;">
        <p style="color:#a1a1aa;font-size:12px;margin:0 0 8px;">Ticket #${ticketId}</p>
        <p style="color:#a1a1aa;font-size:12px;margin:16px 0 8px;">${t.replyLabel}</p>
        <p style="color:#fff;font-size:14px;margin:0;">${adminReply || t.noReply}</p>
    </td></tr>
    <tr><td style="padding-top:24px;text-align:center;">
        <p style="color:#71717a;font-size:12px;margin:0;">${t.footer}</p>
    </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

    try {
        await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'accept': 'application/json', 'api-key': apiKey, 'content-type': 'application/json' },
            body: JSON.stringify({
                sender: { name: 'OrbId Support', email: senderEmail },
                to: [{ email }],
                subject: lang === 'es' ? `Ticket #${ticketId} - Resuelto ✅` : `Ticket #${ticketId} - Resolved ✅`,
                htmlContent: html
            })
        });
    } catch (e) { console.error('Email error:', e); }
}

/** POST - Create ticket */
export async function POST(request: NextRequest) {
    try {
        const db = getSupabase();
        if (!db) {
            return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
        }

        const body = await request.json();
        const { email, topic, message, walletAddress, priority = 'medium' } = body;

        if (!email || !topic || !message) {
            return NextResponse.json({ error: 'Email, topic, and message required' }, { status: 400 });
        }

        const lang = getLanguage(request);
        const ticketId = generateTicketId();

        const { error } = await db.from('support_tickets').insert({
            ticket_id: ticketId,
            email,
            topic,
            message,
            priority,
            wallet_address: walletAddress,
            language: lang
        });

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
        }

        await sendConfirmationEmail(email, ticketId, topic, lang);

        return NextResponse.json({ success: true, ticketId });
    } catch (e) {
        console.error('Error:', e);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

/** GET - List tickets (admin) */
export async function GET(request: NextRequest) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (token !== ADMIN_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getSupabase();
    if (!db) {
        return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const { data, error } = await db
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }

    return NextResponse.json({ tickets: data || [] });
}

/** PATCH - Update ticket (admin) */
export async function PATCH(request: NextRequest) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (token !== ADMIN_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getSupabase();
    if (!db) {
        return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    try {
        const { ticketId, status, priority, internal_notes, admin_reply } = await request.json();

        if (!ticketId) {
            return NextResponse.json({ error: 'Ticket ID required' }, { status: 400 });
        }

        // Get current ticket for email
        const { data: current } = await db
            .from('support_tickets')
            .select('email, language, status')
            .eq('ticket_id', ticketId)
            .single();

        const updates: Record<string, unknown> = {};
        if (status) updates.status = status;
        if (priority) updates.priority = priority;
        if (internal_notes !== undefined) updates.internal_notes = internal_notes;
        if (admin_reply !== undefined) updates.admin_reply = admin_reply;
        if (status === 'resolved' || status === 'closed') updates.resolved_at = new Date().toISOString();

        const { data, error } = await db
            .from('support_tickets')
            .update(updates)
            .eq('ticket_id', ticketId)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: 'Update failed' }, { status: 500 });
        }

        // Send email on resolve
        if (status === 'resolved' && current?.status !== 'resolved' && current?.email) {
            await sendResolvedEmail(current.email, ticketId, admin_reply, current.language || 'en');
        }

        return NextResponse.json({ success: true, ticket: data });
    } catch (e) {
        console.error('Error:', e);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

/** DELETE - Delete ticket (admin) */
export async function DELETE(request: NextRequest) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (token !== ADMIN_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getSupabase();
    if (!db) {
        return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const ticketId = new URL(request.url).searchParams.get('id');
    if (!ticketId) {
        return NextResponse.json({ error: 'Ticket ID required' }, { status: 400 });
    }

    const { error } = await db
        .from('support_tickets')
        .delete()
        .eq('ticket_id', ticketId);

    if (error) {
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
