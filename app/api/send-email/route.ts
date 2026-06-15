import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: Request) {
    try {
        const { email, name } = await req.json();

        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
            return NextResponse.json(
                { success: false, error: "RESEND_API_KEY is not defined" },
                { status: 500 }
            );
        }

        const resend = new Resend(resendApiKey);
        const data = await resend.emails.send({
            from: "onboarding@resend.dev",
            to: email,
            subject: "Welcome!",
            html: `<h1>Hello ${name}</h1>
             <p>Welcome to our website.</p>`,
        });

        return NextResponse.json({
            success: true,
            data,
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error },
            { status: 500 }
        );
    }
}