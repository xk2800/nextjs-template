import { EmailTemplate } from '@/components/email/email-template';
import { config } from '@/config/env';
import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';
import { auth } from '@/server/auth';
import { headers } from 'next/headers';

let resend: Resend;
function getResend() {
  if (!resend) resend = new Resend(config.RESEND_API_KEY);
  return resend;
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user?.email) {
    return Response.json(
      { error: 'Unauthorized - Please log in to send emails' },
      { status: 401 }
    );
  }

  const { data, error } = await getResend().emails.send({
    // from: 'Acme <onboarding@xavierkhew.com>',
    from: 'Acme <onboarding@xavierkhew.xyz>',
    to: [session.user.email],
    subject: 'Hello world',
    react: EmailTemplate({ firstName: session.user.name || 'User' }),
  });

  if (error) {
    return res.status(400).json(error);
  }

  res.status(200).json(data);
};