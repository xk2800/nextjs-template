import { EmailTemplate } from '@/components/email/layout/base-layout';
import { EmailTemplate2 } from '@/components/email/marketing/general-announcement';
import { EmailTemplateWelcome } from '@/components/email/auth/welcome';
import { getResend, EMAIL_FROM } from '@/lib/email/resend';
import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/helpers';
import { unexpectedErrorMessage } from '@/lib/utils/errors';

export async function POST(request: Request) {
  // Demo endpoint: admins only, so users can't burn the Resend quota that
  // password resets share.
  const session = await requireAdminApi();
  if (session instanceof NextResponse) return session;

  try {
    const { template = '1' } = await request.json().catch(() => ({}));

    let emailTemplate;
    if (template === '2') {
      emailTemplate = EmailTemplate2({ firstName: session.user.name || 'User' });
    } else if (template === 'welcome') {
      emailTemplate = EmailTemplateWelcome({ firstName: session.user.name || 'User' });
    } else {
      emailTemplate = EmailTemplate({ firstName: session.user.name || 'User' });
    }

    const { data, error } = await (await getResend()).emails.send({
      from: EMAIL_FROM,
      to: [session.user.email],
      subject: 'Hello world',
      react: emailTemplate,
    });

    if (error) {
      return Response.json(
        { error: { message: unexpectedErrorMessage(error, 'Failed to send email') } },
        { status: 500 }
      );
    }

    console.log('Email sent successfully:', data);
    return Response.json(data);
  } catch (error) {
    return Response.json(
      { error: { message: unexpectedErrorMessage(error, 'Failed to send email') } },
      { status: 500 }
    );
  }
}