import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Button,
  Tailwind,
} from '@react-email/components';

interface EmailTemplatePasskeyChangeProps {
  firstName: string;
  action: 'added' | 'removed';
  device: string;
  location: string;
  ipAddress: string;
  when: string;
  manageUrl?: string;
}

export function EmailTemplatePasskeyChange({
  firstName,
  action,
  device,
  location,
  ipAddress,
  when,
  manageUrl,
}: EmailTemplatePasskeyChangeProps) {
  const verb = action === 'added' ? 'added to' : 'removed from';

  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto max-w-[560px] px-0 pt-5 pb-12">
            <Section className="rounded-xl bg-[#f8f9fa] p-10">
              <Heading className="mb-3 text-center text-2xl font-bold text-[#1a1a1a]">
                A passkey was {action}
              </Heading>
              <Text className="mb-6 text-base leading-6 text-[#666666]">
                Hi {firstName}, a passkey was just {verb} your account.
              </Text>
              <Section className="mb-6 rounded-lg bg-white p-5">
                <Text className="m-0 mb-2 text-sm leading-5 text-[#1a1a1a]">
                  <strong>Device:</strong> {device}
                </Text>
                <Text className="m-0 mb-2 text-sm leading-5 text-[#1a1a1a]">
                  <strong>Approx. location:</strong> {location}
                </Text>
                <Text className="m-0 mb-2 text-sm leading-5 text-[#1a1a1a]">
                  <strong>IP address:</strong> {ipAddress}
                </Text>
                <Text className="m-0 text-sm leading-5 text-[#1a1a1a]">
                  <strong>When:</strong> {when}
                </Text>
              </Section>
              {manageUrl && (
                <Section className="mb-6 text-center">
                  <Button
                    href={manageUrl}
                    className="rounded-lg bg-[#1a1a1a] px-6 py-3 text-sm font-bold text-white no-underline"
                  >
                    Review your passkeys
                  </Button>
                </Section>
              )}
              <Text className="text-sm leading-[22px] text-[#666666]">
                If this was you, no action is needed. If you don&apos;t recognize it, change
                your password now and review your passkeys and active sessions.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
