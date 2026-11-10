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

interface EmailTemplateInviteProps {
  firstName: string;
  url: string;
}

// Sent by the admin invite route (rides the reset-password flow, see server/auth.ts).
export function EmailTemplateInvite({ firstName, url }: EmailTemplateInviteProps) {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto max-w-[560px] px-0 pt-5 pb-12">
            <Section className="rounded-xl bg-[#f8f9fa] p-10 text-center">
              <Heading className="mb-3 text-[28px] font-bold text-[#1a1a1a]">
                You’re invited
              </Heading>
              <Text className="mb-8 text-base leading-6 text-[#666666]">
                Hi {firstName}, an admin invited you to join. Set a password with the button below, or just sign in with a social provider using this email address. This link expires in 7 days.
              </Text>
              <Section className="mb-8">
                <Button
                  href={url}
                  className="rounded-md bg-black px-8 py-3 text-base font-bold text-white no-underline"
                >
                  Set password and join
                </Button>
              </Section>
              <Text className="break-all text-[13px] leading-5 text-[#999999]">
                Or paste this link into your browser:<br />
                <a href={url} className="text-black underline">{url}</a>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
