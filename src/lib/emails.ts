// lib/email.ts
import nodemailer from "nodemailer";

// Create reusable transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

export interface BulkEmailOptions {
    recipients: string[];
    subject: string;
    text?: string;
    html?: string;
}

export async function sendEmail(options: EmailOptions) {
    try {
        const info = await transporter.sendMail({
            from: `"Malipo Agents" <${process.env.SMTP_USER}>`,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html || options.text,
        });

        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, error };
    }
}

export async function sendBulkEmails(options: BulkEmailOptions) {
    const results = await Promise.allSettled(
        options.recipients.map((recipient) =>
            sendEmail({
                to: recipient,
                subject: options.subject,
                text: options.text,
                html: options.html,
            })
        )
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return {
        successful,
        failed,
        total: options.recipients.length,
    };
}