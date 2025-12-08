/**
 * Brevo Email Service for sending login codes
 */

interface SendEmailOptions {
    to: string;
    subject: string;
    htmlContent: string;
}

export async function sendEmail({ to, subject, htmlContent }: SendEmailOptions): Promise<boolean> {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const senderName = process.env.BREVO_SENDER_NAME || 'OrbId Wallet';

    if (!apiKey || !senderEmail) {
        console.error('Brevo not configured: missing API key or sender email');
        return false;
    }

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                sender: {
                    name: senderName,
                    email: senderEmail,
                },
                to: [{ email: to }],
                subject,
                htmlContent,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Brevo API error:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Failed to send email:', error);
        return false;
    }
}

export async function sendLoginCode(email: string, code: string): Promise<boolean> {
    const htmlContent = `
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
                                            <img src="https://raw.githubusercontent.com/vanigesas/music-distribution-platform/4eaf129104284cddf5f4bab6cc16ffb905154341/public/logo.png" alt="OrbId" width="50" height="50" style="border-radius: 50%;" />
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
                                    Your Login Code
                                </h1>
                            </td>
                        </tr>
                        
                        <!-- Subtitle -->
                        <tr>
                            <td align="center" style="padding-bottom: 30px;">
                                <p style="margin: 0; color: #a1a1aa; font-size: 14px;">
                                    Enter this code to sign in to OrbId Wallet
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Code Box -->
                        <tr>
                            <td align="center" style="padding-bottom: 30px;">
                                <div style="background: linear-gradient(135deg, rgba(236,72,153,0.1), rgba(139,92,246,0.1)); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px 40px;">
                                    <span style="color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: 8px; font-family: monospace;">
                                        ${code}
                                    </span>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Expiry notice -->
                        <tr>
                            <td align="center" style="padding-bottom: 40px;">
                                <p style="margin: 0; color: #71717a; font-size: 12px;">
                                    This code expires in 10 minutes
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td align="center">
                                <p style="margin: 0; color: #52525b; font-size: 11px;">
                                    If you didn't request this code, you can safely ignore this email.
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
        subject: `${code} is your OrbId Wallet login code`,
        htmlContent,
    });
}
