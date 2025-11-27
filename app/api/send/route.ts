import { EmailTemplate } from '@/components/email/email-template';
import { config } from '@/config/env';
import { Resend } from 'resend';
import { auth } from '@/server/auth';
import { headers } from 'next/headers';

const resend = new Resend(config.RESEND_API_KEY);

export async function POST() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user?.email) {
    return Response.json(
      { error: 'Unauthorized - Please log in to send emails' },
      { status: 401 }
    );
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Acme <onboarding@xavierkhew.com>',
      to: [session.user.email],
      subject: 'Hello world',
      react: EmailTemplate({ firstName: session.user.name || 'User' }),
    });

    if (error) {
      console.error('Resend API error:', error);
      return Response.json({ error }, { status: 500 });
    }

    console.log('Email sent successfully:', data);
    return Response.json(data);
  } catch (error) {
    console.error('Failed to send email:', error);
    return Response.json({
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }, { status: 500 });
  }
}