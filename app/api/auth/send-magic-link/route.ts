import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createMagicLinkToken } from '@/lib/auth';

const resend = new Resend(process.env.RESEND_API_KEY);
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Create magic link token
    const token = createMagicLinkToken(email);
    const magicLink = `${BASE_URL}/api/auth/verify?token=${token}&name=${encodeURIComponent(name || '')}`;

    // Send email via Resend
    await resend.emails.send({
      from: 'Ruth Performance <login@kyleruthcoaching.com>',
      to: email,
      subject: 'Sign in to Ruth Performance',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="background: linear-gradient(135deg, #06b6d4 0%, #10b981 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 32px; margin: 0;">
              Ruth Performance
            </h1>
          </div>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Click the button below to sign in to your athlete dashboard. This link will expire in 15 minutes.
          </p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${magicLink}" style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #10b981 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Sign In
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            If you didn't request this email, you can safely ignore it.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0;" />
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Ruth Performance · Athlete Assessment Platform
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending magic link:', error);
    return NextResponse.json({ error: 'Failed to send magic link' }, { status: 500 });
  }
}
