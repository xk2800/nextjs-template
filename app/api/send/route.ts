import { EmailTemplate } from '@/components/email/email-template';
import { EmailTemplate2 } from '@/components/email/email-template-2';
import { EmailTemplateWelcome } from '@/components/email/email-template-welcome';
import { getResend, EMAIL_FROM } from '@/lib/resend';
import { auth } from '@/server/auth';
import { headers } from 'next/headers';
import { unexpectedErrorMessage } from '@/lib/errors';

export async function POST(request: Request) {
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