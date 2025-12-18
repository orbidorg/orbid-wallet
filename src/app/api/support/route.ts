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

export interface HistoryEntry {
    type: 'user_message' | 'admin_reply' | 'status_change' | 'note';
    content: string;
    attachments?: string[];
    author?: string;
    timestamp: string;
}

export interface SupportTicket {
    id: string;
    ticket_id: string;
    email: string;
    topic: string;
    message: string;
    status: 'new' | 'in-progress' | 'resolved' | 'closed' | 're-opened';
    priority: 'low' | 'medium' | 'high';
    wallet_address?: string;
    language: string;
    internal_notes?: string;
    admin_reply?: string;
    attachments?: string[];
    history?: HistoryEntry[];
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

/** Helper to send email via Cloudflare Worker */
async function sendEmailViaWorker(email: string, subject: string, html: string, from?: string, fromName?: string) {
    const workerUrl = process.env.MAILER_WORKER_URL;
    const secret = process.env.MAILER_SECRET;
    if (!workerUrl || !secret) {
        console.error('Mailer environment variables missing (MAILER_WORKER_URL or MAILER_SECRET)');
        return;
    }

    try {
        await fetch(workerUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${secret}`
            },
            body: JSON.stringify({
                to: email,
                subject,
                htmlContent: html,
                from: from || 'support@mail.orbidwallet.com',
                fromName: fromName || 'OrbId Wallet Support'
            })
        });
    } catch (e) { console.error('Worker Email error:', e); }
}

/** Send confirmation email */
async function sendConfirmationEmail(email: string, ticketId: string, topic: string, lang: string) {

    const t = lang === 'es' ? {
        title: 'Ticket Recibido',
        subtitle: 'Hemos recibido tu solicitud de soporte',
        ticketLabel: 'Número de Ticket',
        categoryLabel: 'Categoría',
        responseTime: 'Te responderemos en 24-48 horas',
        footer: 'Si tienes más preguntas, responde a este email.'
    } : {
        title: 'Ticket Received',
        subtitle: "We've received your support request",
        ticketLabel: 'Ticket Number',
        categoryLabel: 'Category',
        responseTime: "We'll respond within 24-48 hours",
        footer: 'If you have more questions, reply to this email.'
    };

    const topicLabels: Record<string, Record<string, string>> = {
        en: { general: 'General Question', transactions: 'Transaction Issue', account: 'Account Help', security: 'Security', other: 'Other' },
        es: { general: 'Pregunta General', transactions: 'Problema de Transacción', account: 'Ayuda con Cuenta', security: 'Seguridad', other: 'Otro' }
    };

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" max-width="400px" cellpadding="0" cellspacing="0" style="max-width: 400px;">
                    <!-- Logo with Text -->
                    <tr>
                        <td align="center" style="padding-bottom: 30px;">
                            <table cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="vertical-align: middle; padding-right: 12px;">
                                        <img src="https://app.orbidwallet.com/logo.png" alt="OrbId" width="50" height="50" style="border-radius: 50%;" />
                                    </td>
                                    <td style="vertical-align: middle;">
                                        <span style="color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">OrbId Wallet</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Title -->
                    <tr>
                        <td align="center" style="padding-bottom: 10px;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                                ${t.title}
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Subtitle -->
                    <tr>
                        <td align="center" style="padding-bottom: 30px;">
                            <p style="margin: 0; color: #a1a1aa; font-size: 14px;">
                                ${t.subtitle}
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Ticket ID Box -->
                    <tr>
                        <td align="center" style="padding-bottom: 20px;">
                            <div style="background: linear-gradient(135deg, rgba(236,72,153,0.1), rgba(139,92,246,0.1)); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px 40px;">
                                <p style="margin: 0 0 8px; color: #a1a1aa; font-size: 12px;">${t.ticketLabel}</p>
                                <span style="color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 2px; font-family: monospace;">
                                    ${ticketId}
                                </span>
                            </div>
                        </td>
                    </tr>

                    <!-- Category -->
                    <tr>
                        <td align="center" style="padding-bottom: 20px;">
                            <p style="margin: 0 0 4px; color: #a1a1aa; font-size: 12px;">${t.categoryLabel}</p>
                            <p style="margin: 0; color: #ffffff; font-size: 16px;">${topicLabels[lang][topic] || topic}</p>
                        </td>
                    </tr>
                    
                    <!-- Response Time -->
                    <tr>
                        <td align="center" style="padding-bottom: 20px;">
                            <p style="margin: 0; color: #ec4899; font-size: 14px; font-weight: 500;">
                                ${t.responseTime}
                            </p>
                        </td>
                    </tr>

                    <!-- Divider -->
                    <tr>
                        <td style="padding-bottom: 20px;">
                            <div style="border-top: 1px solid rgba(255,255,255,0.1);"></div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td align="center">
                            <p style="margin: 0; color: #52525b; font-size: 11px; line-height: 1.6;">
                                ${t.footer}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

    const subject = lang === 'es' ? `Ticket #${ticketId} - Recibido` : `Ticket #${ticketId} - Received`;
    await sendEmailViaWorker(email, subject, html, 'support@mail.orbidwallet.com', 'OrbId Wallet Support');
}

/** Send resolved email */
async function sendResolvedEmail(email: string, ticketId: string, adminReply: string | null, lang: string, attachmentUrls: string[] = []) {

    const t = lang === 'es' ? {
        title: 'Ticket Resuelto',
        subtitle: 'Tu solicitud ha sido atendida',
        ticketLabel: 'Ticket',
        responseLabel: 'Nuestra respuesta',
        noReply: 'Tu problema ha sido resuelto.',
        attachmentsLabel: 'Archivos adjuntos',
        footer: 'Si aún necesitas ayuda, responde a este email.'
    } : {
        title: 'Ticket Resolved',
        subtitle: 'Your request has been addressed',
        ticketLabel: 'Ticket',
        responseLabel: 'Our response',
        noReply: 'Your issue has been resolved.',
        attachmentsLabel: 'Attachments',
        footer: 'If you still need help, just reply to this email.'
    };

    const attachmentsHtml = attachmentUrls.length > 0 ? `
                    <tr>
                        <td align="center" style="padding-top: 20px;">
                            <p style="margin: 0 0 12px; color: #a1a1aa; font-size: 12px;">${t.attachmentsLabel}</p>
                            ${attachmentUrls.map(url => `<img src="${url}" alt="Attachment" style="max-width: 100%; border-radius: 8px; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.1);">`).join('')}
                        </td>
                    </tr>` : '';

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" max-width="400px" cellpadding="0" cellspacing="0" style="max-width: 400px;">
                    <!-- Logo with Text -->
                    <tr>
                        <td align="center" style="padding-bottom: 30px;">
                            <table cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="vertical-align: middle; padding-right: 12px;">
                                        <img src="https://app.orbidwallet.com/logo.png" alt="OrbId" width="50" height="50" style="border-radius: 50%;" />
                                    </td>
                                    <td style="vertical-align: middle;">
                                        <span style="color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">OrbId Wallet</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Title -->
                    <tr>
                        <td align="center" style="padding-bottom: 10px;">
                            <h1 style="margin: 0; color: #10b981; font-size: 24px; font-weight: 600;">
                                ✓ ${t.title}
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Subtitle -->
                    <tr>
                        <td align="center" style="padding-bottom: 20px;">
                            <p style="margin: 0; color: #a1a1aa; font-size: 14px;">
                                ${t.subtitle}
                            </p>
                        </td>
                    </tr>

                    <!-- Ticket ID -->
                    <tr>
                        <td align="center" style="padding-bottom: 20px;">
                            <p style="margin: 0; color: #71717a; font-size: 12px;">
                                ${t.ticketLabel} <span style="color: #ffffff; font-family: monospace;">#${ticketId}</span>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Response Box -->
                    <tr>
                        <td align="center" style="padding-bottom: 20px;">
                            <div style="background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(139,92,246,0.1)); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; text-align: left;">
                                <p style="margin: 0 0 8px; color: #a1a1aa; font-size: 12px;">${t.responseLabel}</p>
                                <p style="margin: 0; color: #ffffff; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${adminReply || t.noReply}</p>
                            </div>
                        </td>
                    </tr>

                    ${attachmentsHtml}

                    <!-- Divider -->
                    <tr>
                        <td style="padding-bottom: 20px;">
                            <div style="border-top: 1px solid rgba(255,255,255,0.1);"></div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td align="center">
                            <p style="margin: 0; color: #52525b; font-size: 11px; line-height: 1.6;">
                                ${t.footer}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

    const subject = lang === 'es' ? `Ticket #${ticketId} - Resuelto ✓` : `Ticket #${ticketId} - Resolved ✓`;
    await sendEmailViaWorker(email, subject, html, 'support@mail.orbidwallet.com', 'OrbId Wallet Support');
}

/** Send reply email (for in-progress tickets) */
async function sendReplyEmail(email: string, ticketId: string, replyMessage: string, lang: string, attachmentUrls: string[] = []) {

    const t = lang === 'es' ? {
        title: 'Nueva Respuesta',
        subtitle: 'Tienes una nueva respuesta en tu ticket',
        ticketLabel: 'Ticket',
        messageLabel: 'Mensaje',
        attachmentsLabel: 'Archivos adjuntos',
        replyPrompt: 'Responde a este email para continuar la conversación.',
        footer: 'Si tienes más preguntas, responde a este email.'
    } : {
        title: 'New Reply',
        subtitle: 'You have a new reply on your ticket',
        ticketLabel: 'Ticket',
        messageLabel: 'Message',
        attachmentsLabel: 'Attachments',
        replyPrompt: 'Reply to this email to continue the conversation.',
        footer: 'If you have more questions, reply to this email.'
    };

    const attachmentsHtml = attachmentUrls.length > 0 ? `
                    <tr>
                        <td align="center" style="padding-top: 20px;">
                            <p style="margin: 0 0 12px; color: #a1a1aa; font-size: 12px;">${t.attachmentsLabel}</p>
                            ${attachmentUrls.map(url => `<img src="${url}" alt="Attachment" style="max-width: 100%; border-radius: 8px; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.1);">`).join('')}
                        </td>
                    </tr>` : '';

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" max-width="400px" cellpadding="0" cellspacing="0" style="max-width: 400px;">
                    <!-- Logo with Text -->
                    <tr>
                        <td align="center" style="padding-bottom: 30px;">
                            <table cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="vertical-align: middle; padding-right: 12px;">
                                        <img src="https://app.orbidwallet.com/logo.png" alt="OrbId" width="50" height="50" style="border-radius: 50%;" />
                                    </td>
                                    <td style="vertical-align: middle;">
                                        <span style="color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">OrbId Wallet</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Title -->
                    <tr>
                        <td align="center" style="padding-bottom: 10px;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                                ${t.title}
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Subtitle -->
                    <tr>
                        <td align="center" style="padding-bottom: 20px;">
                            <p style="margin: 0; color: #a1a1aa; font-size: 14px;">
                                ${t.subtitle}
                            </p>
                        </td>
                    </tr>

                    <!-- Ticket ID -->
                    <tr>
                        <td align="center" style="padding-bottom: 20px;">
                            <p style="margin: 0; color: #71717a; font-size: 12px;">
                                ${t.ticketLabel} <span style="color: #ffffff; font-family: monospace;">#${ticketId}</span>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Message Box -->
                    <tr>
                        <td align="center" style="padding-bottom: 20px;">
                            <div style="background: linear-gradient(135deg, rgba(236,72,153,0.1), rgba(139,92,246,0.1)); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; text-align: left;">
                                <p style="margin: 0 0 8px; color: #a1a1aa; font-size: 12px;">${t.messageLabel}</p>
                                <p style="margin: 0; color: #ffffff; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${replyMessage}</p>
                            </div>
                        </td>
                    </tr>

                    ${attachmentsHtml}

                    <!-- Reply Prompt -->
                    <tr>
                        <td align="center" style="padding-bottom: 20px;">
                            <p style="margin: 0; color: #ec4899; font-size: 13px; font-weight: 500;">
                                ${t.replyPrompt}
                            </p>
                        </td>
                    </tr>

                    <!-- Divider -->
                    <tr>
                        <td style="padding-bottom: 20px;">
                            <div style="border-top: 1px solid rgba(255,255,255,0.1);"></div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td align="center">
                            <p style="margin: 0; color: #52525b; font-size: 11px; line-height: 1.6;">
                                ${t.footer}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

    const subject = lang === 'es' ? `Re: Ticket ${ticketId}` : `Re: Ticket ${ticketId}`;
    await sendEmailViaWorker(email, subject, html, 'support@mail.orbidwallet.com', 'OrbId Wallet Support');
}


/** POST - Create ticket */
export async function POST(request: NextRequest) {
    try {
        const db = getSupabase();
        if (!db) {
            return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
        }

        const body = await request.json();
        const { email, topic, message, walletAddress, priority = 'medium', attachments = [] } = body;

        if (!email || !topic || !message) {
            return NextResponse.json({ error: 'Email, topic, and message required' }, { status: 400 });
        }

        const lang = getLanguage(request);
        const ticketId = generateTicketId();

        // Initialize history with user's first message
        const initialHistory: HistoryEntry[] = [{
            type: 'user_message',
            content: message,
            attachments: attachments.length > 0 ? attachments : undefined,
            author: email,
            timestamp: new Date().toISOString()
        }];

        const { error } = await db.from('support_tickets').insert({
            ticket_id: ticketId,
            email,
            topic,
            message,
            priority,
            wallet_address: walletAddress,
            language: lang,
            attachments: attachments,
            history: initialHistory
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

const FAQs = [
    {
        question_en: "How do I verify my World ID?",
        answer_en: "Go to the 'Verify' tab in the app and follow the instructions to connect with World App.",
        question_es: "¿Cómo verifico mi World ID?",
        answer_es: "Ve a la pestaña 'Verificar' en la app y sigue las instrucciones para conectar con World App."
    },
    {
        question_en: "Is my wallet secure?",
        answer_en: "Yes, OrbId Wallet is non-custodial. You own your private keys via World ID authentication.",
        question_es: "¿Es segura mi billetera?",
        answer_es: "Sí, OrbId Wallet no tiene custodia. Tú eres dueño de tus claves privadas mediante autenticación World ID."
    },
    {
        question_en: "How long do deposits take?",
        answer_en: "Deposits usually arrive within minutes, depending on network congestion (Optimism/World Chain).",
        question_es: "¿Cuánto tardan los depósitos?",
        answer_es: "Los depósitos suelen llegar en minutos, dependiendo de la congestión de la red (Optimism/World Chain)."
    }
];

// GET: Retrieve user tickets or check status
export async function GET(request: NextRequest) {
    const auth = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // Public: Get FAQs
    if (type === 'faq') {
        // In future: await supabaseAdmin.from('faqs').select('*').eq('is_active', true);
        return NextResponse.json({ faqs: FAQs });
    }

    // Public: Check Ticket Status (Rate limited conceptually)
    if (type === 'status') {
        const ticketId = searchParams.get('id');
        const email = searchParams.get('email');

        if (!ticketId || !email) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
        }

        const supabase = getSupabase();
        if (!supabase) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const { data, error } = await supabase
            .from('support_tickets')
            .select('status, updated_at, admin_reply')
            .eq('ticket_id', ticketId) // Use public ticket_id (e.g. T-1234)
            .eq('email', email)        // strict check
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        return NextResponse.json({
            status: data.status,
            updatedAt: data.updated_at,
            lastReply: data.status === 'resolved' || data.admin_reply ? data.admin_reply : null
        });
    }

    // Admin: List all tickets
    if (auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
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
        const { ticketId, status, priority, internal_notes, admin_reply, action, attachmentUrls = [] } = await request.json();

        if (!ticketId) {
            return NextResponse.json({ error: 'Ticket ID required' }, { status: 400 });
        }

        // Get current ticket for email and history
        const { data: current } = await db
            .from('support_tickets')
            .select('email, language, status, priority, history')
            .eq('ticket_id', ticketId)
            .single();

        const updates: Record<string, unknown> = {};
        if (status) updates.status = status;
        if (priority) updates.priority = priority;
        if (internal_notes !== undefined) updates.internal_notes = internal_notes;
        if (admin_reply !== undefined) updates.admin_reply = admin_reply;

        // Append to history for reply/resolve actions
        const currentHistory: HistoryEntry[] = current?.history || [];

        if (action === 'reply' && admin_reply) {
            // Reply action: set to in-progress and append to history
            updates.status = 'in-progress';
            currentHistory.push({
                type: 'admin_reply',
                content: admin_reply,
                attachments: attachmentUrls.length > 0 ? attachmentUrls : undefined,
                author: 'Thian from OrbId Labs',
                timestamp: new Date().toISOString()
            });
            updates.history = currentHistory;
        } else if (action === 'resolve') {
            // Resolve action: set to resolved and append final message
            updates.status = 'resolved';
            updates.resolved_at = new Date().toISOString();
            if (admin_reply) {
                currentHistory.push({
                    type: 'admin_reply',
                    content: admin_reply,
                    attachments: attachmentUrls.length > 0 ? attachmentUrls : undefined,
                    author: 'Thian from OrbId Labs',
                    timestamp: new Date().toISOString()
                });
            }
            currentHistory.push({
                type: 'status_change',
                content: 'Ticket marked as resolved',
                author: 'System',
                timestamp: new Date().toISOString()
            });
            updates.history = currentHistory;
        } else if (status === 'resolved' || status === 'closed') {
            updates.resolved_at = new Date().toISOString();
        }

        // Detect manual status/priority changes (if no specific action)
        if (!action && current) {
            let historyUpdated = false;

            if (status && status !== current.status) {
                currentHistory.push({
                    type: 'status_change',
                    content: `Status updated to '${status}'`,
                    author: 'System',
                    timestamp: new Date().toISOString()
                });
                historyUpdated = true;
            }

            if (priority && priority !== current.priority) {
                currentHistory.push({
                    type: 'status_change',
                    content: `Priority updated to '${priority}'`,
                    author: 'System',
                    timestamp: new Date().toISOString()
                });
                historyUpdated = true;
            }

            if (historyUpdated) {
                updates.history = currentHistory;
            }
        }

        const { data, error } = await db
            .from('support_tickets')
            .update(updates)
            .eq('ticket_id', ticketId)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: 'Update failed' }, { status: 500 });
        }

        // Send emails based on action (with embedded images)
        if (current?.email) {
            if (action === 'reply' && admin_reply) {
                await sendReplyEmail(current.email, ticketId, admin_reply, current.language || 'en', attachmentUrls);
            } else if (action === 'resolve') {
                await sendResolvedEmail(current.email, ticketId, admin_reply, current.language || 'en', attachmentUrls);
            }
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
