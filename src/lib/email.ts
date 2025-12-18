/**
 * Brevo Email Service for sending login codes
 */

import { getEmailTranslations } from './emailTranslations';

interface SendEmailOptions {
    to: string;
    subject: string;
    htmlContent: string;
}

export async function sendEmail({ to, subject, htmlContent }: SendEmailOptions): Promise<boolean> {
    const workerUrl = process.env.MAILER_WORKER_URL;
    const secret = process.env.MAILER_SECRET;
    const senderEmail = 'no-reply@mail.orbidwallet.com';
    const senderName = 'OrbId Wallet';

    if (!workerUrl || !secret) {
        console.error('Mailer not configured: missing Worker URL or Secret');
        return false;
    }

    try {
        const response = await fetch(workerUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${secret}`
            },
            body: JSON.stringify({
                to,
                from: senderEmail,
                fromName: senderName,
                subject,
                htmlContent,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Mailer Worker error:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Failed to send email via worker:', error);
        return false;
    }
}

export async function sendLoginCode(email: string, code: string, lang: string = 'en'): Promise<boolean> {
    const t = getEmailTranslations(lang);
    const isRTL = lang === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const textAlign = isRTL ? 'right' : 'center';

    const htmlContent = `
    <!DOCTYPE html>
    <html dir="${dir}">
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
                            <td align="${textAlign}" style="padding-bottom: 10px;">
                                <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                                    ${t.title}
                                </h1>
                            </td>
                        </tr>
                        
                        <!-- Subtitle -->
                        <tr>
                            <td align="${textAlign}" style="padding-bottom: 30px;">
                                <p style="margin: 0; color: #a1a1aa; font-size: 14px;">
                                    ${t.subtitle}
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Code Box -->
                        <tr>
                            <td align="center" style="padding-bottom: 20px;">
                                <div style="background: linear-gradient(135deg, rgba(236,72,153,0.1), rgba(139,92,246,0.1)); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px 40px;">
                                    <span style="color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: 8px; font-family: monospace;">
                                        ${code}
                                    </span>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Expiry notice -->
                        <tr>
                            <td align="${textAlign}" style="padding-bottom: 20px;">
                                <p style="margin: 0; color: #71717a; font-size: 12px;">
                                    ${t.expiresIn}
                                </p>
                            </td>
                        </tr>

                        <!-- Terms Agreement -->
                        <tr>
                            <td align="${textAlign}" style="padding-bottom: 20px;">
                                <p style="margin: 0; color: #a1a1aa; font-size: 11px; line-height: 1.5;">
                                    ${t.termsAgreement}
                                    <br/>
                                    <a href="https://app.orbidwallet.com/legal/terms" style="color: #ec4899; text-decoration: underline;">Terms of Service</a> • 
                                    <a href="https://app.orbidwallet.com/legal/privacy" style="color: #ec4899; text-decoration: underline;">Privacy Policy</a>
                                </p>
                            </td>
                        </tr>

                        <!-- Divider -->
                        <tr>
                            <td style="padding-bottom: 20px;">
                                <div style="border-top: 1px solid rgba(255,255,255,0.1);"></div>
                            </td>
                        </tr>
                        
                        <!-- Security Warning -->
                        <tr>
                            <td align="${textAlign}">
                                <p style="margin: 0; color: #52525b; font-size: 11px; line-height: 1.6;">
                                    ${t.securityWarning}
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    return sendEmail({
        to: email,
        subject: `${code} ${t.subject}`,
        htmlContent,
    });
}

