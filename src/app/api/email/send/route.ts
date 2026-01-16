// app/api/emails/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getUserByEmail } from "@/lib/users";
import { Role } from "@/lib/roles";
import { sendEmail, sendBulkEmails } from "@/lib/emails";

// Helper function to check if user is admin
async function isAdmin(): Promise<boolean> {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) return false;

        const user = await getUserByEmail(session.user.email);
        if (!user) return false;

        return user.roles?.includes(Role.ADMIN) ?? false;
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
}

export async function POST(req: NextRequest) {
    try {
        // Check admin authorization
        if (!(await isAdmin())) {
            return NextResponse.json(
                { error: "Unauthorized. Admin access required." },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { recipients, subject, text, html } = body;

        // Validation
        if (!recipients || (Array.isArray(recipients) && recipients.length === 0)) {
            return NextResponse.json(
                { error: "At least one recipient is required" },
                { status: 400 }
            );
        }

        if (!subject || !subject.trim()) {
            return NextResponse.json(
                { error: "Subject is required" },
                { status: 400 }
            );
        }

        if (!text && !html) {
            return NextResponse.json(
                { error: "Email body (text or html) is required" },
                { status: 400 }
            );
        }

        // Handle single or bulk emails
        if (Array.isArray(recipients)) {
            // Bulk email
            const result = await sendBulkEmails({
                recipients,
                subject,
                text,
                html,
            });

            return NextResponse.json({
                message: "Bulk emails sent",
                sent: result.successful,
                failed: result.failed,
                total: result.total,
            });
        } else {
            // Single email
            const result = await sendEmail({
                to: recipients,
                subject,
                text,
                html,
            });

            if (result.success) {
                return NextResponse.json({
                    message: "Email sent successfully",
                    messageId: result.messageId,
                });
            } else {
                return NextResponse.json(
                    { error: "Failed to send email" },
                    { status: 500 }
                );
            }
        }
    } catch (error) {
        console.error("Error in email send API:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}