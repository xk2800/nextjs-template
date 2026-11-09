import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Tailwind,
} from '@react-email/components';

interface EmailTemplateBannedProps {
  firstName: string;
  /** Shown in the subject line and body (config.APP_NAME). */
  appName: string;
  /** The reason the admin entered, if any. */
  reason?: string | null;
}

// Sent by the admin ban routes (single and bulk) when RESEND_API_KEY is set.
export function EmailTemplateBanned({ firstName, appName, reason }: EmailTemplateBannedProps) {
  return (
    <Html>
      <Head />
      <Preview>Your {appName} account has been suspended.</Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto max-w-[560px] px-0 pt-5 pb-12">
            <Section className="rounded-xl bg-[#f8f9fa] p-10">
              <Heading className="mb-3 text-2xl font-bold text-[#1a1a1a]">
                Your account has been suspended
              </Heading>
              <Text className="mb-6 text-base leading-6 text-[#666666]">
                Hi {firstName}, your {appName} account has been suspended and you can no longer sign in.
              </Text>
              {reason && (
                <Section className="mb-6 rounded border-0 border-l-4 border-solid border-[#f59e0b] bg-[#fffbeb] px-4 py-3">
                  <Text className="m-0 text-sm leading-5 text-[#92400e]">
                    <strong>Reason:</strong> {reason}
                  </Text>
                </Section>
              )}
              <Text className="text-sm leading-5 text-[#999999]">
                If you believe this is a mistake, reply to this email or contact support to appeal.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
